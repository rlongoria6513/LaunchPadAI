import CreateEventForm from "./CreateEventForm";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";
import { getMembershipStatus } from "@/app/lib/promoterSubscriptions";

type SessionUser = {
  role?: unknown;
};

export default async function NewEventPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as SessionUser)?.role !== "promoter") {
    redirect("/dashboard");
  }
  const membership=await getMembershipStatus(Number((session.user as {id?:unknown}).id||0),"promoter"); if(!membership.allowed)redirect("/promoter/membership?required=1");

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "40px 20px",
        color: "white",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "560px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            fontSize: "clamp(28px, 8vw, 40px)",
            lineHeight: 1.15,
            margin: "0 0 24px",
          }}
        >
          🎟️ Create New Event
        </h1>

        <CreateEventForm />
      </div>
    </main>
  );
}
