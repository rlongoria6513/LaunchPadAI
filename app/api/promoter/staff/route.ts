import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { ensureEventStaffTable } from "@/app/lib/eventStaff";
import bcrypt from "bcryptjs";
import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { NextResponse } from "next/server";

type StaffRow = RowDataPacket & {
  assignment_id: number;
  user_id: number;
  name: string;
  email: string;
  event_id: number;
  event_name: string;
  can_scan: number;
  can_sell: number;
  can_comp: number;
  active: number;
};

async function getPromoter() {
  const session = await auth();
  const id = Number((session?.user as { id?: unknown } | undefined)?.id || 0);
  const role = String((session?.user as { role?: unknown } | undefined)?.role || "").toLowerCase();
  return session && id > 0 && (role === "promoter" || role === "admin") ? { id, role } : null;
}

export async function GET() {
  const promoter = await getPromoter();
  if (!promoter) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureEventStaffTable();
  const [rows] = await db.execute<StaffRow[]>(
    `SELECT s.id AS assignment_id,u.id AS user_id,u.name,u.email,e.id AS event_id,e.event_name,s.can_scan,s.can_sell,s.can_comp,s.active FROM event_staff s INNER JOIN users u ON u.id=s.user_id INNER JOIN events e ON e.id=s.event_id WHERE (?='admin' OR e.promoter_id=?) ORDER BY e.event_date ASC,u.name ASC`,
    [promoter.role, promoter.id]
  );
  return NextResponse.json({ assignments: rows });
}

export async function POST(request: Request) {
  const promoter = await getPromoter();
  if (!promoter) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  const name = String(body.name || "").trim();
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  const eventId = Number(body.eventId);
  if (!name || !email.includes("@") || password.length < 6 || !eventId) {
    return NextResponse.json({ error: "Enter a name, valid email, 6+ character PIN/password, and event." }, { status: 400 });
  }
  const [events] = await db.execute<RowDataPacket[]>("SELECT id FROM events WHERE id=? AND (?='admin' OR promoter_id=?) LIMIT 1", [eventId, promoter.role, promoter.id]);
  if (!events.length) return NextResponse.json({ error: "Event not found." }, { status: 404 });
  await ensureEventStaffTable();
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [existing] = await connection.execute<(RowDataPacket & { id: number; role: string })[]>("SELECT id,role FROM users WHERE LOWER(email)=? LIMIT 1", [email]);
    let userId: number;
    const passwordHash = await bcrypt.hash(password, 12);
    if (existing.length) {
      if (String(existing[0].role).toLowerCase() !== "staff") {
        await connection.rollback();
        return NextResponse.json({ error: "That email already belongs to a customer, promoter, or admin account." }, { status: 409 });
      }
      userId = existing[0].id;
      await connection.execute("UPDATE users SET name=?,password=? WHERE id=?", [name, passwordHash, userId]);
    } else {
      const [result] = await connection.execute<ResultSetHeader>("INSERT INTO users (name,email,password,role) VALUES (?,?,?,'staff')", [name, email, passwordHash]);
      userId = result.insertId;
    }
    await connection.execute(`INSERT INTO event_staff (event_id,user_id,can_scan,can_sell,can_comp,active) VALUES (?,?,?,?,?,1) ON DUPLICATE KEY UPDATE can_scan=VALUES(can_scan),can_sell=VALUES(can_sell),can_comp=VALUES(can_comp),active=1`, [eventId, userId, body.canScan ? 1 : 0, body.canSell ? 1 : 0, body.canComp ? 1 : 0]);
    await connection.commit();
    return NextResponse.json({ success: true });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return NextResponse.json({ error: "Could not create staff access." }, { status: 500 });
  } finally {
    connection.release();
  }
}

export async function PATCH(request: Request) {
  const promoter = await getPromoter();
  if (!promoter) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await request.json();
  await ensureEventStaffTable();
  const [result] = await db.execute<ResultSetHeader>(`UPDATE event_staff s INNER JOIN events e ON e.id=s.event_id SET s.active=? WHERE s.id=? AND (?='admin' OR e.promoter_id=?)`, [body.active ? 1 : 0, Number(body.assignmentId), promoter.role, promoter.id]);
  if (!result.affectedRows) return NextResponse.json({ error: "Assignment not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
