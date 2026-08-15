import db from "@/app/lib/db";
import type Stripe from "stripe";
import type { RowDataPacket } from "mysql2";
import { revokeLinksForStripePayment } from "@/app/lib/ticketDelivery";

export async function recordStripeRefund({
  refund,
  rawEvent,
}: {
  refund: Stripe.Refund;
  rawEvent?: unknown;
}) {
  const paymentIntentId = getStripeId(refund.payment_intent);
  const chargeId = getStripeId(refund.charge);
  const amount = refund.amount / 100;
  const refundWithConnectFields = refund as Stripe.Refund & {
    application_fee_amount?: number | null;
  };

  const [orderRows] = await db.execute<
    (RowDataPacket & {
      id: number;
      stripe_connected_account_id: string | null;
    })[]
  >(
    `
    SELECT id, stripe_connected_account_id
    FROM orders
    WHERE
      (stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id = ?)
      OR (stripe_charge_id IS NOT NULL AND stripe_charge_id = ?)
    ORDER BY id ASC
    LIMIT 1
    `,
    [paymentIntentId, chargeId]
  );
  const order = orderRows[0];

  await db.execute(
    `
    INSERT INTO stripe_refund_events
      (
        order_id,
        stripe_refund_id,
        stripe_payment_intent_id,
        stripe_charge_id,
        stripe_connected_account_id,
        amount,
        status,
        reason,
        reverse_transfer,
        refund_application_fee,
        raw_event
      )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      order_id = VALUES(order_id),
      stripe_payment_intent_id = VALUES(stripe_payment_intent_id),
      stripe_charge_id = VALUES(stripe_charge_id),
      stripe_connected_account_id = VALUES(stripe_connected_account_id),
      amount = VALUES(amount),
      status = VALUES(status),
      reason = VALUES(reason),
      reverse_transfer = VALUES(reverse_transfer),
      refund_application_fee = VALUES(refund_application_fee),
      raw_event = VALUES(raw_event)
    `,
    [
      order?.id || null,
      refund.id,
      paymentIntentId,
      chargeId,
      order?.stripe_connected_account_id || null,
      amount,
      refund.status || null,
      refund.reason || null,
      refund.transfer_reversal ? 1 : 0,
      refundWithConnectFields.application_fee_amount ? 1 : 0,
      rawEvent ? JSON.stringify(rawEvent) : null,
    ]
  );

  if (order?.id) {
    const [refundRows] = await db.execute<
      (RowDataPacket & { refunded_amount: number | string | null })[]
    >(
      `
      SELECT COALESCE(SUM(amount), 0) AS refunded_amount
      FROM stripe_refund_events
      WHERE order_id = ?
        AND (status IS NULL OR status NOT IN ('failed', 'canceled'))
      `,
      [order.id]
    );
    const refundedAmount = Number(refundRows[0]?.refunded_amount || 0);

    await db.execute(
      `
      UPDATE orders
      SET
        stripe_refund_id = ?,
        refund_status = ?,
        refunded_amount = ?
      WHERE id = ?
      `,
      [refund.id, refund.status || "unknown", refundedAmount, order.id]
    );
  }

  if (refund.status === "succeeded") {
    await db.execute(
      `UPDATE orders SET payment_status = 'refunded', refund_status = 'succeeded'
       WHERE (stripe_payment_intent_id = ? AND ? IS NOT NULL) OR (stripe_charge_id = ? AND ? IS NOT NULL)`,
      [paymentIntentId, paymentIntentId, chargeId, chargeId]
    );
    await revokeLinksForStripePayment(paymentIntentId, chargeId, "This order was refunded and its ticket link was revoked.");
  }
}

export function getStripeId(
  value: string | { id?: string } | null | undefined
) {
  if (!value) {
    return null;
  }

  return typeof value === "string" ? value : value.id || null;
}
