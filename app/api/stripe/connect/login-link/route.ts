import { auth } from "@/app/auth";
import {
  getConnectAccountForUser,
  stripe,
} from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function POST() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();

  if (!session || role !== "promoter" || userId <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await getConnectAccountForUser(userId);

  if (!account?.stripe_account_id) {
    return NextResponse.json(
      { error: "Connect account not found." },
      { status: 404 }
    );
  }

  const link = await stripe.accounts.createLoginLink(
    account.stripe_account_id
  );

  return NextResponse.json({
    url: link.url,
  });
}
