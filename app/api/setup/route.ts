import db from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        stripe_session_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(50),
        event_id INT,
        event_name VARCHAR(255),
        quantity INT,
        amount_paid DECIMAL(10,2),
        payment_status VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    return NextResponse.json({
      success: true,
      message: "Orders table created successfully!"
    });

  } catch (err: any) {
    return NextResponse.json({
      success: false,
      error: err.message
    });
  }
}