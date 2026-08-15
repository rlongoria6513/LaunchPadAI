import { auth } from "@/app/auth";
import {
  getAiSettings,
  getAiUsageToday,
  getDailyLimit,
} from "@/app/lib/aiTools";
import { redirect } from "next/navigation";
import AiToolsClient from "./AiToolsClient";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export default async function AiToolsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const role = String(user?.role || "").toLowerCase();
  const userId = Number(user?.id || 0);

  if (!session) {
    redirect("/promoter-login");
  }

  if (
    (role !== "admin" && role !== "promoter") ||
    !Number.isInteger(userId) ||
    userId <= 0
  ) {
    redirect("/dashboard");
  }
  const membership=await getMembershipStatus(userId,role); if(!membership.allowed)redirect("/promoter/membership?required=1");

  const [settings, usage] = await Promise.all([
    getAiSettings(),
    getAiUsageToday(userId),
  ]);
  const limit = getDailyLimit(settings, role);

  return (
    <main className="lp-back-office-page">
      <div className="lp-page-shell">
        <AiToolsClient
          role={role}
          settings={settings}
          limit={limit}
          initialUsage={{
            eventDescription: usage["event-description"] || 0,
            socialPost: usage["social-post"] || 0,
          }}
        />
      </div>
    </main>
  );
}
