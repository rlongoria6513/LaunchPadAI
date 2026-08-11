import db from "@/app/lib/db";
import Stripe from "stripe";
import type { ResultSetHeader, RowDataPacket } from "mysql2/promise";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export type ConnectAccountRow = RowDataPacket & {
  id: number;
  user_id: number;
  stripe_account_id: string;
  account_type: string;
  onboarding_status: string;
  charges_enabled: number | boolean;
  payouts_enabled: number | boolean;
  details_submitted: number | boolean;
  requirements_due: string | null;
  disabled_reason: string | null;
  default_currency: string | null;
  country: string | null;
  livemode: number | boolean;
  last_synced_at: string | Date | null;
  created_at: string | Date | null;
  updated_at: string | Date | null;
};

export type ConnectReadiness = {
  enabled: boolean;
  ready: boolean;
  accountId: string | null;
  reason: string | null;
};

type EventConnectRow = RowDataPacket & {
  id: number;
  promoter_id: number | null;
  stripe_account_id: string | null;
  details_submitted: number | boolean | null;
  charges_enabled: number | boolean | null;
  payouts_enabled: number | boolean | null;
  requirements_due: string | null;
};

export function isConnectCheckoutEnabled() {
  return (
    process.env.STRIPE_CONNECT_CHECKOUT_ENABLED === "true" ||
    process.env.NEXT_PUBLIC_STRIPE_CONNECT_CHECKOUT_ENABLED === "true"
  );
}

export async function getConnectAccountForUser(userId: number) {
  const [rows] = await db.execute<ConnectAccountRow[]>(
    `
    SELECT *
    FROM stripe_connect_accounts
    WHERE user_id = ?
    LIMIT 1
    `,
    [userId]
  );

  return rows[0] || null;
}

export async function createExpressAccountForUser({
  userId,
  email,
}: {
  userId: number;
  email?: string | null;
}) {
  const existing = await getConnectAccountForUser(userId);

  if (existing?.stripe_account_id) {
    return existing;
  }

  const account = await stripe.accounts.create({
    type: "express",
    email: email || undefined,
    capabilities: {
      card_payments: {
        requested: true,
      },
      transfers: {
        requested: true,
      },
    },
    metadata: {
      launchpad_user_id: String(userId),
    },
  });

  await upsertConnectAccount(userId, account);

  const created = await getConnectAccountForUser(userId);

  if (!created) {
    throw new Error("Stripe Connect account was not saved.");
  }

  return created;
}

export async function syncConnectAccount(userId: number) {
  const existing = await getConnectAccountForUser(userId);

  if (!existing?.stripe_account_id) {
    return null;
  }

  const account = await stripe.accounts.retrieve(existing.stripe_account_id);

  await upsertConnectAccount(userId, account);

  return getConnectAccountForUser(userId);
}

export async function upsertConnectAccount(
  userId: number,
  account: Stripe.Account
) {
  const requirementsDue = {
    currently_due: account.requirements?.currently_due || [],
    past_due: account.requirements?.past_due || [],
    eventually_due: account.requirements?.eventually_due || [],
    errors: account.requirements?.errors || [],
  };
  const onboardingStatus = getOnboardingStatus(account);

  await db.execute<ResultSetHeader>(
    `
    INSERT INTO stripe_connect_accounts
      (
        user_id,
        stripe_account_id,
        account_type,
        onboarding_status,
        charges_enabled,
        payouts_enabled,
        details_submitted,
        requirements_due,
        disabled_reason,
        default_currency,
        country,
        livemode,
        last_synced_at,
        updated_at
      )
    VALUES (?, ?, 'express', ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    ON DUPLICATE KEY UPDATE
      stripe_account_id = VALUES(stripe_account_id),
      onboarding_status = VALUES(onboarding_status),
      charges_enabled = VALUES(charges_enabled),
      payouts_enabled = VALUES(payouts_enabled),
      details_submitted = VALUES(details_submitted),
      requirements_due = VALUES(requirements_due),
      disabled_reason = VALUES(disabled_reason),
      default_currency = VALUES(default_currency),
      country = VALUES(country),
      livemode = VALUES(livemode),
      last_synced_at = NOW(),
      updated_at = NOW()
    `,
    [
      userId,
      account.id,
      onboardingStatus,
      account.charges_enabled ? 1 : 0,
      account.payouts_enabled ? 1 : 0,
      account.details_submitted ? 1 : 0,
      JSON.stringify(requirementsDue),
      account.requirements?.disabled_reason || null,
      account.default_currency || null,
      account.country || null,
      (account as Stripe.Account & { livemode?: boolean }).livemode
        ? 1
        : 0,
    ]
  );
}

