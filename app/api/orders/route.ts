import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "Orders are created by the Stripe webhook.",
    },
    { status: 405 }
  );
}