import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import EventDayConsole from "./EventDayConsole";

export default async function EventDayPage() {
  const session = await auth();
  const role = String(
    (session?.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();

  if (!session) {
    redirect("/promoter/login");
  }

  if (role !== "promoter" && role !== "admin") {
    redirect("/dashboard");
  }

  return <EventDayConsole />;
}
