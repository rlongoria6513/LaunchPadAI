import { auth } from "@/app/auth";
import {
  createExpressAccountForUser,
  stripe,
} from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();

  if (!session || role !== "promoter" || userId <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await createExpressAccountForUser({
    userId,
    email: session.user?.email,
  });
  const origin =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.APP_URL ||
    request.headers.get("origin") ||
    "http://localhost:3000";
  const accountLink = await stripe.accountLinks.create({
    account: account.stripe_account_id,
    refresh_url: `${origin}/promoter/payout-settings?connect=refresh`,
    return_url: `${origin}/promoter/payout-settings?connect=return`,
    type: "account_onboarding",
  });

  return NextResponse.json({
    url: accountLink.url,
  });
}
