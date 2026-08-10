import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import ScannerClient from "./ScannerClient";

type SessionUserWithRole = {
  role?: unknown;
};

export default async function ScannerPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const role = String(
    (session.user as SessionUserWithRole | undefined)?.role || ""
  ).toLowerCase();

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  return <ScannerClient />;
}
