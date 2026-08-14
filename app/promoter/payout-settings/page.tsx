import { auth } from "@/app/auth";
import {
  getConnectAccountForUser,
  isConnectAccountReady,
  parseRequirements,
  stripe,
  syncConnectAccount,
} from "@/app/lib/stripeConnect";
import Link from "next/link";
import { redirect } from "next/navigation";
import PayoutSettingsActions from "./PayoutSettingsActions";
import type Stripe from "stripe";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

export default async function PayoutSettingsPage() {
  const session = await auth();
  const sessionUser = session?.user as SessionUser | undefined;
  const userId = Number(sessionUser?.id || 0);
  const role = String(sessionUser?.role || "").toLowerCase();

  if (!session) {
    redirect("/promoter/login");
  }

  if (role !== "promoter") {
    redirect("/dashboard");
  }

  const synced = await syncConnectAccount(userId);
  const account = synced || (await getConnectAccountForUser(userId));
  const requirements = parseRequirements(account?.requirements_due || null);
  const ready = isConnectAccountReady(account);
  const balance = account?.stripe_account_id
    ? await safeRetrieveBalance(account.stripe_account_id)
    : null;
  const payouts = account?.stripe_account_id
    ? await safeListPayouts(account.stripe_account_id)
    : [];

  return (
    <main className="payout-page">
      <style>{styles}</style>

      <div className="payout-shell">
        <Link href="/promoter" className="back-link">
          Back to Command Center
        </Link>

        <header className="payout-header">
          <p>Payout Settings</p>
          <h1>Stripe Express Payouts</h1>
          <span>
            Connect and manage payout setup through Stripe. LaunchPad does not
            store bank account details.
          </span>
        </header>

        <section className="status-card">
          <div>
            <span className={`status-pill ${ready ? "ready" : "pending"}`}>
              {ready ? "Ready for paid checkout" : "Setup required"}
            </span>
            <h2>Account Status</h2>
            <p>
              {account?.stripe_account_id
                ? account.stripe_account_id
                : "No Stripe Express account connected yet."}
            </p>
          </div>

          <PayoutSettingsActions hasAccount={Boolean(account)} />
        </section>

        <section className="metric-grid">
          <Metric
            label="Details Submitted"
            value={account?.details_submitted ? "Yes" : "No"}
          />
          <Metric
            label="Charges Enabled"
            value={account?.charges_enabled ? "Yes" : "No"}
          />
          <Metric
            label="Payouts Enabled"
            value={account?.payouts_enabled ? "Yes" : "No"}
          />
          <Metric
            label="Onboarding"
            value={account?.onboarding_status || "not_started"}
          />
        </section>

        <section className="panel">
          <h2>Requirements</h2>
          {requirements.currently_due.length || requirements.past_due.length ? (
            <div className="requirements">
              {[...requirements.currently_due, ...requirements.past_due].map(
                (requirement) => (
                  <span key={requirement}>{requirement}</span>
                )
              )}
            </div>
          ) : (
            <p className="muted">No blocking requirements are currently due.</p>
          )}
          {account?.disabled_reason ? (
            <p className="error-text">{account.disabled_reason}</p>
          ) : null}
        </section>

        <section className="split-grid">
          <div className="panel">
            <h2>Balance</h2>
            {balance ? (
              <>
                <BalanceList title="Available" items={balance.available} />
                <BalanceList title="Pending" items={balance.pending} />
              </>
            ) : (
              <p className="muted">Balance appears after Stripe setup starts.</p>
            )}
          </div>

          <div className="panel">
            <h2>Payout History</h2>
            {payouts.length ? (
              <div className="payout-list">
                {payouts.map((payout) => (
                  <article key={payout.id}>
                    <strong>{formatCents(payout.amount, payout.currency)}</strong>
                    <span>{payout.status}</span>
                    <span>
                      Arrival:{" "}
                      {payout.arrival_date
                        ? new Date(payout.arrival_date * 1000).toLocaleDateString()
                        : "not set"}
                    </span>
                  </article>
                ))}
              </div>
            ) : (
              <p className="muted">
                Stripe payout history will appear here when payouts exist.
              </p>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function BalanceList({
  title,
  items,
}: {
  title: string;
  items: Stripe.Balance.Available[];
}) {
  return (
    <div className="balance-list">
      <h3>{title}</h3>
      {items.length ? (
        items.map((item) => (
          <p key={`${title}-${item.currency}`}>
            {formatCents(item.amount, item.currency)}
          </p>
        ))
      ) : (
        <p className="muted">$0.00</p>
      )}
    </div>
  );
}

async function safeRetrieveBalance(accountId: string) {
  try {
    return await stripe.balance.retrieve({}, { stripeAccount: accountId });
  } catch {
    return null;
  }
}

async function safeListPayouts(accountId: string) {
  try {
    const payouts = await stripe.payouts.list(
      { limit: 10 },
      { stripeAccount: accountId }
    );

    return payouts.data;
  } catch {
    return [];
  }
}

function formatCents(amount: number, currency: string) {
  return (amount / 100).toLocaleString("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  });
}

const styles = `
  .payout-page {
    min-height: 100vh;
    background:
      radial-gradient(circle at top left, rgba(14, 165, 233, 0.18), transparent 32%),
      linear-gradient(135deg, #07111f 0%, #111827 54%, #1e1b4b 100%);
    color: white;
    padding: 34px 16px 70px;
    font-family: Arial, sans-serif;
  }
  .payout-shell {
    max-width: 1120px;
    margin: 0 auto;
  }
  .back-link {
    color: #93c5fd;
    font-weight: 800;
    text-decoration: none;
  }
  .payout-header {
    margin: 26px 0;
  }
  .payout-header p {
    color: #67e8f9;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 0 0 8px;
    text-transform: uppercase;
  }
  .payout-header h1 {
    font-size: clamp(32px, 8vw, 46px);
    line-height: 1.08;
    margin: 0 0 10px;
  }
  .payout-header span,
  .muted {
    color: #cbd5e1;
    line-height: 1.5;
  }
  .status-card,
  .panel,
  .metric {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 14px;
    padding: 20px;
  }
  .status-card {
    align-items: flex-start;
    display: flex;
    gap: 18px;
    justify-content: space-between;
    margin-bottom: 18px;
  }
  .status-pill {
    border: 1px solid;
    border-radius: 999px;
    display: inline-block;
    font-size: 12px;
    font-weight: 900;
    margin-bottom: 12px;
    padding: 7px 10px;
    text-transform: uppercase;
  }
  .status-pill.ready {
    background: rgba(34, 197, 94, 0.16);
    border-color: #22c55e;
    color: #bbf7d0;
  }
  .status-pill.pending {
    background: rgba(234, 179, 8, 0.16);
    border-color: #eab308;
    color: #fef08a;
  }
  .payout-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    justify-content: flex-end;
  }
  .payout-actions button {
    background: #06b6d4;
    border: 0;
    border-radius: 9px;
    color: #082f49;
    cursor: pointer;
    font-weight: 900;
    padding: 12px 14px;
  }
  .metric-grid,
  .split-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    margin-bottom: 18px;
  }
  .metric span {
    color: #94a3b8;
    display: block;
    font-size: 13px;
    margin-bottom: 8px;
  }
  .metric strong {
    font-size: 24px;
    overflow-wrap: anywhere;
  }
  .requirements {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
  .requirements span {
    background: #0f172a;
    border: 1px solid #475569;
    border-radius: 999px;
    padding: 8px 10px;
  }
  .error-text {
    color: #fca5a5;
  }
  .balance-list,
  .payout-list {
    display: grid;
    gap: 10px;
  }
  .payout-list article {
    background: rgba(15, 23, 42, 0.58);
    border-radius: 10px;
    display: grid;
    gap: 4px;
    padding: 12px;
  }
  .payout-list span {
    color: #cbd5e1;
    font-size: 13px;
  }
  @media (max-width: 700px) {
    .status-card,
    .payout-actions {
      align-items: stretch;
      flex-direction: column;
    }
    .payout-actions button {
      width: 100%;
    }
  }
`;
