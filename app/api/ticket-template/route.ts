import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { auth } from "@/app/auth";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";
import type { RowDataPacket } from "mysql2";

export async function POST(request: Request) {
  try {
    const session=await auth(); const userId=Number((session?.user as {id?:unknown}|undefined)?.id||0); const role=String((session?.user as {role?:unknown}|undefined)?.role||"").toLowerCase();
    if(!session||(role!=="admin"&&role!=="promoter"))return NextResponse.json({error:"Unauthorized"},{status:401});
    const membership=await getMembershipStatus(userId,role); if(!membership.allowed)return NextResponse.json({error:membership.message,membershipUrl:"/promoter/membership"},{status:402});
    const body = await request.json();

    const eventId = Number(body.eventId);
    const template = body.template;

    if (!eventId || !template) {
      return NextResponse.json(
        { error: "Missing event ID or template." },
        { status: 400 }
      );
    }
    const [owned]=await db.execute<RowDataPacket[]>(`SELECT id FROM events WHERE id=? AND (?='admin' OR promoter_id=?) LIMIT 1`,[eventId,role,userId]);
    if(!owned.length)return NextResponse.json({error:"Event not found or access denied."},{status:404});

    await db.execute(
      `
      UPDATE events
      SET ticket_template = ?
      WHERE id = ?
      `,
      [JSON.stringify(template), eventId]
    );

    return NextResponse.json({
      success: true,
      message: "Ticket template saved.",
    });
  } catch (error) {
    console.error("Ticket template save error:", error);

    return NextResponse.json(
      { error: "Could not save ticket template." },
      { status: 500 }
    );
  }
}
