import db from "@/app/lib/db";
import type Stripe from "stripe";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type MembershipStatus = {
  userId: number; status: string; allowed: boolean; inGrace: boolean;
  graceEndsAt: string | Date | null; trialStart: string | Date | null;
  trialEnd: string | Date | null; periodEnd: string | Date | null;
  cancelAtPeriodEnd: boolean; stripeCustomerId: string; stripeSubscriptionId: string;
  setupReady: boolean; message: string;
};
type SubRow = RowDataPacket & { user_id:number; status:string; grace_ends_at:string|Date|null; trial_start:string|Date|null; trial_end:string|Date|null; current_period_end:string|Date|null; cancel_at_period_end:number; stripe_customer_id:string|null; stripe_subscription_id:string|null };
let schemaPromise: Promise<void> | null = null;

export function ensurePromoterSubscriptionSchema() {
  if (!schemaPromise) schemaPromise = createSchema().catch(error => { schemaPromise = null; throw error; });
  return schemaPromise;
}
async function createSchema() {
  await db.execute(`CREATE TABLE IF NOT EXISTS promoter_subscription_settings (id TINYINT UNSIGNED PRIMARY KEY, launch_grace_days INT UNSIGNED NOT NULL DEFAULT 30, updated_by INT NULL, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP)`);
  await db.execute(`INSERT IGNORE INTO promoter_subscription_settings (id, launch_grace_days) VALUES (1, 30)`);
  await db.execute(`CREATE TABLE IF NOT EXISTS promoter_subscriptions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_id INT NOT NULL, stripe_customer_id VARCHAR(255) NULL,
    stripe_subscription_id VARCHAR(255) NULL, stripe_checkout_session_id VARCHAR(255) NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'none', trial_start DATETIME NULL, trial_end DATETIME NULL,
    current_period_end DATETIME NULL, cancel_at_period_end TINYINT(1) NOT NULL DEFAULT 0,
    grace_ends_at DATETIME NULL, last_invoice_status VARCHAR(32) NULL, last_error VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY promoter_subscription_user (user_id), UNIQUE KEY promoter_stripe_subscription (stripe_subscription_id),
    KEY promoter_subscription_status (status), KEY promoter_subscription_customer (stripe_customer_id)
  )`);
  await db.execute(`CREATE TABLE IF NOT EXISTS promoter_subscription_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, stripe_event_id VARCHAR(255) NULL, user_id INT NULL,
    event_type VARCHAR(100) NOT NULL, status VARCHAR(32) NULL, summary VARCHAR(500) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY promoter_event_stripe (stripe_event_id),
    KEY promoter_event_user_created (user_id, created_at)
  )`);
}

export async function initializePromoterGrace(userId: number) {
  await ensurePromoterSubscriptionSchema();
  await db.execute(`INSERT IGNORE INTO promoter_subscriptions (user_id, status, grace_ends_at)
    SELECT ?, 'none', DATE_ADD(UTC_TIMESTAMP(), INTERVAL launch_grace_days DAY) FROM promoter_subscription_settings WHERE id = 1`, [userId]);
}

export async function getMembershipStatus(userId: number, role: string): Promise<MembershipStatus> {
  if (role === "admin") return { userId, status:"admin", allowed:true, inGrace:false, graceEndsAt:null, trialStart:null, trialEnd:null, periodEnd:null, cancelAtPeriodEnd:false, stripeCustomerId:"", stripeSubscriptionId:"", setupReady:Boolean(process.env.STRIPE_PROMOTER_MONTHLY_PRICE_ID), message:"Admin access" };
  await initializePromoterGrace(userId);
  const [rows] = await db.execute<SubRow[]>(`SELECT * FROM promoter_subscriptions WHERE user_id = ? LIMIT 1`, [userId]);
  const row = rows[0]; const now = Date.now();
  const inGrace = Boolean(row?.grace_ends_at && new Date(row.grace_ends_at).getTime() > now);
  const active = row?.status === "active" || row?.status === "trialing";
  const allowed = active || inGrace;
  const message = allowed ? (inGrace && !active ? "Launch grace period active" : row.status === "trialing" ? "Free trial active" : "Membership active") : row?.status === "past_due" ? "Payment failed—update billing to restore promoter tools." : row?.status === "canceled" ? "Membership canceled—restart to use promoter tools." : "Promoter membership required.";
  return { userId, status: inGrace && !active ? "grace_period" : row?.status || "none", allowed, inGrace, graceEndsAt:row?.grace_ends_at||null, trialStart:row?.trial_start||null, trialEnd:row?.trial_end||null, periodEnd:row?.current_period_end||null, cancelAtPeriodEnd:Boolean(row?.cancel_at_period_end), stripeCustomerId:row?.stripe_customer_id||"", stripeSubscriptionId:row?.stripe_subscription_id||"", setupReady:Boolean(process.env.STRIPE_PROMOTER_MONTHLY_PRICE_ID), message };
}

export async function canUsePromoterTools(userId: number, role: string) { return (await getMembershipStatus(userId, role)).allowed; }

