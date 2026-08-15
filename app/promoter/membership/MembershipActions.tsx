"use client";

import { useState } from "react";

export default function MembershipActions({ canCheckout, canManage }: { canCheckout: boolean; canManage: boolean }) {
  const [busy, setBusy] = useState<"checkout" | "portal" | null>(null);
  const [error, setError] = useState("");

  async function open(kind: "checkout" | "portal") {
    setBusy(kind); setError("");
    try {
      const response = await fetch(`/api/stripe/promoter-subscription/${kind}`, { method: "POST" });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Unable to open Stripe billing.");
      window.location.assign(data.url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to open Stripe billing.");
      setBusy(null);
    }
  }

  return <div style={{display:"grid",gap:12}}>
    {canCheckout && <button disabled={Boolean(busy)} onClick={() => open("checkout")} style={button}>{busy === "checkout" ? "Opening secure checkout…" : "Start 14-Day Free Trial"}</button>}
    {canManage && <button disabled={Boolean(busy)} onClick={() => open("portal")} style={secondary}>{busy === "portal" ? "Opening billing portal…" : "Manage Billing"}</button>}
    {error && <p role="alert" style={{margin:0,color:"#fecaca",background:"#7f1d1d",padding:12,borderRadius:10}}>{error}</p>}
  </div>;
}
const button: React.CSSProperties={border:0,borderRadius:12,padding:"14px 20px",fontWeight:800,fontSize:16,cursor:"pointer",background:"#22d3ee",color:"#082f49"};
const secondary: React.CSSProperties={...button,background:"transparent",color:"white",border:"1px solid #475569"};
