import Stripe from "stripe";
import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { getEventConnectReadiness } from "@/app/lib/stripeConnect";
import type { RowDataPacket } from "mysql2";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

type EventRow = RowDataPacket & {
  id: number;
  event_name: string;
  ticket_price: number | string;
};

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const { eventId, quantity } = await req.json();

    const targetEventId = Number(eventId);
    const ticketQuantity = Number(quantity) || 1;

    if (
      !Number.isInteger(targetEventId) ||
      targetEventId <= 0 ||
      !Number.isInteger(ticketQuantity) ||
      ticketQuantity < 1 ||
      ticketQuantity > 10
    ) {
      return NextResponse.json(
        { error: "Invalid checkout request." },
        { status: 400 }
      );
    }

    const [eventRows] = await db.execute<EventRow[]>(
      `
      SELECT id, event_name, ticket_price
      FROM events
      WHERE id = ?
      LIMIT 1
      `,
      [targetEventId]
    );

    if (!eventRows.length) {
      return NextResponse.json(
        { error: "Event not found." },
        { status: 404 }
      );
    }

    const event = eventRows[0];
    const eventName = event.event_name;
    const ticketPrice = Number(event.ticket_price || 0);

    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      return NextResponse.json(
        { error: "This event does not require Stripe checkout." },
        { status: 400 }
      );
    }

    // LaunchPad service fee PER ticket
    const serviceFee = 2;
    const serviceFeeTotal = serviceFee * ticketQuantity;
    const connectReadiness = await getEventConnectReadiness(event.id);

    if (connectReadiness.enabled && !connectReadiness.ready) {
      return NextResponse.json(
        {
          error:
            connectReadiness.reason ||
            "Stripe payout setup must be completed before paid checkout can open.",
        },
        { status: 403 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      metadata: {
        event_id: String(event.id),
        event_name: String(eventName),
        quantity: String(ticketQuantity),
        ticket_price: String(ticketPrice),
        service_fee: String(serviceFee),
        service_fee_total: String(serviceFeeTotal),
        stripe_connect_enabled: connectReadiness.ready ? "true" : "false",
        stripe_connected_account_id: connectReadiness.accountId || "",
      },

      payment_method_types: ["card"],
      payment_intent_data: connectReadiness.ready
        ? {
            application_fee_amount: Math.round(serviceFeeTotal * 100),
            on_behalf_of: connectReadiness.accountId || undefined,
            transfer_data: {
              destination: connectReadiness.accountId!,
            },
            metadata: {
              event_id: String(event.id),
              event_name: String(eventName),
              launchpad_service_fee_total: String(serviceFeeTotal),
              stripe_connected_account_id:
                connectReadiness.accountId || "",
            },
          }
        : undefined,

      line_items: [
        // EVENT TICKETS
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: eventName || "LaunchPad Ticket",
            },
            unit_amount: Math.round(ticketPrice * 100),
          },
          quantity: ticketQuantity,
        },

        // LAUNCHPAD SERVICE FEE
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "LaunchPad Service Fee",
              description: "$2 service fee per ticket",
            },
            unit_amount: serviceFee * 100,
          },
          quantity: ticketQuantity,
        },
      ],

      success_url: `${req.headers.get(
        "origin"
      )}/success?session_id={CHECKOUT_SESSION_ID}`,

      cancel_url: `${req.headers.get("origin")}/cancel`,
    });

    return NextResponse.json({
      id: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);

    const message =
      error instanceof Error ? error.message : "Stripe Checkout failed";

    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
