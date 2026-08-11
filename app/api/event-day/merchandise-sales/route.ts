import {
  canAccessEvent,
  getEventDayUser,
} from "@/app/lib/eventDayAuth";
import db from "@/app/lib/db";
import { NextResponse } from "next/server";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

type ItemRow = RowDataPacket & {
  name: string;
  price: number | string;
};

export async function POST(request: Request) {
  const user = await getEventDayUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const eventId = Number(body.event_id);
  const itemId = body.item_id ? Number(body.item_id) : null;
  const quantity = Number(body.quantity || 1);
  const paymentMethod = String(body.payment_method || "cash").toLowerCase();
  let itemName = String(body.item_name || "").trim();
  let unitPrice = Number(body.unit_price);

  if (
    !Number.isInteger(eventId) ||
    eventId <= 0 ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > 100
  ) {
    return NextResponse.json(
      { error: "Choose an event and valid merchandise quantity." },
      { status: 400 }
    );
  }

  if (paymentMethod !== "cash" && paymentMethod !== "card") {
    return NextResponse.json({ error: "Invalid payment method." }, { status: 400 });
  }

  if (!(await canAccessEvent(user, eventId, "sell"))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (itemId) {
    const [items] = await db.execute<ItemRow[]>(
      `
      SELECT name, price
      FROM event_merchandise_items
      WHERE id = ?
        AND event_id = ?
        AND active = 1
      LIMIT 1
      `,
      [itemId, eventId]
    );

    if (!items.length) {
      return NextResponse.json({ error: "Merchandise item not found." }, { status: 404 });
    }

    itemName = items[0].name;
    unitPrice = Number(items[0].price || 0);
  }

  if (!itemName || !Number.isFinite(unitPrice) || unitPrice < 0) {
    return NextResponse.json(
      { error: "Enter a merchandise item and valid price." },
      { status: 400 }
    );
  }

  const totalAmount = Number((unitPrice * quantity).toFixed(2));
  const [result] = await db.execute<ResultSetHeader>(
    `
    INSERT INTO event_merchandise_sales
      (
        event_id,
        item_id,
        item_name,
        unit_price,
        quantity,
        payment_method,
        payment_status,
        total_amount,
        sold_by_user_id
      )
    VALUES (?, ?, ?, ?, ?, ?, 'paid', ?, ?)
    `,
    [
      eventId,
      itemId,
      itemName,
      unitPrice,
      quantity,
      paymentMethod,
      totalAmount,
      user.id,
    ]
  );

  return NextResponse.json({
    success: true,
    sale: {
      id: result.insertId,
      eventId,
      itemId,
      itemName,
      unitPrice,
      quantity,
      paymentMethod,
      totalAmount,
    },
  });
}
