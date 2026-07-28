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

    console.log("eventId:", eventId);
    console.log("eventName:", eventName);
    console.log("price:", price);
    console.log("quantity:", quantity);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      metadata: {
        event_id: String(eventId),
        event_name: String(eventName),
        quantity: String(quantity || 1),
        ticket_price: String(price),
      },

      payment_method_types: ["card"],

      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: eventName || "LaunchPad Ticket",
            },
            unit_amount: Math.round(Number(price) * 100),
          },
          quantity: Number(quantity) || 1,
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