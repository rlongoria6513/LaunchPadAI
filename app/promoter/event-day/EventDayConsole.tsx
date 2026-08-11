"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type EventOption = {
  id: number;
  eventName: string;
  venue: string;
  ticketPrice: number;
};

type IssuedTicket = {
  orderId: number;
  ticketNumber: string;
};

type MerchandiseItem = {
  id: number;
  eventId: number;
  name: string;
  price: number;
  active: boolean;
};

type RegisterSummary = {
  eventId: number;
  eventName: string;
  ticketRecords: number;
  ticketsSold: number;
  ticketRevenue: number;
  cashTotal: number;
  cardTotal: number;
  stripeTotal: number;
  merchandiseTotal: number;
  revenueTotal: number;
  checkedIn: number;
};

type Transaction = {
  id: number;
  source: string;
  eventName: string;
  label: string;
  customer: string | null;
  paymentMethod: string | null;
  totalAmount: number;
  createdAt: string | Date | null;
};

type Shift = {
  id: number;
  eventName: string;
  status: string;
  openingCash: number;
  closingCash: number | null;
};

const tabs = [
  "Scan Tickets",
  "Sell Tickets",
  "Cash Register",
  "Merchandise",
  "Comp Ticket",
  "Reports",
];

export default function EventDayConsole() {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [events, setEvents] = useState<EventOption[]>([]);
  const [items, setItems] = useState<MerchandiseItem[]>([]);
  const [summary, setSummary] = useState<RegisterSummary[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [message, setMessage] = useState("");
  const [issuedTickets, setIssuedTickets] = useState<IssuedTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const firstEventId = events[0]?.id ? String(events[0].id) : "";

  const totals = useMemo(
    () =>
      summary.reduce(
        (current, row) => ({
          ticketsSold: current.ticketsSold + row.ticketsSold,
          cashTotal: current.cashTotal + row.cashTotal,
          cardTotal: current.cardTotal + row.cardTotal,
          stripeTotal: current.stripeTotal + row.stripeTotal,
          merchandiseTotal:
            current.merchandiseTotal + row.merchandiseTotal,
          revenueTotal: current.revenueTotal + row.revenueTotal,
          checkedIn: current.checkedIn + row.checkedIn,
        }),
        {
          ticketsSold: 0,
          cashTotal: 0,
          cardTotal: 0,
          stripeTotal: 0,
          merchandiseTotal: 0,
          revenueTotal: 0,
          checkedIn: 0,
        }
      ),
    [summary]
  );

  async function refreshData() {
    const [eventsResponse, itemsResponse, registerResponse, shiftsResponse] =
      await Promise.all([
        fetch("/api/event-day/events"),
        fetch("/api/event-day/merchandise-items"),
        fetch("/api/event-day/register"),
        fetch("/api/event-day/shifts"),
      ]);

    const eventsData = await eventsResponse.json();
    const itemsData = await itemsResponse.json();
    const registerData = await registerResponse.json();
    const shiftsData = await shiftsResponse.json();

    setEvents(eventsData.events || []);
    setItems(itemsData.items || []);
    setSummary(registerData.summary || []);
    setTransactions(registerData.transactions || []);
    setShifts(shiftsData.shifts || []);
    setLoading(false);
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      const [eventsResponse, itemsResponse, registerResponse, shiftsResponse] =
        await Promise.all([
          fetch("/api/event-day/events"),
          fetch("/api/event-day/merchandise-items"),
          fetch("/api/event-day/register"),
          fetch("/api/event-day/shifts"),
        ]);

      const eventsData = await eventsResponse.json();
      const itemsData = await itemsResponse.json();
      const registerData = await registerResponse.json();
      const shiftsData = await shiftsResponse.json();

      if (!active) {
        return;
      }

      setEvents(eventsData.events || []);
      setItems(itemsData.items || []);
      setSummary(registerData.summary || []);
      setTransactions(registerData.transactions || []);
      setShifts(shiftsData.shifts || []);
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  async function submitJson(
    url: string,
    form: HTMLFormElement,
    extra?: Record<string, unknown>
  ) {
    setMessage("");
    setIssuedTickets([]);

    const formData = new FormData(form);
    const payload: Record<string, unknown> = {};

    formData.forEach((value, key) => {
      payload[key] = value;
    });

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, ...extra }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMessage(data.error || "Request failed.");
      return false;
    }

    setIssuedTickets(data.tickets || []);
    setMessage("Completed successfully.");
    form.reset();
    await refreshData();
    return true;
  }

  return (
    <main className="event-day-page">
      <style>{styles}</style>

      <div className="event-day-shell">
        <Link href="/promoter" className="back-link">
          Back to Command Center
        </Link>

        <header className="event-day-header">
          <div>
            <p className="eyebrow">Event-Day Operations</p>
            <h1>Box Office Console</h1>
            <p className="subtle">
              Fast entrance tools for scanning, selling, merchandise, comps,
              and event revenue.
            </p>
          </div>

          <Link href="/scanner" className="scanner-link">
            Open Scanner
          </Link>
        </header>

        <nav className="tabs" aria-label="Event-Day tools">
          {tabs.map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? "active" : ""}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </nav>

        {message ? <div className="message">{message}</div> : null}

        {issuedTickets.length ? (
          <section className="complete-card">
            <h2>Sale Complete</h2>
            <div className="ticket-list">
              {issuedTickets.map((ticket) => (
                <div key={ticket.ticketNumber} className="ticket-row">
                  <strong>{ticket.ticketNumber}</strong>
                  <div>
                    <Link href={`/tickets/${ticket.orderId}`}>View Ticket</Link>
                    <Link href={`/tickets/${ticket.orderId}?print=1`}>
                      Print Ticket
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setIssuedTickets([])}
              className="secondary-action"
            >
              New Sale
            </button>
          </section>
        ) : null}

        {loading ? (
          <section className="panel">Loading Event-Day tools...</section>
        ) : null}

        {!loading && events.length === 0 ? (
          <section className="panel empty">
            No events are available for this account.
          </section>
        ) : null}

        {!loading && events.length > 0 && (
          <>
            {activeTab === "Scan Tickets" && (
              <section className="panel">
                <h2>Scan Tickets</h2>
                <p className="subtle">
                  Scanner devices can cache event tickets, continue offline,
                  and synchronize scan activity when connectivity returns.
                </p>
                <Link href="/scanner" className="primary-action">
                  Open Online / Offline Scanner
                </Link>
              </section>
            )}

            {activeTab === "Sell Tickets" && (
              <TicketSaleForm
                events={events}
                defaultEventId={firstEventId}
                onSubmit={(form) =>
                  submitJson("/api/event-day/tickets", form, {
                    sale_channel: "door",
                  })
                }
              />
            )}

            {activeTab === "Cash Register" && (
              <RegisterView
                totals={totals}
                summary={summary}
                transactions={transactions}
                shifts={shifts}
                events={events}
                defaultEventId={firstEventId}
                submitJson={submitJson}
                onRefresh={refreshData}
              />
            )}

            {activeTab === "Merchandise" && (
              <MerchandiseView
                events={events}
                items={items}
                defaultEventId={firstEventId}
                submitJson={submitJson}
              />
            )}

            {activeTab === "Comp Ticket" && (
              <CompTicketForm
                events={events}
                defaultEventId={firstEventId}
                onSubmit={(form) =>
                  submitJson("/api/event-day/comp-ticket", form)
                }
              />
            )}

            {activeTab === "Reports" && (
              <RegisterView
                totals={totals}
                summary={summary}
                transactions={transactions}
                shifts={shifts}
                events={events}
                defaultEventId={firstEventId}
                submitJson={submitJson}
                onRefresh={refreshData}
              />
            )}
          </>
        )}
      </div>
    </main>
  );
}

function EventSelect({
  events,
  defaultEventId,
}: {
  events: EventOption[];
  defaultEventId: string;
}) {
  return (
    <label>
      Event
      <select name="event_id" required defaultValue={defaultEventId}>
        {events.map((event) => (
          <option key={event.id} value={event.id}>
            {event.eventName} - {money(event.ticketPrice)}
          </option>
        ))}
      </select>
    </label>
  );
}

function TicketSaleForm({
  events,
  defaultEventId,
  onSubmit,
}: {
  events: EventOption[];
  defaultEventId: string;
  onSubmit: (form: HTMLFormElement) => Promise<boolean>;
}) {
  return (
    <form
      className="panel form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit(event.currentTarget);
      }}
    >
      <h2>Sell Admission Tickets</h2>
      <EventSelect events={events} defaultEventId={defaultEventId} />
      <label>
        Customer Name
        <input name="customer_name" placeholder="Guest" />
      </label>
      <label>
        Customer Email
        <input name="customer_email" type="email" placeholder="Optional" />
      </label>
      <label>
        Customer Phone
        <input name="customer_phone" type="tel" placeholder="Optional" />
      </label>
      <label>
        Payment Method
        <select name="payment_method" defaultValue="cash">
          <option value="cash">Cash</option>
          <option value="card">Card / External Terminal</option>
        </select>
      </label>
      <label>
        Quantity
        <input name="quantity" type="number" min="1" max="10" defaultValue="1" />
      </label>
      <button className="primary-action" type="submit">
        Complete Sale
      </button>
    </form>
  );
}

