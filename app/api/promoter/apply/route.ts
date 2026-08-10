import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { auth } from "@/app/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return NextResponse.redirect(
        new URL("/login", req.url)
      );
    }

    const userId = Number(
      (session.user as any).id
    );

    const accountEmail = String(
      session.user.email || ""
    )
      .trim()
      .toLowerCase();

    const formData = await req.formData();

    const name = String(
      formData.get("name") || ""
    ).trim();

    const businessName = String(
      formData.get("business_name") || ""
    ).trim();

    const phone = String(
      formData.get("phone") || ""
    ).trim();

    const city = String(
      formData.get("city") || ""
    ).trim();

    const description = String(
      formData.get("description") || ""
    ).trim();

    if (
      !userId ||
      !accountEmail ||
      !name ||
      !businessName ||
      !city ||
      !description
    ) {
      return NextResponse.redirect(
        new URL(
          "/promoter/apply?error=missing",
          req.url
        )
      );
    }

    const [existing]: any = await db.execute(
      `
      SELECT id, status
      FROM promoter_requests
      WHERE user_id = ? OR LOWER(email) = ?
      ORDER BY id DESC
      LIMIT 1
      `,
      [userId, accountEmail]
    );

    if (existing.length) {
      const status = String(
        existing[0].status || ""
      ).toLowerCase();

      if (status === "pending") {
        return NextResponse.redirect(
          new URL(
            "/promoter/apply?status=pending",
            req.url
          )
        );
      }

      if (status === "approved") {
        return NextResponse.redirect(
          new URL(
            "/promoter-login?status=approved",
            req.url
          )
        );
      }
    }

    await db.execute(
      `
      INSERT INTO promoter_requests
      (
        user_id,
        name,
        email,
        business_name,
        phone,
        city,
        description,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userId,
        name,
        accountEmail,
        businessName,
        phone || null,
        city,
        description,
        "pending",
      ]
    );

    return NextResponse.redirect(
      new URL(
        "/promoter/apply?status=success",
        req.url
      )
    );
  } catch (error) {
    console.error(
      "Promoter application error:",
      error
    );

    return NextResponse.redirect(
      new URL(
        "/promoter/apply?error=server",
        req.url
      )
    );
  }
}