"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useState } from "react";

type AppRole = "customer" | "promoter" | "admin" | "guest";

type AppHeaderProps = {
  role?: string | null;
  userLabel?: string | null;
  siteName?: string;
  logoUrl?: string;
};

type NavItem = {
  href: string;
  label: string;
  emphasis?: "primary" | "secondary";
};

const publicNav: NavItem[] = [
  { href: "/events", label: "Browse Events" },
  { href: "/login", label: "Customer Login" },
  { href: "/register", label: "Create Account" },
  { href: "/promoter/apply", label: "Become a Promoter", emphasis: "primary" },
  { href: "/promoter-login", label: "Promoter Login", emphasis: "secondary" },
];

const customerNav: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/events", label: "Browse Events" },
  { href: "/my-tickets", label: "My Tickets" },
  { href: "/order-history", label: "Order History" },
  { href: "/profile", label: "Profile" },
];

const promoterNav: NavItem[] = [
  { href: "/promoter", label: "Dashboard" },
  { href: "/promoter/events", label: "My Events" },
  { href: "/promoter/events/new", label: "Create Event" },
  { href: "/ai-image-studio", label: "AI Images" },
  { href: "/promoter/events", label: "Ticket Design Studio" },
  { href: "/promoter/event-day", label: "Event-Day" },
  { href: "/promoter/door-sales", label: "Door Sales" },
  { href: "/scanner", label: "Scanner" },
  { href: "/promoter/event-day#merchandise", label: "Merchandise" },
  { href: "/promoter/reports", label: "Reports" },
  { href: "/promoter/payout-settings", label: "Payouts" },
  { href: "/dashboard", label: "Account" },
];

const adminNav: NavItem[] = [
  { href: "/admin", label: "Admin" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/promoters", label: "Promoters" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/rebranding", label: "Rebranding" },
  { href: "/ai-image-studio", label: "AI Images" },
  { href: "/promoter", label: "Promoter View" },
  { href: "/promoter/event-day", label: "Event-Day" },
  { href: "/scanner", label: "Scanner" },
  { href: "/dashboard", label: "Account" },
];

export default function AppHeader({
  role,
  userLabel,
  siteName = "LaunchPad",
  logoUrl = "",
}: AppHeaderProps) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const normalizedRole = normalizeRole(role);
  const navItems = getNavItems(normalizedRole);
  const isSignedIn = normalizedRole !== "guest";
  const logoutUrl = normalizedRole === "promoter" ? "/promoter-login" : "/login";

  return (
    <header className="lp-header">
      <div className="lp-header-bar">
        <Link href="/" className="lp-brand" onClick={() => setOpen(false)}>
          <span className="lp-brand-mark">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" />
            ) : (
              getBrandInitials(siteName)
            )}
          </span>
          <span>
            <strong>{siteName}</strong>
            <small>{getBrandSubtext(normalizedRole, userLabel)}</small>
          </span>
        </Link>

        <button
          type="button"
          className="lp-menu-button"
          aria-expanded={open}
          aria-controls="launchpad-navigation"
          onClick={() => setOpen((current) => !current)}
        >
          <span className="lp-menu-lines" aria-hidden="true" />
          Menu
        </button>
      </div>

      <nav
        id="launchpad-navigation"
        className={`lp-nav ${open ? "is-open" : ""}`}
        aria-label="LaunchPad navigation"
      >
        {navItems.map((item) => (
          <Link
            key={`${item.href}-${item.label}`}
            href={item.href}
            className={[
              "lp-nav-link",
              item.emphasis ? `is-${item.emphasis}` : "",
              isActive(pathname, item.href) ? "is-active" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => setOpen(false)}
          >
            {item.label}
          </Link>
        ))}

        {isSignedIn ? (
          <button
            type="button"
            className="lp-nav-link lp-logout-button"
            onClick={() => signOut({ callbackUrl: logoutUrl })}
          >
            Logout
          </button>
        ) : null}
      </nav>
    </header>
  );
}

function getBrandInitials(siteName: string) {
  const words = siteName.trim().split(/\s+/).filter(Boolean);
  const initials = words.slice(0, 2).map((word) => word[0]).join("");
  return initials.toUpperCase() || "LP";
}

function normalizeRole(role?: string | null): AppRole {
  const value = String(role || "").toLowerCase();

  if (value === "admin" || value === "promoter" || value === "customer") {
    return value;
  }

  return "guest";
}

function getNavItems(role: AppRole) {
  if (role === "admin") {
    return adminNav;
  }

  if (role === "promoter") {
    return promoterNav;
  }

  if (role === "customer") {
    return customerNav;
  }

  return publicNav;
}

function getBrandSubtext(role: AppRole, userLabel?: string | null) {
  if (userLabel && role !== "guest") {
    return userLabel;
  }

  if (role === "admin") {
    return "Admin back office";
  }

  if (role === "promoter") {
    return "Promoter back office";
  }

  if (role === "customer") {
    return "Ticket wallet";
  }

  return "Tickets and event operations";
}

function isActive(pathname: string, href: string) {
  const cleanHref = href.split("#")[0];

  if (cleanHref === "/") {
    return pathname === "/";
  }

  return pathname === cleanHref || pathname.startsWith(`${cleanHref}/`);
}
