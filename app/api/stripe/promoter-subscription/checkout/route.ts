import { auth } from "@/app/auth";
import { getMembershipStatus, saveCheckoutSession } from "@/app/lib/promoterSubscriptions";
import { stripe } from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";
type User={id?:unknown;role?:unknown;email?:string|null};
export async function POST(request:Request){
  const session=await auth(); const user=session?.user as User|undefined; const userId=Number(user?.id||0);
  if(!session||String(user?.role||"").toLowerCase()!=="promoter"||userId<=0)return NextResponse.json({error:"Unauthorized"},{status:401});
  const priceId=process.env.STRIPE_PROMOTER_MONTHLY_PRICE_ID;
  if(!priceId)return NextResponse.json({error:"Promoter subscription checkout is not configured. Admin must add STRIPE_PROMOTER_MONTHLY_PRICE_ID."},{status:503});
  const membership=await getMembershipStatus(userId,"promoter");
  if(["active","trialing","past_due","unpaid","incomplete","checkout_started"].includes(membership.status))return NextResponse.json({error:"A membership or checkout already exists. Use Manage Billing instead of creating a duplicate."},{status:409});
  const origin=new URL(request.url).origin;
  const checkout=await stripe.checkout.sessions.create({
    mode:"subscription", customer:membership.stripeCustomerId||undefined,
    customer_email:membership.stripeCustomerId?undefined:user?.email||undefined,
    client_reference_id:String(userId), line_items:[{price:priceId,quantity:1}],
    success_url:`${origin}/promoter/membership?checkout=success`, cancel_url:`${origin}/promoter/membership?checkout=canceled`,
    metadata:{checkout_type:"promoter_membership",launchpad_user_id:String(userId)},
    subscription_data:{...(membership.stripeSubscriptionId?{}:{trial_period_days:14}),metadata:{checkout_type:"promoter_membership",launchpad_user_id:String(userId)}},
    allow_promotion_codes:false,
  });
  await saveCheckoutSession(userId,checkout);
  return NextResponse.json({url:checkout.url});
}
