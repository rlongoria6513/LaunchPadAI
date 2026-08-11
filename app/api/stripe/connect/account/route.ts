import { auth } from "@/app/auth";
import {
  createExpressAccountForUser,
  getConnectAccountForUser,
  syncConnectAccount,
} from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function GET() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();

  if (!session || role !== "promoter" || userId <= 0) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const account = await syncConnectAccount(userId);

  return NextResponse.json({
    account: account || (await getConnectAccountForUser(userId)),
  });
}

export async function POST() {
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

  return NextResponse.json({
    success: true,
    account,
  });
}
