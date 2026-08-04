export default function ManageEvents() {
  return (
    <main style={{ padding: 40 }}>
      <h1>Manage Events</h1>
      <button
  style={{
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "12px 20px",
    borderRadius: 10,
    cursor: "pointer",
  }}
>
  + Create Event
  <p style={{ marginTop: 30, color: "#9ca3af" }}>
  No events found.
</p>
</button>
    </main>
  );
}