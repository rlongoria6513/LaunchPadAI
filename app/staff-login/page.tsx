import { signIn } from "@/app/auth";
import db from "@/app/lib/db";
import { AuthError } from "next-auth";
import type { RowDataPacket } from "mysql2";
import Link from "next/link";
import { redirect } from "next/navigation";

export default function StaffLoginPage(){
  async function staffLogin(formData:FormData){
    "use server";
    const email=String(formData.get("email")||"").trim().toLowerCase();
    const [staff]=await db.execute<RowDataPacket[]>("SELECT id FROM users WHERE LOWER(email)=? AND LOWER(role)='staff' LIMIT 1",[email]);
    if(!staff.length)redirect("/staff-login?error=credentials");
    try{await signIn("credentials",{email,password:formData.get("password"),redirect:false});}catch(error){if(error instanceof AuthError)redirect("/staff-login?error=credentials");throw error;}
    redirect("/staff");
  }
  return <main className="login"><style>{styles}</style><div><span className="icon">🎟️</span><h1>Door Staff Login</h1><p>Sign in with the email and PIN your promoter gave you.</p><form action={staffLogin}><label>Email<input name="email" type="email" autoComplete="email" required /></label><label>PIN or password<input name="password" type="password" autoComplete="current-password" required /></label><button>Open Event-Day App</button></form><Link href="/">← Back to ticket site</Link></div></main>;
}
const styles=`.login{min-height:100vh;background:linear-gradient(135deg,#07111f,#111827 55%,#164e63);color:white;display:grid;place-items:center;padding:20px;font-family:Arial,sans-serif}.login>div{width:100%;max-width:420px;background:#101c33;border:1px solid #334155;border-radius:18px;padding:32px 24px;box-sizing:border-box}.icon{font-size:48px}.login h1{font-size:30px;margin:12px 0 8px}.login p{color:#cbd5e1;line-height:1.5}.login form{display:grid;gap:16px;margin:24px 0}.login label{display:grid;gap:7px;font-weight:700}.login input{padding:14px;border-radius:9px;border:1px solid #64748b;font-size:16px}.login button{padding:15px;border:0;border-radius:9px;background:#06b6d4;color:#082f49;font-weight:900;font-size:16px}.login a{color:#93c5fd;text-decoration:none}`;