export function isConnectAccountReady(
  account: Pick<
    ConnectAccountRow,
    | "stripe_account_id"
    | "details_submitted"
    | "charges_enabled"
    | "payouts_enabled"
    | "requirements_due"
  > | null
) {
  if (!account?.stripe_account_id) {
    return false;
  }

  if (
    !Boolean(account.details_submitted) ||
    !Boolean(account.charges_enabled) ||
    !Boolean(account.payouts_enabled)
  ) {
    return false;
  }

  const requirements = parseRequirements(account.requirements_due);

  return (
    requirements.currently_due.length === 0 &&
    requirements.past_due.length === 0
  );
}

export async function getEventConnectReadiness(
  eventId: number
): Promise<ConnectReadiness> {
  if (!isConnectCheckoutEnabled()) {
    return {
      enabled: false,
      ready: false,
      accountId: null,
      reason: null,
    };
  }

  const [rows] = await db.execute<EventConnectRow[]>(
    `
    SELECT
      e.id,
      e.promoter_id,
      sca.stripe_account_id,
      sca.details_submitted,
      sca.charges_enabled,
      sca.payouts_enabled,
      sca.requirements_due
    FROM events e
    LEFT JOIN stripe_connect_accounts sca
      ON e.promoter_id = sca.user_id
    WHERE e.id = ?
    LIMIT 1
    `,
    [eventId]
  );

  const event = rows[0];

  if (!event?.promoter_id) {
    return {
      enabled: false,
      ready: false,
      accountId: null,
      reason: null,
    };
  }

  const account = {
    stripe_account_id: event.stripe_account_id || "",
    details_submitted: event.details_submitted || 0,
    charges_enabled: event.charges_enabled || 0,
    payouts_enabled: event.payouts_enabled || 0,
    requirements_due: event.requirements_due,
  };

  if (!isConnectAccountReady(account)) {
    return {
      enabled: true,
      ready: false,
      accountId: event.stripe_account_id,
      reason:
        "The promoter must complete Stripe payout setup before paid checkout can open.",
    };
  }

  return {
    enabled: true,
    ready: true,
    accountId: event.stripe_account_id,
    reason: null,
  };
}

export function parseRequirements(value: string | object | null) {
  if (!value) {
    return {
      currently_due: [] as string[],
      past_due: [] as string[],
      eventually_due: [] as string[],
      errors: [] as unknown[],
    };
  }

  try {
    const parsed =
      typeof value === "string" ? JSON.parse(value) : value;

    return {
      currently_due: Array.isArray(parsed.currently_due)
        ? parsed.currently_due
        : [],
      past_due: Array.isArray(parsed.past_due) ? parsed.past_due : [],
      eventually_due: Array.isArray(parsed.eventually_due)
        ? parsed.eventually_due
        : [],
      errors: Array.isArray(parsed.errors) ? parsed.errors : [],
    };
  } catch {
    return {
      currently_due: [] as string[],
      past_due: [] as string[],
      eventually_due: [] as string[],
      errors: [] as unknown[],
    };
  }
}

function getOnboardingStatus(account: Stripe.Account) {
  if (
    account.details_submitted &&
    account.charges_enabled &&
    account.payouts_enabled &&
    !account.requirements?.currently_due?.length &&
    !account.requirements?.past_due?.length
  ) {
    return "ready";
  }

  if (account.requirements?.disabled_reason) {
    return "restricted";
  }

  if (account.details_submitted) {
    return "submitted";
  }

  return "incomplete";
}
