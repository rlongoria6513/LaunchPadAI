import { auth } from "@/app/auth";
import { saveAiSettings } from "@/app/lib/aiTools";
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

  try {
    const body = await request.json();
    const settings = await saveAiSettings(body || {}, Number(user?.id || 0));

    return NextResponse.json({ success: true, settings });
  } catch (error) {
    console.error("AI settings save failed:", error);
    return NextResponse.json(
      { error: "AI settings could not be saved." },
      { status: 500 }
    );
  }
}