function CompTicketForm({
  events,
  defaultEventId,
  onSubmit,
}: {
  events: EventOption[];
  defaultEventId: string;
  onSubmit: (form: HTMLFormElement) => Promise<boolean>;
}) {
  return (
    <form
      className="panel form-grid"
      onSubmit={(event) => {
        event.preventDefault();
        if (confirm("Issue complimentary ticket?")) {
          void onSubmit(event.currentTarget);
        }
      }}
    >
      <h2>Issue Complimentary Tickets</h2>
      <EventSelect events={events} defaultEventId={defaultEventId} />
      <label>
        Guest Name
        <input name="customer_name" placeholder="Guest" />
      </label>
      <label>
        Guest Email
        <input name="customer_email" type="email" placeholder="Optional" />
      </label>
      <label>
        Guest Phone
        <input name="customer_phone" type="tel" placeholder="Optional" />
      </label>
      <label>
        Quantity
        <input name="quantity" type="number" min="1" max="10" defaultValue="1" />
      </label>
      <button className="primary-action" type="submit">
        Issue Comp Ticket
      </button>
    </form>
  );
}

function MerchandiseView({
  events,
  items,
  defaultEventId,
  submitJson,
}: {
  events: EventOption[];
  items: MerchandiseItem[];
  defaultEventId: string;
  submitJson: (
    url: string,
    form: HTMLFormElement,
    extra?: Record<string, unknown>
  ) => Promise<boolean>;
}) {
  return (
    <div className="split-grid">
      <form
        className="panel form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void submitJson("/api/event-day/merchandise-items", event.currentTarget);
        }}
      >
        <h2>Add Merchandise Item</h2>
        <EventSelect events={events} defaultEventId={defaultEventId} />
        <label>
          Item Name
          <input name="name" placeholder="Shirt, hat, CD" required />
        </label>
        <label>
          Price
          <input name="price" type="number" min="0" step="0.01" required />
        </label>
        <button className="primary-action" type="submit">
          Save Item
        </button>
      </form>

      <form
        className="panel form-grid"
        onSubmit={(event) => {
          event.preventDefault();
          void submitJson(
            "/api/event-day/merchandise-sales",
            event.currentTarget
          );
        }}
      >
        <h2>Sell Merchandise</h2>
        <EventSelect events={events} defaultEventId={defaultEventId} />
        <label>
          Saved Item
          <select name="item_id" defaultValue="">
            <option value="">Custom item</option>
            {items.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} - {money(item.price)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Custom Item Name
          <input name="item_name" placeholder="Required for custom item" />
        </label>
        <label>
          Custom Price
          <input name="unit_price" type="number" min="0" step="0.01" />
        </label>
        <label>
          Quantity
          <input name="quantity" type="number" min="1" max="100" defaultValue="1" />
        </label>
        <label>
          Payment Method
          <select name="payment_method" defaultValue="cash">
            <option value="cash">Cash</option>
            <option value="card">Card / External Terminal</option>
          </select>
        </label>
        <button className="primary-action" type="submit">
          Complete Merchandise Sale
        </button>
      </form>
    </div>
  );
}

