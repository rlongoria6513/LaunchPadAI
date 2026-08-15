import db from "@/app/lib/db";
import type { ResultSetHeader, RowDataPacket } from "mysql2";

export type BrandingSettings = {
  siteName: string;
  logoUrl: string;
  primaryColor: string;
  accentColor: string;
  homepageHeadline: string;
  footerText: string;
  supportEmail: string;
  showPoweredBy: boolean;
};

type BrandingRow = RowDataPacket & {
  site_name: string | null;
  logo_url: string | null;
  primary_color: string | null;
  accent_color: string | null;
  homepage_headline: string | null;
  footer_text: string | null;
  support_email: string | null;
  show_powered_by: number | boolean | null;
};

export const DEFAULT_BRANDING: BrandingSettings = {
  siteName: "LaunchPad",
  logoUrl: "",
  primaryColor: "#14b8a6",
  accentColor: "#2563eb",
  homepageHeadline: "Sell Tickets. Run the Door. Get Paid.",
  footerText:
    "LaunchPad gives promoters one place to sell tickets online, run event-day operations, and manage payouts.",
  supportEmail: "",
  showPoweredBy: true,
};

const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

export async function getBrandingSettings() {
  try {
    const [rows] = await db.execute<BrandingRow[]>(
      `
      SELECT
        site_name,
        logo_url,
        primary_color,
        accent_color,
        homepage_headline,
        footer_text,
        support_email,
        show_powered_by
      FROM branding_settings
      WHERE id = 1
      LIMIT 1
      `
    );

    if (!rows.length) {
      return DEFAULT_BRANDING;
    }

    return normalizeBrandingRow(rows[0]);
  } catch (error) {
    console.error("Branding settings load failed:", error);
    return DEFAULT_BRANDING;
  }
}

export async function saveBrandingSettings(
  input: Partial<BrandingSettings>,
  updatedBy: number
) {
  const settings = sanitizeBrandingSettings(input);

  await db.execute<ResultSetHeader>(
    `
    INSERT INTO branding_settings (
      id,
      site_name,
      logo_url,
      primary_color,
      accent_color,
      homepage_headline,
      footer_text,
      support_email,
      show_powered_by,
      updated_by
    ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      site_name = VALUES(site_name),
      logo_url = VALUES(logo_url),
      primary_color = VALUES(primary_color),
      accent_color = VALUES(accent_color),
      homepage_headline = VALUES(homepage_headline),
      footer_text = VALUES(footer_text),
      support_email = VALUES(support_email),
      show_powered_by = VALUES(show_powered_by),
      updated_by = VALUES(updated_by)
    `,
    [
      settings.siteName,
      settings.logoUrl || null,
      settings.primaryColor,
      settings.accentColor,
      settings.homepageHeadline,
      settings.footerText,
      settings.supportEmail,
      settings.showPoweredBy ? 1 : 0,
      updatedBy || null,
    ]
  );

  return settings;
}

export async function resetBrandingSettings(updatedBy: number) {
  return saveBrandingSettings(DEFAULT_BRANDING, updatedBy);
}

export function sanitizeBrandingSettings(input: Partial<BrandingSettings>) {
  const siteName = normalizeText(input.siteName, 120) || DEFAULT_BRANDING.siteName;
  const logoUrl = normalizeLogoUrl(input.logoUrl || "");
  const primaryColor = normalizeColor(
    input.primaryColor,
    DEFAULT_BRANDING.primaryColor
  );
  const accentColor = normalizeColor(
    input.accentColor,
    DEFAULT_BRANDING.accentColor
  );
  const homepageHeadline =
    normalizeText(input.homepageHeadline, 160) ||
    DEFAULT_BRANDING.homepageHeadline;
  const footerText =
    normalizeText(input.footerText, 255) || DEFAULT_BRANDING.footerText;
  const supportEmail = normalizeEmail(input.supportEmail || "");

  return {
    siteName,
    logoUrl,
    primaryColor,
    accentColor,
    homepageHeadline,
    footerText,
    supportEmail,
    showPoweredBy: Boolean(input.showPoweredBy),
  };
}

function normalizeBrandingRow(row: BrandingRow): BrandingSettings {
  return sanitizeBrandingSettings({
    siteName: row.site_name || DEFAULT_BRANDING.siteName,
    logoUrl: row.logo_url || "",
    primaryColor: row.primary_color || DEFAULT_BRANDING.primaryColor,
    accentColor: row.accent_color || DEFAULT_BRANDING.accentColor,
    homepageHeadline:
      row.homepage_headline || DEFAULT_BRANDING.homepageHeadline,
    footerText: row.footer_text || DEFAULT_BRANDING.footerText,
    supportEmail: row.support_email || "",
    showPoweredBy: Boolean(row.show_powered_by),
  });
}

function normalizeText(value: unknown, maxLength: number) {
  return String(value || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, maxLength);
}

function normalizeColor(value: unknown, fallback: string) {
  const color = String(value || "").trim();
  return HEX_COLOR_PATTERN.test(color) ? color.toLowerCase() : fallback;
}

function normalizeEmail(value: string) {
  const email = normalizeText(value, 254).toLowerCase();
  return email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function normalizeLogoUrl(value: string) {
  const logoUrl = normalizeText(value, 512);

  if (!logoUrl) {
    return "";
  }

  if (logoUrl.startsWith("/")) {
    return logoUrl;
  }

  try {
    const url = new URL(logoUrl);
    return url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
