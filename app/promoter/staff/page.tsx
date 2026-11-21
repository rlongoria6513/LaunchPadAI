import { auth } from "@/app/auth";
import db from "@/app/lib/db";
import { ensureEventStaffTable } from "@/app/lib/eventStaff";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";
import StaffManager from "./StaffManager";

type Assignment = RowDataPacket & { assignment_id:number; name:string; email:string; event_name:string; can_scan:number; can_sell:number; can_comp:number; active:number };

export default async function StaffManagementPage(){
  const session=await auth();const userId=Number((session?.user as {id?:unknown}|undefined)?.id||0);const role=String((session?.user as {role?:unknown}|undefined)?.role||"").toLowerCase();
  if(!session)redirect("/promoter-login");if(role!=="promoter"&&role!=="admin")redirect("/dashboard");
  await ensureEventStaffTable();
  const [events]=await db.execute<(RowDataPacket&{id:number;event_name:string})[]>("SELECT id,event_name FROM events WHERE (?='admin' OR promoter_id=?) ORDER BY event_date ASC",[role,userId]);
  const [assignments]=await db.execute<Assignment[]>(`SELECT s.id assignment_id,u.name,u.email,e.event_name,s.can_scan,s.can_sell,s.can_comp,s.active FROM event_staff s INNER JOIN users u ON u.id=s.user_id INNER JOIN events e ON e.id=s.event_id WHERE (?='admin' OR e.promoter_id=?) ORDER BY e.event_date ASC,u.name ASC`,[role,userId]);
  return <main className="staff-page"><style>{styles}</style><div className="staff-shell"><Link href="/promoter" className="back">← Command Center</Link><header><p>EVENT-DAY TEAM</p><h1>Door Staff Access</h1><span>Create a secure login and choose exactly what each worker can do.</span></header><StaffManager events={events.map((event)=>({id:event.id,eventName:event.event_name}))} initialAssignments={assignments}/></div></main>;
}

const styles=`.staff-page{min-height:100vh;background:#07111f;color:#fff;padding:28px 18px;font-family:Arial,sans-serif}.staff-shell{max-width:960px;margin:auto}.back{color:#67e8f9;text-decoration:none}.staff-page header{margin:28px 0}.staff-page header p{color:#67e8f9;font-weight:800;letter-spacing:2px}.staff-page h1{font-size:38px;margin:0 0 8px}.staff-page header span{color:#cbd5e1}.staff-form,.staff-list{background:#101c33;border:1px solid #334155;border-radius:18px;padding:22px;display:grid;gap:16px}.staff-form label{display:grid;gap:7px;font-weight:700}.staff-form input,.staff-form select{padding:13px;border-radius:9px;border:1px solid #64748b;font-size:16px}.staff-form fieldset{display:flex;gap:18px;flex-wrap:wrap;border:1px solid #475569;border-radius:10px;padding:14px}.staff-form fieldset label{display:flex;flex-direction:row}.staff-form button,.staff-list button{border:0;border-radius:9px;padding:13px 18px;font-weight:800;background:#06b6d4;color:#082f49;cursor:pointer}.staff-message{background:#164e63;padding:14px;border-radius:10px}.staff-list{margin-top:22px}.staff-list article{display:grid;grid-template-columns:1fr auto auto;gap:14px;align-items:center;border-top:1px solid #334155;padding-top:15px}.staff-list article div:first-child{display:grid;gap:4px}.staff-list article span{color:#cbd5e1}.permission-list{display:flex;gap:6px}.permission-list span{background:#164e63;padding:5px 8px;border-radius:999px;font-size:12px}.staff-list button.danger{background:#7f1d1d;color:#fecaca}.staff-list button.activate{background:#166534;color:#dcfce7}@media(max-width:650px){.staff-list article{grid-template-columns:1fr}.staff-page h1{font-size:31px}}`;
