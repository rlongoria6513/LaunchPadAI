"use client";

import { ChangeEvent, useState } from "react";

export default function CreateEvent() {
  const [eventName, setEventName] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [ticketPrice, setTicketPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

  const uploadImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      event.target.value = "";
      return;
    }

    const maximumFileSize = 10 * 1024 * 1024;

    if (file.size > maximumFileSize) {
      alert("The image must be smaller than 10 MB.");
      event.target.value = "";
      return;
    }

    try {
      setUploadingImage(true);

      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "launchpad_events");

      const response = await fetch(
        "https://api.cloudinary.com/v1_1/fbthxalz/image/upload",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.secure_url) {
        console.error("Cloudinary upload error:", data);
        throw new Error(data.error?.message || "Image upload failed.");
      }

      setImageUrl(data.secure_url);
    } catch (error) {
      console.error("IMAGE UPLOAD ERROR:", error);
      alert("The image could not be uploaded. Please try again.");
      event.target.value = "";
    } finally {
      setUploadingImage(false);
    }
  };

  const saveEvent = async () => {
    if (
      !eventName.trim() ||
      !venue.trim() ||
      !eventDate ||
      !eventTime ||
      !ticketPrice
    ) {
      alert("Please complete all required fields.");
      return;
    }

    if (!imageUrl) {
      alert("Please upload an event image.");
      return;
    }

    try {
      setSaving(true);

      const response = await fetch("/api/events", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventName: eventName.trim(),
          venue: venue.trim(),
          eventDate,
          eventTime,
          ticketPrice,
          imageUrl,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error("SAVE EVENT ERROR:", data);
        throw new Error(data.error || "Failed to save event.");
      }

      alert("✅ Event saved successfully!");

      setEventName("");
      setVenue("");
      setEventDate("");
      setEventTime("");
      setTicketPrice("");
      setImageUrl("");
    } catch (error) {
      console.error(error);
      alert("❌ Failed to save event.");
    } finally {
      setSaving(false);
    }
  };

  const inputStyle = {
    width: "100%",
    boxSizing: "border-box" as const,
    background: "#0f172a",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "10px",
    padding: "13px 14px",
    fontSize: "16px",
  };

  const labelStyle = {
    display: "grid",
    gap: "7px",
    color: "#e2e8f0",
    fontWeight: "bold",
    fontSize: "14px",
  };

  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "linear-gradient(135deg, #07111f 0%, #111827 55%, #1e1b4b 100%)",
        color: "white",
        padding: "40px 20px 70px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "1050px",
          margin: "0 auto",
        }}
      >
        <div style={{ marginBottom: "30px" }}>
          <p
            style={{
              color: "#67e8f9",
              fontSize: "14px",
              fontWeight: "bold",
              letterSpacing: "2px",
              textTransform: "uppercase",
              margin: "0 0 8px",
            }}
          >
            Promoter Tools
          </p>

          <h1
            style={{
              fontSize: "40px",
              margin: "0 0 10px",
            }}
          >
            🎟️ Create Event
          </h1>

          <p
            style={{
              color: "#cbd5e1",
              fontSize: "17px",
              margin: 0,
            }}
          >
            Add your event details and upload one event flyer.
          </p>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "24px",
            alignItems: "start",
          }}
        >
          <section
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "18px",
              padding: "25px",
            }}
          >
            <div
              style={{
                display: "grid",
                gap: "17px",
              }}
            >
              <label style={labelStyle}>
                Event Name
                <input
                  style={inputStyle}
                  placeholder="Example: Los Aztecas Summer Show"
                  value={eventName}
                  onChange={(event) => setEventName(event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Venue
                <input
                  style={inputStyle}
                  placeholder="Example: Toledo Event Center"
                  value={venue}
                  onChange={(event) => setVenue(event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Event Date
                <input
                  style={inputStyle}
                  type="date"
                  value={eventDate}
                  onChange={(event) => setEventDate(event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Event Time
                <input
                  style={inputStyle}
                  type="time"
                  value={eventTime}
                  onChange={(event) => setEventTime(event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Ticket Price
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="25.00"
                  value={ticketPrice}
                  onChange={(event) => setTicketPrice(event.target.value)}
                />
              </label>

              <label style={labelStyle}>
                Event Flyer
                <input
                  style={{
                    ...inputStyle,
                    cursor: uploadingImage ? "not-allowed" : "pointer",
                  }}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  onChange={uploadImage}
                  disabled={uploadingImage}
                />
              </label>

              {uploadingImage && (
                <p
                  style={{
                    color: "#67e8f9",
                    margin: 0,
                    fontWeight: "bold",
                  }}
                >
                  ☁️ Uploading image...
                </p>
              )}

              {imageUrl && !uploadingImage && (
                <p
                  style={{
                    color: "#86efac",
                    margin: 0,
                    fontWeight: "bold",
                  }}
                >
                  ✅ Image uploaded successfully
                </p>
              )}

              <button
                type="button"
                onClick={saveEvent}
                disabled={saving || uploadingImage}
                style={{
                  background:
                    saving || uploadingImage ? "#334155" : "#2563eb",
                  color: "white",
                  padding: "15px",
                  border: "none",
                  borderRadius: "11px",
                  fontSize: "18px",
                  fontWeight: "bold",
                  cursor:
                    saving || uploadingImage ? "not-allowed" : "pointer",
                  marginTop: "5px",
                }}
              >
                {saving ? "Saving Event..." : "Save Event"}
              </button>
            </div>
          </section>

          <section
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: "18px",
              padding: "25px",
            }}
          >
            <p
              style={{
                color: "#a5b4fc",
                fontSize: "13px",
                fontWeight: "bold",
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                margin: "0 0 12px",
              }}
            >
              Live Preview
            </p>

            <div
              style={{
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "16px",
                overflow: "hidden",
              }}
            >
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt="Event flyer preview"
                  style={{
                    width: "100%",
                    height: "320px",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                <div
                  style={{
                    height: "320px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#64748b",
                    fontSize: "18px",
                    textAlign: "center",
                    padding: "20px",
                  }}
                >
                  🖼️ Your uploaded event flyer will appear here
                </div>
              )}

              <div style={{ padding: "20px" }}>
                <h2
                  style={{
                    margin: "0 0 10px",
                    fontSize: "24px",
                  }}
                >
                  {eventName || "Your Event Name"}
                </h2>

                <p style={{ color: "#cbd5e1", margin: "7px 0" }}>
                  📍 {venue || "Venue"}
                </p>

                <p style={{ color: "#cbd5e1", margin: "7px 0" }}>
                  📅 {eventDate || "Event date"}
                </p>

                <p style={{ color: "#cbd5e1", margin: "7px 0" }}>
                  🕒 {eventTime || "Event time"}
                </p>

                <p
                  style={{
                    color: "#67e8f9",
                    fontSize: "21px",
                    fontWeight: "bold",
                    margin: "15px 0 0",
                  }}
                >
                  {ticketPrice
                    ? `$${Number(ticketPrice).toFixed(2)}`
                    : "$0.00"}
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}