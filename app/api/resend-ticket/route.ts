import { NextRequest, NextResponse } from "next/server";
import db from "@/app/lib/db";
import { sendTicketEmail } from "@/app/lib/email";
import { generateQRCode } from "@/app/lib/qrcode";
import { generateTicketPDF } from "@/app/lib/pdf";

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({
        success: false,
        message: "Email is required.",
      });
    }

    const [orders]: any = await db.execute(
      `
      SELECT
        o.customer_name,
        o.customer_email,
        o.event_name,
        o.ticket_number,
        e.image_url
      FROM orders o
      LEFT JOIN events e
        ON o.event_id = e.id
      WHERE o.customer_email = ?
      ORDER BY o.created_at DESC
      `,
      [email]
    );

    if (!orders.length) {
      return NextResponse.json({
        success: false,
        message: "No tickets found for that email.",
      });
    }

    for (const order of orders) {
      const qrCode = await generateQRCode(order.ticket_number);
      const pdf = await generateTicketPDF({
  customerName: order.customer_name,
  eventName: order.event_name,
  ticketNumber: order.ticket_number,
  imageUrl: order.image_url,
  qrCode,
});

      await sendTicketEmail({
        to: order.customer_email,
        name: order.customer_name,
        eventName: order.event_name,
        ticketNumber: order.ticket_number,
        qrCode,
        imageUrl: order.image_url,
        pdf,
      });
    }

    return NextResponse.json({
      success: true,
      message: "Your tickets have been sent.",
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json({
      success: false,
      message: "Something went wrong.",
    });
  }
}