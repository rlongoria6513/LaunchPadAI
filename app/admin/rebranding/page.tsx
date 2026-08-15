import { auth } from "@/app/auth";
import { getBrandingSettings } from "@/app/lib/branding";
import Link from "next/link";
import { redirect } from "next/navigation";
import RebrandingForm from "./RebrandingForm";

type SessionUser = {
  role?: unknown;
};

export default async function AdminRebrandingPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const user = session.user as SessionUser | undefined;

  if (String(user?.role || "").toLowerCase() !== "admin") {
    redirect("/dashboard");
  }

  const settings = await getBrandingSettings();

  return (
    <main className="lp-back-office-page">
      <div className="lp-page-shell">
        <div className="lp-page-header">
          <div>
            <p className="lp-page-kicker">Admin Control Center</p>
            <h1 className="lp-page-title">Rebranding</h1>
            <p className="lp-page-copy">
              Customize global LaunchPad branding for the public shell,
              homepage headline, and footer. These controls are admin-only.
            </p>
          </div>

          <Link href="/admin" className="lp-button-secondary">
            Back to Admin
          </Link>
        </div>

        <RebrandingForm initialSettings={settings} />
      </div>
    </main>
  );
}
