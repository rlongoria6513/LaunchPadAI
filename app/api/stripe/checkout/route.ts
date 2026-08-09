import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(req: Request) {
  try {
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json(
        { error: "Missing STRIPE_SECRET_KEY" },
        { status: 500 }
      );
    }

    const { eventId, eventName, price, quantity } = await req.json();

    const ticketPrice = Number(price);
    const ticketQuantity = Number(quantity) || 1;

    // LaunchPad service fee PER ticket
    const serviceFee = 2;

    console.log("eventId:", eventId);
    console.log("eventName:", eventName);
    console.log("ticketPrice:", ticketPrice);
    console.log("quantity:", ticketQuantity);
    console.log("serviceFee:", serviceFee);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      metadata: {
        event_id: String(eventId),
        event_name: String(eventName),
        quantity: String(ticketQuantity),
        ticket_price: String(ticketPrice),
        service_fee: String(serviceFee),
        service_fee_total: String(serviceFee * ticketQuantity),
      },

      payment_method_types: ["card"],

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