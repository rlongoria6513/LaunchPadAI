import { NextResponse } from "next/server";
import db from "@/app/lib/db";
import { auth } from "@/app/auth";
import type { RowDataPacket } from "mysql2";

type SessionUser = {
  id?: unknown;
};

type ExistingRequestRow = RowDataPacket & {
  id: number;
  status: string | null;
};

export async function POST(req: Request) {
  try {
    const session = await auth();

    if (!session?.user) {
      return redirectTo(req, "/login");
    }

    const userId = Number(
      (session.user as SessionUser).id
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
      return redirectTo(req, "/promoter/apply?error=missing");
    }

    const [existing] = await db.execute<ExistingRequestRow[]>(
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
        return redirectTo(req, "/promoter/apply?status=pending");
      }

      if (status === "approved") {
        return redirectTo(req, "/promoter-login?status=approved");
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

    return redirectTo(req, "/promoter/apply?status=success");
  } catch (error) {
    console.error(
      "Promoter application error:",
      error
    );

    return redirectTo(req, "/promoter/apply?error=server");
  }
}

function redirectTo(req: Request, path: string) {
  return NextResponse.redirect(
    new URL(path, getRequestOrigin(req))
  );
}

function getRequestOrigin(req: Request) {
  const requestUrl = new URL(req.url);
  const forwardedHost = getFirstHeader(
    req.headers.get("x-forwarded-host")
  );
  const forwardedProto = getFirstHeader(
    req.headers.get("x-forwarded-proto")
  );
  const host = getFirstHeader(req.headers.get("host"));

  if (forwardedHost) {
    return `${
      forwardedProto || getProtoForHost(forwardedHost, requestUrl)
    }://${forwardedHost}`;
  }

  if (host) {
    return `${
      forwardedProto || getProtoForHost(host, requestUrl)
    }://${host}`;
  }

  return req.headers.get("origin") || requestUrl.origin;
}

function getFirstHeader(value: string | null) {
  return value?.split(",")[0]?.trim() || "";
}

function getProtoForHost(host: string, requestUrl: URL) {
  if (
    host.startsWith("localhost") ||
    host.startsWith("127.0.0.1")
  ) {
    return requestUrl.protocol.replace(":", "") || "http";
  }

  return "https";
}
