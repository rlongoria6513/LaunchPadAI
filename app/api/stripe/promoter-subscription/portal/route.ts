import { auth } from "@/app/auth";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";
import { stripe } from "@/app/lib/stripeConnect";
import { NextResponse } from "next/server";
type User={id?:unknown;role?:unknown};
export async function POST(request:Request){const session=await auth();const user=session?.user as User|undefined;const id=Number(user?.id||0);if(!session||String(user?.role||"").toLowerCase()!=="promoter"||id<=0)return NextResponse.json({error:"Unauthorized"},{status:401});const membership=await getMembershipStatus(id,"promoter");if(!membership.stripeCustomerId)return NextResponse.json({error:"No Stripe billing account exists yet. Start the free trial first."},{status:400});const portal=await stripe.billingPortal.sessions.create({customer:membership.stripeCustomerId,return_url:`${new URL(request.url).origin}/promoter/membership`});return NextResponse.json({url:portal.url});}