export async function saveCheckoutSession(userId:number, session:Stripe.Checkout.Session) {
  await ensurePromoterSubscriptionSchema();
  const customer = typeof session.customer === "string" ? session.customer : session.customer?.id || null;
  const subscription = typeof session.subscription === "string" ? session.subscription : session.subscription?.id || null;
  await db.execute(`INSERT INTO promoter_subscriptions (user_id, stripe_customer_id, stripe_subscription_id, stripe_checkout_session_id, status)
    VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE stripe_customer_id=COALESCE(VALUES(stripe_customer_id),stripe_customer_id), stripe_subscription_id=COALESCE(VALUES(stripe_subscription_id),stripe_subscription_id), stripe_checkout_session_id=VALUES(stripe_checkout_session_id), status=IF(VALUES(status)='checkout_started','checkout_started',status)`, [userId, customer, subscription, session.id, subscription ? "checkout_complete" : "checkout_started"]);
}

function stripeDate(value: unknown) { return typeof value === "number" && value > 0 ? new Date(value * 1000) : null; }
export async function upsertStripeSubscription(subscription: Stripe.Subscription, fallbackUserId?: number) {
  await ensurePromoterSubscriptionSchema();
  const sub = subscription as Stripe.Subscription & { current_period_end?: number; current_period_start?: number };
  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;
  let userId = Number(subscription.metadata?.launchpad_user_id || fallbackUserId || 0);
  if (!userId) { const [rows] = await db.execute<(RowDataPacket&{user_id:number})[]>(`SELECT user_id FROM promoter_subscriptions WHERE stripe_customer_id = ? OR stripe_subscription_id = ? LIMIT 1`, [customerId, subscription.id]); userId = Number(rows[0]?.user_id || 0); }
  if (!userId) throw new Error("Subscription is not linked to a LaunchPad promoter.");
  await db.execute(`INSERT INTO promoter_subscriptions (user_id,stripe_customer_id,stripe_subscription_id,status,trial_start,trial_end,current_period_end,cancel_at_period_end)
    VALUES (?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE stripe_customer_id=VALUES(stripe_customer_id),stripe_subscription_id=VALUES(stripe_subscription_id),status=VALUES(status),trial_start=VALUES(trial_start),trial_end=VALUES(trial_end),current_period_end=VALUES(current_period_end),cancel_at_period_end=VALUES(cancel_at_period_end),last_error=NULL`,
    [userId,customerId,subscription.id,subscription.status,stripeDate(subscription.trial_start),stripeDate(subscription.trial_end),stripeDate(sub.current_period_end),subscription.cancel_at_period_end?1:0]);
  return userId;
}

export async function claimStripeEvent(event: Stripe.Event) {
  await ensurePromoterSubscriptionSchema();
  const [result] = await db.execute<ResultSetHeader>(`INSERT IGNORE INTO promoter_subscription_events (stripe_event_id,event_type,summary) VALUES (?,?,?)`, [event.id,event.type,`Stripe event ${event.type}`]);
  return result.affectedRows === 1;
}
export async function addSubscriptionAudit(input:{userId:number|null;type:string;status?:string;summary:string;stripeEventId?:string|null}) { await ensurePromoterSubscriptionSchema(); await db.execute(`INSERT IGNORE INTO promoter_subscription_events (stripe_event_id,user_id,event_type,status,summary) VALUES (?,?,?,?,?)`,[input.stripeEventId||null,input.userId,input.type,input.status||null,input.summary.slice(0,500)]); }
export async function updateInvoiceStatus(subscriptionId:string, status:string, error?:string) { await ensurePromoterSubscriptionSchema(); await db.execute(`UPDATE promoter_subscriptions SET last_invoice_status=?,last_error=?,status=CASE WHEN ?='payment_failed' THEN 'past_due' ELSE status END WHERE stripe_subscription_id=?`,[status,error?.slice(0,500)||null,status,subscriptionId]); }

export async function setGracePeriod(userId:number, days:number, adminId:number) { await ensurePromoterSubscriptionSchema(); await initializePromoterGrace(userId); if (days<=0) await db.execute(`UPDATE promoter_subscriptions SET grace_ends_at=UTC_TIMESTAMP() WHERE user_id=?`,[userId]); else await db.execute(`UPDATE promoter_subscriptions SET grace_ends_at=DATE_ADD(GREATEST(COALESCE(grace_ends_at,UTC_TIMESTAMP()),UTC_TIMESTAMP()), INTERVAL ? DAY) WHERE user_id=?`,[Math.min(days,365),userId]); await addSubscriptionAudit({userId,type:"admin.grace_updated",summary:days<=0?`Grace ended by admin ${adminId}`:`Grace extended ${days} days by admin ${adminId}`}); }

export async function listPromoterSubscriptions() { await ensurePromoterSubscriptionSchema(); await db.execute(`INSERT IGNORE INTO promoter_subscriptions (user_id,status,grace_ends_at) SELECT u.id,'none',DATE_ADD(UTC_TIMESTAMP(),INTERVAL s.launch_grace_days DAY) FROM users u JOIN promoter_subscription_settings s ON s.id=1 WHERE LOWER(u.role)='promoter'`); const [rows]=await db.execute<RowDataPacket[]>(`SELECT u.id AS user_id,u.name,u.email,ps.* FROM users u LEFT JOIN promoter_subscriptions ps ON ps.user_id=u.id WHERE LOWER(u.role)='promoter' ORDER BY u.name,u.email`); return rows; }
export async function listSubscriptionEvents(limit=200) { await ensurePromoterSubscriptionSchema(); const [rows]=await db.execute<RowDataPacket[]>(`SELECT * FROM promoter_subscription_events ORDER BY created_at DESC LIMIT ${Math.min(limit,500)}`); return rows; }
