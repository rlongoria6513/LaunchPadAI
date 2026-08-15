import { auth } from "@/app/auth";
import { getAiSettings } from "@/app/lib/aiTools";
import { DEFAULT_FAL_TEXT_MODEL } from "@/app/lib/aiProviders/fal";
import Link from "next/link";
import { redirect } from "next/navigation";
import AiSettingsForm from "./AiSettingsForm";

type SessionUser = {
  role?: unknown;
};

export default async function AdminAiToolsPage() {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;

  if (!session) {
    redirect("/login");
  }

  if (String(user?.role || "").toLowerCase() !== "admin") {
    redirect("/dashboard");
  }

  const settings = await getAiSettings();

  return (
    <main className="lp-back-office-page">
      <div className="lp-page-shell">
        <div className="lp-page-header">
          <div>
            <p className="lp-page-kicker">Admin Control Center</p>
            <h1 className="lp-page-title">✨ LaunchPad AI Settings</h1>
            <p className="lp-page-copy">
              Control writing and promotional-video tools, access, and daily
              usage limits.
            </p>
          </div>

          <div className="ai-header-actions">
            <Link href="/ai-tools" className="lp-button">
              Open Writing Tools
            </Link>
            <Link href="/admin/ai-tools/video" className="lp-button">
              Open Video Creator
            </Link>
            <Link href="/admin" className="lp-button-secondary">
              Back to Admin
            </Link>
          </div>
        </div>

        <AiSettingsForm
          initialSettings={settings}
          apiKeyConfigured={Boolean(process.env.FAL_KEY)}
          modelName={process.env.FAL_TEXT_MODEL || DEFAULT_FAL_TEXT_MODEL}
        />
      </div>
    </main>
  );
}
