import CreateEventForm from "./CreateEventForm";
import { auth } from "@/app/auth";
import { redirect } from "next/navigation";

export default async function NewEventPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  if ((session.user as any)?.role !== "promoter") {
    redirect("/dashboard");
  }

  return (
    <main style={{ padding: "40px", color: "white" }}>
      <h1>🎟️ Create New Event</h1>

      <CreateEventForm />
    </main>
  );
}