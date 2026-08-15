import { auth } from "@/app/auth";
import { listPromoterSubscriptions,listSubscriptionEvents } from "@/app/lib/promoterSubscriptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import SubscriptionTable from "./SubscriptionTable";
import type { RowDataPacket } from "mysql2";

type AuditRow=RowDataPacket&{id:number;event_type:string;status:string|null;summary:string|null;created_at:string|Date};
export default async function AdminSubscriptions(){
 const session=await auth();if(String((session?.user as {role?:unknown}|undefined)?.role||"").toLowerCase()!=="admin")redirect("/login");
 const [raw,rawEvents]=await Promise.all([listPromoterSubscriptions(),listSubscriptionEvents(100)]);
 const rows=raw.map(r=>{const active=r.status==="active"||r.status==="trialing";const grace=Boolean(r.grace_ends_at&&new Date(r.grace_ends_at).getTime()>new Date().getTime());return {...r,display_status:active?r.status:grace?"grace_period":r.status==="none"?"expired":r.status};}).map(r=>JSON.parse(JSON.stringify(r)));
 const events=rawEvents as AuditRow[]; const active=rows.filter(r=>r.display_status==="active").length;
 return <main className="lp-back-office-page" style={{minHeight:"100vh"}}><div className="lp-page-shell" style={{maxWidth:1300,margin:"0 auto"}}><Link href="/admin" style={{color:"#67e8f9"}}>← Admin</Link><h1>Promoter Subscriptions</h1><p style={{color:"#cbd5e1"}}>Manage the single $19.99 monthly membership, launch grace periods, billing state and audit history.</p>{!process.env.STRIPE_PROMOTER_MONTHLY_PRICE_ID&&<p style={{background:"#422006",color:"#fde68a",padding:14,borderRadius:10}}>Setup required: add STRIPE_PROMOTER_MONTHLY_PRICE_ID to Render. Checkout remains safely disabled until then.</p>}<div style={{display:"flex",gap:16,flexWrap:"wrap"}}><div style={metric}><b>${(active*19.99).toFixed(2)}</b><span>Current MRR</span></div><div style={metric}><b>{active}</b><span>Active paid memberships</span></div><div style={metric}><b>{rows.length}</b><span>Approved promoters</span></div></div><SubscriptionTable rows={rows}/><h2 style={{marginTop:35}}>Subscription audit history</h2><div style={{display:"grid",gap:8}}>{events.map(e=><div key={e.id} style={{padding:12,border:"1px solid #334155",borderRadius:10}}><strong>{e.event_type}</strong> · {e.status||"recorded"}<br/><span style={{color:"#94a3b8"}}>{e.summary} · {new Date(e.created_at).toLocaleString()}</span></div>)}</div></div></main>
}
const metric:React.CSSProperties={display:"grid",gap:5,minWidth:210,padding:20,border:"1px solid #334155",borderRadius:14,background:"#0f172a"};
