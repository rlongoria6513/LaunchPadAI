import db from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const {
      stripe_session_id,
      customer_name,
      customer_email,
      customer_phone,
      event_id,
      event_name,
      quantity,
      amount_paid,
      payment_status,
    } = await req.json();

    await db.execute(
      `
      INSERT INTO orders (
        stripe_session_id,
        customer_name,
        customer_email,
        customer_phone,
        event_id,
        event_name,
        quantity,
        amount_paid,
        payment_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        stripe_session_id,
        customer_name,
        customer_email,
        customer_phone,
        event_id,
        event_name,
        quantity,
        amount_paid,
        payment_status,
      ]
    );

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}