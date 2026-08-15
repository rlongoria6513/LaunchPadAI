import "./globals.css";
import { auth } from "@/app/auth";
import AppHeader from "@/app/components/AppHeader";
import { getBrandingSettings } from "@/app/lib/branding";
import type { CSSProperties } from "react";

export const metadata = {
  title: "LaunchPad Tickets",
  description: "Sell tickets, run event-day operations, and browse events.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const branding = await getBrandingSettings();
  const role = String(
    (session?.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();
  const userLabel =
    session?.user?.name || session?.user?.email || null;

  return (
    <html lang="en">
      <body
        style={
          {
            "--lp-primary": branding.primaryColor,
            "--lp-accent": branding.accentColor,
          } as CSSProperties
        }
      >
        <AppHeader
          role={role}
          userLabel={userLabel}
          siteName={branding.siteName}
          logoUrl={branding.logoUrl}
        />
        {children}
        <footer className="lp-footer">
          <div className="lp-footer-inner">
            <strong>{branding.siteName}</strong>
            <span>{branding.footerText}</span>
            {branding.supportEmail ? (
              <a href={`mailto:${branding.supportEmail}`}>
                {branding.supportEmail}
              </a>
            ) : null}
            {branding.showPoweredBy ? (
              <small>Powered by LaunchPad</small>
            ) : null}
          </div>
        </footer>
      </body>
    </html>
  );
}
