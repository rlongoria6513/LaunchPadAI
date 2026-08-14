import "./globals.css";
import { auth } from "@/app/auth";
import AppHeader from "@/app/components/AppHeader";

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
  const role = String(
    (session?.user as { role?: unknown } | undefined)?.role || ""
  ).toLowerCase();
  const userLabel =
    session?.user?.name || session?.user?.email || null;

  return (
    <html lang="en">
      <body>
        <AppHeader role={role} userLabel={userLabel} />
        {children}
      </body>
    </html>
  );
}
