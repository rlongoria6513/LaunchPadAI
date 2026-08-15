import { auth } from "@/app/auth";
import { setGracePeriod } from "@/app/lib/promoterSubscriptions";
import { NextResponse } from "next/server";

export async function POST(request:Request){
  const session=await auth(); const role=String((session?.user as {role?:unknown}|undefined)?.role||"").toLowerCase();
  const adminId=Number((session?.user as {id?:unknown}|undefined)?.id||0);
  if(!session||role!=="admin") return NextResponse.json({error:"Admin access required."},{status:403});
  const body=await request.json(); const userId=Number(body.userId); const days=Number(body.days);
  if(!Number.isInteger(userId)||userId<1||!Number.isFinite(days)||days<0||days>365) return NextResponse.json({error:"Choose a valid promoter and 0–365 days."},{status:400});
  await setGracePeriod(userId,Math.floor(days),adminId); return NextResponse.json({success:true});
}
