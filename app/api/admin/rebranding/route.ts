import { auth } from "@/app/auth";
import {
  resetBrandingSettings,
  saveBrandingSettings,
} from "@/app/lib/branding";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!session || String(user?.role || "").toLowerCase() !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminId = Number(user?.id || 0);

  try {
    const body = await request.json();
    const settings = body?.reset
      ? await resetBrandingSettings(adminId)
      : await saveBrandingSettings(body || {}, adminId);

    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      settings,
    });
  } catch (error) {
    console.error("Branding save error:", error);

    return NextResponse.json(
      { error: "Branding settings could not be saved." },
      { status: 500 }
    );
  }
}
