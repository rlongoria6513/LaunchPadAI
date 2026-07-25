import { NextResponse } from "next/server";
import mysql from "mysql2/promise";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    await connection.execute(
      `INSERT INTO users (name, email, password)
       VALUES (?, ?, ?)`,
      [name, email, hashedPassword]
    );

    await connection.end();

    return NextResponse.json(
      { message: "Account created successfully." },
      { status: 201 }
    );
  } catch (error: any) {
    console.error(error);

    if (error.code === "ER_DUP_ENTRY") {
      return NextResponse.json(
        { error: "That email is already registered." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Could not create account." },
      { status: 500 }
    );
  }
}