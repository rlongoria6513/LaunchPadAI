import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import EventDayConsole from "./EventDayConsole";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

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
  const userId=Number((session.user as {id?:unknown}).id||0); const membership=await getMembershipStatus(userId,role); if(!membership.allowed)redirect("/promoter/membership?required=1");

  return <EventDayConsole />;
}
