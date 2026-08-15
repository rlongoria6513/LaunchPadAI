import db from "@/app/lib/db";
import { createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";
import { isTwilioConfigured, normalizePhone, sendSms } from "@/app/lib/sms";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type LinkRow = RowDataPacket & { id: number; public_id: string; revoked_at: string | Date | null; revoke_reason: string | null };
export type DeliveryStatus = { sms: "sent" | "failed" | "disabled" | "not-requested"; message: string };
let schemaPromise: Promise<void> | null = null;

export function ensureTicketDeliverySchema() {
  if (!schemaPromise) schemaPromise = createSchema().catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}

async function createSchema() {
  await db.execute(`CREATE TABLE IF NOT EXISTS ticket_delivery_settings (
    id TINYINT UNSIGNED NOT NULL PRIMARY KEY, sms_enabled TINYINT(1) NOT NULL DEFAULT 0,
    updated_by INT NULL, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);
  await db.execute(`INSERT IGNORE INTO ticket_delivery_settings (id, sms_enabled) VALUES (1, 0)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS ticket_delivery_links (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, public_id CHAR(48) NOT NULL,
    group_key VARCHAR(255) NOT NULL, revoked_at DATETIME NULL, revoke_reason VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY delivery_public_id (public_id), UNIQUE KEY delivery_group_key (group_key)
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS ticket_delivery_link_orders (
    link_id BIGINT UNSIGNED NOT NULL, order_id INT NOT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (link_id, order_id), UNIQUE KEY delivery_order (order_id), KEY delivery_link (link_id)
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS ticket_delivery_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY, link_id BIGINT UNSIGNED NULL,
    order_id INT NULL, channel VARCHAR(16) NOT NULL, recipient VARCHAR(255) NOT NULL,
    status VARCHAR(24) NOT NULL, provider_id VARCHAR(255) NULL, error_message VARCHAR(500) NULL,
    idempotency_key VARCHAR(255) NOT NULL, attempted_by INT NULL, created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY delivery_idempotency (idempotency_key), KEY delivery_log_created (created_at), KEY delivery_log_link (link_id)
  )`);
}

function signingSecret() {
  const secret = process.env.TICKET_LINK_SECRET || process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("The server authentication secret is not configured.");
  return secret;
}

function signature(publicId: string) {
  return createHmac("sha256", signingSecret()).update(`launchpad-ticket:${publicId}`).digest("base64url");
}

export function ticketPath(publicId: string) { return `/mobile-tickets/${publicId}.${signature(publicId)}`; }
export function absoluteTicketUrl(publicId: string) {
  const base = String(process.env.APP_URL || process.env.NEXTAUTH_URL || "").replace(/\/$/, "");
  if (!base) throw new Error("APP_URL or NEXTAUTH_URL is required for delivery links.");
  return `${base}${ticketPath(publicId)}`;
}

export async function ensureTicketLink(groupKey: string, orderIds: number[]) {
  await ensureTicketDeliverySchema();
  const publicId = randomBytes(30).toString("base64url").slice(0, 48);
  await db.execute(`INSERT INTO ticket_delivery_links (public_id, group_key) VALUES (?, ?) ON DUPLICATE KEY UPDATE group_key = VALUES(group_key)`, [publicId, groupKey]);
  const [rows] = await db.execute<LinkRow[]>(`SELECT id, public_id, revoked_at, revoke_reason FROM ticket_delivery_links WHERE group_key = ? LIMIT 1`, [groupKey]);
  const link = rows[0];
  for (const orderId of orderIds) await db.execute(`INSERT IGNORE INTO ticket_delivery_link_orders (link_id, order_id) VALUES (?, ?)`, [link.id, orderId]);
  return { id: Number(link.id), publicId: link.public_id, path: ticketPath(link.public_id), url: absoluteTicketUrl(link.public_id) };
}

export async function validateTicketToken(token: string) {
  await ensureTicketDeliverySchema();
  const split = token.lastIndexOf("."); if (split < 1) return null;
  const publicId = token.slice(0, split); const supplied = token.slice(split + 1);
  const expected = signature(publicId);
  const a = Buffer.from(supplied); const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const [rows] = await db.execute<LinkRow[]>(`SELECT id, public_id, revoked_at, revoke_reason FROM ticket_delivery_links WHERE public_id = ? LIMIT 1`, [publicId]);
  return rows[0] || null;
}

export async function getSmsSettings() {
  await ensureTicketDeliverySchema();
  const [rows] = await db.execute<(RowDataPacket & { sms_enabled: number })[]>(`SELECT sms_enabled FROM ticket_delivery_settings WHERE id = 1`);
  return { enabled: Boolean(rows[0]?.sms_enabled), configured: isTwilioConfigured() };
}

export async function saveSmsSettings(enabled: boolean, userId: number) {
  await ensureTicketDeliverySchema();
  await db.execute(`UPDATE ticket_delivery_settings SET sms_enabled = ?, updated_by = ? WHERE id = 1`, [enabled ? 1 : 0, userId]);
  return getSmsSettings();
}

export async function deliverTicketText(input: { linkId: number; publicId: string; phone: string; eventName: string; idempotencyKey: string; attemptedBy?: number | null; force?: boolean }): Promise<DeliveryStatus> {
  const settings = await getSmsSettings();
  if (!input.phone) return { sms: "not-requested", message: "No mobile number was provided. Display or print the ticket now." };
  if (!settings.enabled && !input.force) return { sms: "disabled", message: "SMS delivery is disabled. Display, copy, or print the secure ticket link." };
  if (!settings.configured) return { sms: "failed", message: "SMS is not configured. Display, copy, or print the secure ticket link." };
  let phone: string;
  try { phone = normalizePhone(input.phone); } catch (error) { return { sms: "failed", message: error instanceof Error ? error.message : "Invalid mobile number." }; }
  const [insert] = await db.execute<ResultSetHeader>(`INSERT IGNORE INTO ticket_delivery_logs (link_id, channel, recipient, status, idempotency_key, attempted_by) VALUES (?, 'sms', ?, 'sending', ?, ?)`, [input.linkId, phone, input.idempotencyKey, input.attemptedBy || null]);
  if (insert.affectedRows === 0) return { sms: "sent", message: "This delivery request was already processed." };
  try {
    const result = await sendSms(phone, `LaunchPad ticket${input.eventName ? ` for ${input.eventName}` : ""}: ${absoluteTicketUrl(input.publicId)} Reply STOP to opt out, HELP for help.`);
    await db.execute(`UPDATE ticket_delivery_logs SET status = 'sent', provider_id = ?, error_message = NULL WHERE idempotency_key = ?`, [result.providerId, input.idempotencyKey]);
    return { sms: "sent", message: "Secure ticket link sent by text." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "SMS delivery failed.";
    await db.execute(`UPDATE ticket_delivery_logs SET status = 'failed', error_message = ? WHERE idempotency_key = ?`, [message.slice(0, 500), input.idempotencyKey]);
    return { sms: "failed", message: "Text delivery failed. Display, copy, or print the ticket now; it can be resent later." };
  }
}

export async function logEmailDelivery(input: { linkId: number; orderId: number; email: string; status: "sent" | "failed"; error?: string; idempotencyKey: string }) {
  await ensureTicketDeliverySchema();
  await db.execute(`INSERT INTO ticket_delivery_logs (link_id, order_id, channel, recipient, status, error_message, idempotency_key) VALUES (?, ?, 'email', ?, ?, ?, ?) ON DUPLICATE KEY UPDATE status = VALUES(status), error_message = VALUES(error_message)`, [input.linkId, input.orderId, input.email, input.status, input.error?.slice(0, 500) || null, input.idempotencyKey]);
}

export async function revokeLinksForStripePayment(paymentIntentId: string | null, chargeId: string | null, reason: string) {
  await ensureTicketDeliverySchema();
  await db.execute(`UPDATE ticket_delivery_links l JOIN ticket_delivery_link_orders lo ON lo.link_id = l.id JOIN orders o ON o.id = lo.order_id SET l.revoked_at = UTC_TIMESTAMP(), l.revoke_reason = ? WHERE (o.stripe_payment_intent_id = ? AND ? IS NOT NULL) OR (o.stripe_charge_id = ? AND ? IS NOT NULL)`, [reason, paymentIntentId, paymentIntentId, chargeId, chargeId]);
}

export async function listDeliveryLogs(limit = 100) {
  await ensureTicketDeliverySchema();
  const safe = Math.max(1, Math.min(250, Math.trunc(limit)));
  const [rows] = await db.execute<RowDataPacket[]>(`SELECT dl.*, l.public_id,
    COALESCE(o.event_name, (SELECT o2.event_name FROM ticket_delivery_link_orders lo2 JOIN orders o2 ON o2.id = lo2.order_id WHERE lo2.link_id = dl.link_id LIMIT 1)) AS event_name,
    COALESCE(o.customer_name, (SELECT o3.customer_name FROM ticket_delivery_link_orders lo3 JOIN orders o3 ON o3.id = lo3.order_id WHERE lo3.link_id = dl.link_id LIMIT 1)) AS customer_name
    FROM ticket_delivery_logs dl LEFT JOIN ticket_delivery_links l ON l.id = dl.link_id LEFT JOIN orders o ON o.id = dl.order_id ORDER BY dl.created_at DESC LIMIT ${safe}`);
  return rows;
}

export function newResendKey(prefix: string) { return `${prefix}:resend:${randomUUID()}`; }