function RegisterView({
  totals,
  summary,
  transactions,
  shifts,
  events,
  defaultEventId,
  submitJson,
  onRefresh,
}: {
  totals: Omit<RegisterSummary, "eventId" | "eventName" | "ticketRecords" | "ticketRevenue">;
  summary: RegisterSummary[];
  transactions: Transaction[];
  shifts: Shift[];
  events: EventOption[];
  defaultEventId: string;
  submitJson: (
    url: string,
    form: HTMLFormElement,
    extra?: Record<string, unknown>
  ) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}) {
  return (
    <section className="panel">
      <h2>Event Register</h2>
      <div className="split-grid">
        <form
          className="form-grid compact-form"
          onSubmit={(event) => {
            event.preventDefault();
            void submitJson("/api/event-day/shifts", event.currentTarget);
          }}
        >
          <h3>Open Shift</h3>
          <EventSelect events={events} defaultEventId={defaultEventId} />
          <label>
            Opening Cash
            <input name="opening_cash" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <button className="primary-action" type="submit">Open Shift</button>
        </form>

        <form
          className="form-grid compact-form"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = event.currentTarget;
            const formData = new FormData(form);
            const response = await fetch("/api/event-day/shifts", {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                shift_id: formData.get("shift_id"),
                closing_cash: formData.get("closing_cash"),
              }),
            });
            form.reset();
            if (response.ok) {
              await onRefresh();
            }
          }}
        >
          <h3>Close Shift</h3>
          <label>
            Open Shift
            <select name="shift_id" required>
              {shifts
                .filter((shift) => shift.status === "open")
                .map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.eventName} - shift #{shift.id}
                  </option>
                ))}
            </select>
          </label>
          <label>
            Closing Cash
            <input name="closing_cash" type="number" min="0" step="0.01" defaultValue="0" />
          </label>
          <button className="secondary-action" type="submit">Close Shift</button>
        </form>
      </div>

      <div className="metric-grid">
        <Metric label="Tickets Sold" value={totals.ticketsSold} />
        <Metric label="Cash" value={money(totals.cashTotal)} />
        <Metric label="Card / Stripe" value={money(totals.cardTotal + totals.stripeTotal)} />
        <Metric label="Merchandise" value={money(totals.merchandiseTotal)} />
        <Metric label="Total Revenue" value={money(totals.revenueTotal)} />
        <Metric label="Checked In" value={totals.checkedIn} />
      </div>

      <h3>Recent Shifts</h3>
      <div className="event-summary-list">
        {shifts.map((shift) => (
          <article key={shift.id} className="summary-row">
            <strong>{shift.eventName}</strong>
            <span>{shift.status.toUpperCase()}</span>
            <span>Open {money(shift.openingCash)}</span>
            <span>
              Close {shift.closingCash === null ? "pending" : money(shift.closingCash)}
            </span>
          </article>
        ))}
      </div>

      <div className="event-summary-list">
        {summary.map((row) => (
          <article key={row.eventId} className="summary-row">
            <strong>{row.eventName}</strong>
            <span>{row.ticketsSold} tickets</span>
            <span>{money(row.revenueTotal)} total</span>
            <span>{row.checkedIn} checked in</span>
          </article>
        ))}
      </div>

      <h3>Transaction History</h3>
      <div className="transactions">
        {transactions.map((transaction) => (
          <article
            key={`${transaction.source}-${transaction.id}`}
            className="transaction-row"
          >
            <div>
              <strong>{transaction.label}</strong>
              <span>
                {transaction.source} · {transaction.eventName}
              </span>
            </div>
            <div>
              <strong>{money(transaction.totalAmount)}</strong>
              <span>{transaction.paymentMethod || "legacy"}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function money(value: number) {
  return Number(value || 0).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
  });
}

const styles = `
  .event-day-page {
    min-height: 100vh;
    background: #111827;
    color: white;
    padding: 36px 16px 70px;
    font-family: Arial, sans-serif;
  }
  .event-day-shell {
    width: 100%;
    max-width: 1180px;
    margin: 0 auto;
  }
  .back-link,
  .scanner-link {
    color: #93c5fd;
    font-weight: 800;
    text-decoration: none;
  }
  .event-day-header {
    align-items: flex-start;
    display: flex;
    justify-content: space-between;
    gap: 18px;
    margin: 24px 0;
  }
  .event-day-header h1 {
    font-size: clamp(32px, 8vw, 48px);
    line-height: 1.05;
    margin: 0 0 10px;
  }
  .eyebrow {
    color: #67e8f9;
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 2px;
    margin: 0 0 8px;
    text-transform: uppercase;
  }
  .subtle {
    color: #cbd5e1;
    line-height: 1.5;
    margin: 0 0 16px;
  }
  .tabs {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
    gap: 10px;
    margin-bottom: 18px;
  }
  .tabs button,
  .primary-action,
  .secondary-action {
    border: 0;
    border-radius: 10px;
    cursor: pointer;
    font-size: 16px;
    font-weight: 900;
    padding: 14px;
    text-align: center;
    text-decoration: none;
  }
  .tabs button {
    background: #1f2937;
    color: white;
  }
  .tabs button.active,
  .primary-action {
    background: #06b6d4;
    color: #082f49;
  }
  .secondary-action {
    background: #334155;
    color: white;
  }
  .panel,
  .complete-card {
    background: #1f2937;
    border: 1px solid #374151;
    border-radius: 14px;
    padding: 22px;
  }
  .compact-form {
    background: rgba(15, 23, 42, 0.42);
    border: 1px solid rgba(148, 163, 184, 0.18);
    border-radius: 12px;
    padding: 14px;
  }
  .message {
    background: rgba(14, 165, 233, 0.18);
    border: 1px solid rgba(103, 232, 249, 0.42);
    border-radius: 12px;
    margin-bottom: 14px;
    padding: 13px;
  }
  .form-grid {
    display: grid;
    gap: 14px;
  }
  label {
    display: grid;
    gap: 7px;
    font-weight: 800;
  }
  input,
  select {
    background: white;
    border: 1px solid #d1d5db;
    border-radius: 9px;
    color: black;
    font-size: 16px;
    padding: 12px;
    width: 100%;
  }
  .split-grid,
  .metric-grid {
    display: grid;
    gap: 16px;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  }
  .metric {
    background: rgba(15, 23, 42, 0.74);
    border: 1px solid rgba(148, 163, 184, 0.22);
    border-radius: 12px;
    display: grid;
    gap: 7px;
    padding: 16px;
  }
  .metric span,
  .transaction-row span,
  .summary-row span {
    color: #94a3b8;
    font-size: 13px;
  }
  .metric strong {
    font-size: 26px;
    overflow-wrap: anywhere;
  }
  .event-summary-list,
  .transactions,
  .ticket-list {
    display: grid;
    gap: 10px;
    margin-top: 16px;
  }
  .summary-row,
  .transaction-row,
  .ticket-row {
    align-items: center;
    background: rgba(15, 23, 42, 0.64);
    border-radius: 11px;
    display: flex;
    gap: 12px;
    justify-content: space-between;
    padding: 13px;
  }
  .transaction-row div,
  .ticket-row div {
    display: grid;
    gap: 4px;
  }
  .ticket-row a {
    color: #67e8f9;
    font-weight: 800;
    text-decoration: none;
  }
  @media (max-width: 640px) {
    .event-day-page {
      padding: 24px 10px 52px;
    }
    .event-day-header,
    .summary-row,
    .transaction-row,
    .ticket-row {
      align-items: stretch;
      flex-direction: column;
    }
    .scanner-link,
    .primary-action,
    .secondary-action {
      display: block;
      width: 100%;
    }
  }
`;
