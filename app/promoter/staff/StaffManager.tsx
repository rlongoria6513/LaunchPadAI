"use client";

import { useState } from "react";

type EventOption = { id: number; eventName: string };
type Assignment = { assignment_id:number; name:string; email:string; event_name:string; can_scan:number; can_sell:number; can_comp:number; active:number };

export default function StaffManager({ events, initialAssignments }: { events:EventOption[]; initialAssignments:Assignment[] }) {
  const [assignments,setAssignments]=useState(initialAssignments);
  const [message,setMessage]=useState("");
  const [saving,setSaving]=useState(false);

  async function refresh(){const response=await fetch("/api/promoter/staff");const data=await response.json();setAssignments(data.assignments||[]);}
  async function createStaff(form:HTMLFormElement){
    setSaving(true);setMessage("");const values=new FormData(form);
    const response=await fetch("/api/promoter/staff",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name:values.get("name"),email:values.get("email"),password:values.get("password"),eventId:values.get("eventId"),canScan:values.get("canScan")==="on",canSell:values.get("canSell")==="on",canComp:values.get("canComp")==="on"})});
    const data=await response.json();setSaving(false);setMessage(response.ok?"Staff access created. Share the staff login link and PIN.":data.error||"Request failed.");
    if(response.ok){form.reset();await refresh();}
  }
  async function toggle(assignmentId:number,active:boolean){await fetch("/api/promoter/staff",{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({assignmentId,active})});await refresh();}

  return <>
    <form className="staff-form" onSubmit={(event)=>{event.preventDefault();void createStaff(event.currentTarget);}}>
      <label>Name<input name="name" required placeholder="Door worker name" /></label>
      <label>Email<input name="email" type="email" required placeholder="worker@email.com" /></label>
      <label>PIN or password<input name="password" type="password" minLength={6} required placeholder="At least 6 characters" /></label>
      <label>Assigned event<select name="eventId" required defaultValue=""><option value="" disabled>Choose event</option>{events.map((event)=><option key={event.id} value={event.id}>{event.eventName}</option>)}</select></label>
      <fieldset><legend>Permissions</legend><label><input name="canScan" type="checkbox" defaultChecked /> Scan tickets</label><label><input name="canSell" type="checkbox" /> Door sales</label><label><input name="canComp" type="checkbox" /> Comp tickets</label></fieldset>
      <button disabled={saving||!events.length}>{saving?"Creating…":"Create Staff Access"}</button>
    </form>
    {message?<p className="staff-message">{message}</p>:null}
    <section className="staff-list"><h2>Event Staff</h2>{!assignments.length?<p>No staff assigned yet.</p>:assignments.map((assignment)=><article key={assignment.assignment_id}><div><strong>{assignment.name}</strong><span>{assignment.email}</span><span>{assignment.event_name}</span></div><div className="permission-list">{assignment.can_scan?<span>Scan</span>:null}{assignment.can_sell?<span>Sell</span>:null}{assignment.can_comp?<span>Comp</span>:null}</div><button type="button" className={assignment.active?"danger":"activate"} onClick={()=>void toggle(assignment.assignment_id,!assignment.active)}>{assignment.active?"Disable":"Reactivate"}</button></article>)}</section>
  </>;
}
