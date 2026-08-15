import { auth } from "@/app/auth";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";
import { redirect } from "next/navigation";
import Link from "next/link";
import MembershipActions from "./MembershipActions";

const features=["Create and publish events","Cash and online ticket sales","Guest checkout and secure QR tickets","Event-day scanning and door sales","Promoter storefront and Ticket Designer","Sales, customer, merchandise, staff and reporting tools","AI tools within their separate usage limits"];
function date(value:string|Date|null){return value?new Date(value).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}):"—"}
export default async function MembershipPage(){
  const session=await auth(); if(!session) redirect("/login");
  const role=String((session.user as {role?:unknown}).role||"").toLowerCase(); const userId=Number((session.user as {id?:unknown}).id||0);
  if(role!=="promoter"&&role!=="admin") redirect("/dashboard");
  const membership=await getMembershipStatus(userId,role);
  const paid=["active","trialing","past_due","unpaid","incomplete"].includes(membership.status);
  return <main className="lp-back-office-page" style={{minHeight:"100vh"}}><div className="lp-page-shell" style={{maxWidth:1000,margin:"0 auto"}}>
    <Link href="/promoter" style={{color:"#67e8f9"}}>← Promoter dashboard</Link>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:24,marginTop:24}}>
      <section style={card}><p style={eyebrow}>LAUNCHPAD PROMOTER</p><h1 style={{fontSize:42,margin:"8px 0"}}>$19.99 <small style={{fontSize:18,color:"#94a3b8"}}>/ month</small></h1><p style={{fontSize:18,color:"#cbd5e1"}}>Run your events from listing to check-in. New promoters receive a 14-day free trial. Cancel any time.</p>
        <ul style={{lineHeight:1.9,paddingLeft:22}}>{features.map(x=><li key={x}>{x}</li>)}</ul>
      </section>
      <section style={card}><p style={eyebrow}>CURRENT STATUS</p><h2 style={{textTransform:"capitalize",fontSize:28}}>{membership.status.replaceAll("_"," ")}</h2><p style={{color:membership.allowed?"#86efac":"#fca5a5",fontWeight:700}}>{membership.message}</p>
        {membership.inGrace&&<p>Launch grace expires: <strong>{date(membership.graceEndsAt)}</strong></p>}
        {membership.status==="trialing"&&<p>Trial ends: <strong>{date(membership.trialEnd)}</strong></p>}
        {membership.periodEnd&&<p>{membership.cancelAtPeriodEnd?"Access ends":"Next billing date"}: <strong>{date(membership.periodEnd)}</strong></p>}
        {membership.cancelAtPeriodEnd&&<p style={{color:"#fbbf24"}}>Cancellation is scheduled for the end of this billing period. Your existing events and customer tickets remain available.</p>}
        {membership.status==="past_due"&&<p style={{color:"#fca5a5"}}>Stripe could not collect payment. Use Manage Billing to update your payment method.</p>}
        {!membership.setupReady&&<p style={{padding:12,borderRadius:10,background:"#422006",color:"#fde68a"}}>Membership checkout is not configured yet. An admin must add STRIPE_PROMOTER_MONTHLY_PRICE_ID on the server.</p>}
        <MembershipActions canCheckout={membership.setupReady&&!paid&&role!=="admin"} canManage={Boolean(membership.stripeCustomerId)&&role!=="admin"}/>
      </section>
    </div>
  </div></main>
}
const card:React.CSSProperties={background:"#0f172a",border:"1px solid #334155",borderRadius:18,padding:28};
const eyebrow:React.CSSProperties={color:"#67e8f9",fontWeight:900,letterSpacing:2,fontSize:13};
