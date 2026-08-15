import { auth } from "@/app/auth";
import { getSmsSettings, saveSmsSettings } from "@/app/lib/ticketDelivery";
import { NextResponse } from "next/server";
type User = { id?: unknown; role?: unknown };
export async function GET() { if (!(await admin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); return NextResponse.json(await getSmsSettings()); }
export async function POST(request: Request) { const user = await admin(); if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 }); const body = await request.json().catch(() => ({})); return NextResponse.json(await saveSmsSettings(Boolean(body.enabled), user.id)); }
async function admin() { const session = await auth(); const user = session?.user as User | undefined; const id = Number(user?.id || 0); return session && String(user?.role || "").toLowerCase() === "admin" && id > 0 ? { id } : null; }
