import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { recordStripeRefund } from "@/app/lib/stripeRefunds";
import { stripe } from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";
import type { RowDataPacket } from "mysql2";

type SessionUser = {
  role?: unknown;
};

type OrderRow = RowDataPacket & {
  id: number;
  stripe_payment_intent_id: string | null;
  stripe_connected_account_id: string | null;
  payment_status: string | null;
  refund_status: string | null;
  total_charged: number | string | null;
};

export async function POST(request: Request) {
  const session = await auth();
  const role = String(
    (session?.user as SessionUser | undefined)?.role || ""
  ).toLowerCase();

  if (!session || role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const orderId = Number(body.order_id);
  const amount = body.amount ? Number(body.amount) : null;

  if (!Number.isInteger(orderId) || orderId <= 0) {
    return NextResponse.json({ error: "Invalid order." }, { status: 400 });
  }

  const [rows] = await db.execute<OrderRow[]>(
    `
    SELECT
      id,
      stripe_payment_intent_id,
      stripe_connected_account_id,
      payment_status,
      refund_status,
      total_charged
    FROM orders
    WHERE id = ?
    LIMIT 1
    `,
    [orderId]
  );
  const order = rows[0];

  if (!order) {
    return NextResponse.json({ error: "Order not found." }, { status: 404 });
  }

  if (!order.stripe_connected_account_id) {
    return NextResponse.json(
      { error: "This refund endpoint is only enabled for Connect orders." },
      { status: 400 }
    );
  }

  if (!order.stripe_payment_intent_id) {
    return NextResponse.json(
      { error: "Missing Stripe PaymentIntent for this order." },
      { status: 400 }
    );
  }

  if (String(order.refund_status || "").toLowerCase() === "succeeded") {
    return NextResponse.json(
      { error: "This order already has a completed refund." },
      { status: 400 }
    );
  }

  const refund = await stripe.refunds.create({
    payment_intent: order.stripe_payment_intent_id,
    amount:
      amount && Number.isFinite(amount)
        ? Math.round(amount * 100)
        : undefined,
    reverse_transfer: true,
    refund_application_fee: true,
    metadata: {
      launchpad_order_id: String(order.id),
      launchpad_refund_rule:
        "reverse_transfer_and_refund_application_fee",
    },
  });

  await recordStripeRefund({
    refund,
    rawEvent: {
      source: "admin_api",
      refund,
    },
  });

  return NextResponse.json({
    success: true,
    refundId: refund.id,
    status: refund.status,
  });
}
