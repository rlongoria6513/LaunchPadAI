"use client";
import QRCode from "qrcode";


import { useEffect, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import GenerateTicketButton from "./GenerateTicketButton";

type EventData = {
  event_name: string;
  venue: string;
  location: string;
  event_date: string;
  event_time: string;
  image_url?: string;
};

type TemplateStyle = "concert" | "modern" | "vintage" | "minimal";
type FlyerPosition = "left" | "background" | "hidden";
type TicketSize = "small" | "medium" | "large";
type CornerStyle = "square" | "soft" | "round";
type EditorTab = "templates" | "colors" | "text" | "images" | "layout";

type TicketTemplate = {
  templateStyle?: TemplateStyle;
  ticketColor?: string;
  backgroundColor?: string;
  textColor?: string;
  ticketSize?: TicketSize;
  flyerUrl?: string;
  flyerPosition?: FlyerPosition;
  admissionLabel?: string;
  fontFamily?: string;
  titleSize?: number;
  qrSize?: number;
  stubWidth?: number;
  cornerStyle?: CornerStyle;
  showLocation?: boolean;
  showCustomer?: boolean;
  showTicketNumber?: boolean;
  showFlyer?: boolean;
  titlePosition?: {
    x: number;
    y: number;
  };
};

type TicketDesignerClientProps = {
  eventId: number;
  event: EventData;
  formattedDate: string;
  formattedTime: string;
  initialTemplate?: TicketTemplate;
};

const templatePresets: Record<
  TemplateStyle,
  {
    label: string;
    description: string;
    ticketColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
  }
> = {
  concert: {
    label: "Concert",
    description: "Bold concert-ticket style",
    ticketColor: "#7c3aed",
    backgroundColor: "#fffdf8",
    textColor: "#111827",
    fontFamily: "Arial, sans-serif",
  },
  modern: {
    label: "Modern",
    description: "Clean modern event ticket",
    ticketColor: "#2563eb",
    backgroundColor: "#ffffff",
    textColor: "#0f172a",
    fontFamily: "Arial, sans-serif",
  },
  vintage: {
    label: "Vintage",
    description: "Classic printed ticket look",
    ticketColor: "#b45309",
    backgroundColor: "#f7ecd5",
    textColor: "#292524",
    fontFamily: "Georgia, serif",
  },
  minimal: {
    label: "Minimal",
    description: "Simple black-and-white design",
    ticketColor: "#111827",
    backgroundColor: "#ffffff",
    textColor: "#111827",
    fontFamily: "Arial, sans-serif",
  },
};

const colorPresets = [
  "#2563eb",
  "#7c3aed",
  "#db2777",
  "#dc2626",
  "#ea580c",
  "#16a34a",
  "#0891b2",
  "#111827",
];

const ticketWidths: Record<TicketSize, number> = {
  small: 760,
  medium: 930,
  large: 1100,
};

const cornerRadius: Record<CornerStyle, number> = {
  square: 2,
  soft: 14,
  round: 28,
};

export default function TicketDesignerClient({
  eventId,
  event,
  formattedDate,
  formattedTime,
  initialTemplate = {},
}: TicketDesignerClientProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("templates");

  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>(
    initialTemplate.templateStyle || "concert"
  );

  const [ticketColor, setTicketColor] = useState(
    initialTemplate.ticketColor || "#7c3aed"
  );

  const [backgroundColor, setBackgroundColor] = useState(
    initialTemplate.backgroundColor || "#fffdf8"
  );

  const [textColor, setTextColor] = useState(
    initialTemplate.textColor || "#111827"
  );

  const [ticketSize, setTicketSize] = useState<TicketSize>(
    initialTemplate.ticketSize || "large"
  );

  const [flyerUrl, setFlyerUrl] = useState(
    initialTemplate.flyerUrl || event.image_url || ""
  );

  const [flyerPosition, setFlyerPosition] = useState<FlyerPosition>(
    initialTemplate.flyerPosition || "left"
  );

  const [admissionLabel, setAdmissionLabel] = useState(
    initialTemplate.admissionLabel || "VIP Admission"
  );

  const [fontFamily, setFontFamily] = useState(
    initialTemplate.fontFamily || "Arial, sans-serif"
  );

  const [titleSize, setTitleSize] = useState(
    initialTemplate.titleSize || 42
  );

  const [titlePosition, setTitlePosition] = useState(
    initialTemplate.titlePosition || {
      x: 0,
      y: 0,
    }
  );

  const [qrSize, setQrSize] = useState(initialTemplate.qrSize || 150);

  const [stubWidth, setStubWidth] = useState(
    initialTemplate.stubWidth || 250
  );

  const [cornerStyle, setCornerStyle] = useState<CornerStyle>(
    initialTemplate.cornerStyle || "soft"
  );

  const [showFlyer, setShowFlyer] = useState(
    initialTemplate.showFlyer ?? true
  );

  const [showLocation, setShowLocation] = useState(
    initialTemplate.showLocation ?? true
  );

  const [showCustomer, setShowCustomer] = useState(
    initialTemplate.showCustomer ?? true
  );

  const [showTicketNumber, setShowTicketNumber] = useState(
    initialTemplate.showTicketNumber ?? true
  );

  const [previewZoom, setPreviewZoom] = useState(70);
  const [saving, setSaving] = useState(false);
  const [uploadingFlyer, setUploadingFlyer] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState("");
  useEffect(() => {
  QRCode.toDataURL("LP-000001", {
    width: 300,
    margin: 2,
  })
    .then((url) => setQrCodeUrl(url))
    .catch((error) => {
      console.error("QR code preview error:", error);
    });
}, []);

  const ticketWidth = ticketWidths[ticketSize];

  const flyerWidth =
    flyerPosition === "left" && showFlyer ? 270 : 0;

  function chooseTemplate(style: TemplateStyle) {
    const preset = templatePresets[style];

    setTemplateStyle(style);
    setTicketColor(preset.ticketColor);
    setBackgroundColor(preset.backgroundColor);
    setTextColor(preset.textColor);
    setFontFamily(preset.fontFamily);
  }

  async function handleFlyerUpload(
    changeEvent: ChangeEvent<HTMLInputElement>
  ) {
    const file = changeEvent.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file.");
      return;
    }

    try {
      setUploadingFlyer(true);

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
        alert("Could not upload the flyer.");
        return;
      }

      setFlyerUrl(data.secure_url);
      setShowFlyer(true);

      if (flyerPosition === "hidden") {
        setFlyerPosition("left");
      }
    } catch (error) {
      console.error("Flyer upload error:", error);
      alert("Something went wrong while uploading.");
    } finally {
      setUploadingFlyer(false);
      changeEvent.target.value = "";
    }
  }

  async function saveDesign() {
    try {
      setSaving(true);

      const response = await fetch("/api/ticket-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          eventId,
          template: {
            templateStyle,
            ticketColor,
            backgroundColor,
            textColor,
            ticketSize,
            flyerUrl,
            flyerPosition,
            admissionLabel,
            fontFamily,
            titleSize,
            titlePosition,
            qrSize,
            stubWidth,
            cornerStyle,
            showFlyer,
            showLocation,
            showCustomer,
            showTicketNumber,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Could not save ticket design.");
        return;
      }

      alert("Ticket design saved!");
    } catch (error) {
      console.error("Ticket design save error:", error);
      alert("Something went wrong while saving.");
    } finally {
      setSaving(false);
    }
  }

  function resetDesign() {
    chooseTemplate("concert");
    setTicketSize("large");
    setFlyerUrl(event.image_url || "");
    setFlyerPosition("left");
    setAdmissionLabel("VIP Admission");
    setTitleSize(42);
    setTitlePosition({ x: 0, y: 0 });
    setQrSize(150);
    setStubWidth(250);
    setCornerStyle("soft");
    setShowFlyer(true);
    setShowLocation(true);
    setShowCustomer(true);
    setShowTicketNumber(true);
    setPreviewZoom(70);
  }

  return (
    <>
      <style jsx>{`
        .studio-layout {
          display: grid;
          grid-template-columns: 360px minmax(0, 1fr);
          gap: 22px;
          align-items: start;
        }

        .editor-panel {
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 18px;
          overflow: hidden;
        }

        .editor-tabs {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          border-bottom: 1px solid #334155;
        }

        .tab-button {
          border: none;
          border-right: 1px solid #334155;
          background: #111827;
          color: #94a3b8;
          padding: 12px 4px;
          cursor: pointer;
          font-size: 11px;
          font-weight: 800;
        }

        .tab-button:last-child {
          border-right: none;
        }

        .tab-button.active {
          background: #2563eb;
          color: white;
        }

        .preview-panel {
          position: sticky;
          top: 20px;
          min-width: 0;
        }

        @media (max-width: 1000px) {
          .studio-layout {
            grid-template-columns: 1fr;
          }

          .preview-panel {
            position: static;
          }
        }
      `}</style>

      <div className="studio-layout">
        <aside className="editor-panel">
          <div
            style={{
              padding: "18px 18px 14px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: 22,
              }}
            >
              Ticket Design Studio
            </h2>

            <p
              style={{
                margin: "6px 0 0",
                color: "#94a3b8",
                fontSize: 13,
              }}
            >
              Choose a tab and edit only what you need.
            </p>
          </div>

          <div className="editor-tabs">
            <TabButton
              label="Style"
              tab="templates"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Colors"
              tab="colors"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Text"
              tab="text"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Images"
              tab="images"
              activeTab={activeTab}
              onClick={setActiveTab}
            />

            <TabButton
              label="Layout"
              tab="layout"
              activeTab={activeTab}
              onClick={setActiveTab}
            />
          </div>

          <div
            style={{
              padding: 18,
              minHeight: 390,
            }}
          >
            {activeTab === "templates" && (
              <div>
                <PanelTitle
                  title="Choose a Ticket Style"
                  description="Start with a professional layout."
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 12,
                  }}
                >
                  {(Object.keys(templatePresets) as TemplateStyle[]).map(
                    (style) => {
                      const preset = templatePresets[style];

                      return (
                        <button
                          key={style}
                          type="button"
                          onClick={() => chooseTemplate(style)}
                          style={{
                            minHeight: 105,
                            padding: 14,
                            textAlign: "left",
                            borderRadius: 12,
                            border:
                              templateStyle === style
                                ? `3px solid ${ticketColor}`
                                : "1px solid #475569",
                            background: "#1e293b",
                            color: "white",
                            cursor: "pointer",
                          }}
                        >
                          <div
                            style={{
                              height: 8,
                              borderRadius: 8,
                              background: preset.ticketColor,
                              marginBottom: 12,
                            }}
                          />

                          <strong
                            style={{
                              display: "block",
                              marginBottom: 5,
                            }}
                          >
                            {preset.label}
                          </strong>

                          <span
                            style={{
                              color: "#94a3b8",
                              fontSize: 12,
                              lineHeight: 1.35,
                            }}
                          >
                            {preset.description}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>

                <div
                  style={{
                    marginTop: 20,
                  }}
                >
                  <ControlLabel label="Ticket Size">
                    <select
                      value={ticketSize}
                      onChange={(selectEvent) =>
                        setTicketSize(
                          selectEvent.target.value as TicketSize
                        )
                      }
                      style={inputStyle}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </ControlLabel>
                </div>
              </div>
            )}

            {activeTab === "colors" && (
              <div>
                <PanelTitle
                  title="Ticket Colors"
                  description="Choose colors that match the event."
                />

                <p style={smallLabelStyle}>Quick color choices</p>

                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 22,
                  }}
                >
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      type="button"
                      aria-label={`Use color ${color}`}
                      onClick={() => setTicketColor(color)}
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: "50%",
                        background: color,
                        border:
                          ticketColor === color
                            ? "4px solid white"
                            : "2px solid #475569",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>

                <ColorInput
                  label="Main Accent Color"
                  value={ticketColor}
                  onChange={setTicketColor}
                />

                <ColorInput
                  label="Ticket Background"
                  value={backgroundColor}
                  onChange={setBackgroundColor}
                />

                <ColorInput
                  label="Text Color"
                  value={textColor}
                  onChange={setTextColor}
                />
              </div>
            )}

            {activeTab === "text" && (
              <div>
                <PanelTitle
                  title="Ticket Text"
                  description="Control the headline and admission wording."
                />

                <ControlLabel label="Admission Label">
                  <input
                    type="text"
                    value={admissionLabel}
                    onChange={(inputEvent) =>
                      setAdmissionLabel(inputEvent.target.value)
                    }
                    style={inputStyle}
                  />
                </ControlLabel>

                <ControlLabel label="Font">
                  <select
                    value={fontFamily}
                    onChange={(selectEvent) =>
                      setFontFamily(selectEvent.target.value)
                    }
                    style={inputStyle}
                  >
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="Georgia, serif">Georgia</option>
                    <option value="'Trebuchet MS', sans-serif">
                      Trebuchet
                    </option>
                    <option value="'Courier New', monospace">
                      Concert Mono
                    </option>
                    <option value="Impact, sans-serif">Impact</option>
                  </select>
                </ControlLabel>

                <RangeControl
                  label="Event Title Size"
                  value={titleSize}
                  min={24}
                  max={64}
                  suffix="px"
                  onChange={setTitleSize}
                />

                <RangeControl
                  label="Move Title Left / Right"
                  value={titlePosition.x}
                  min={-150}
                  max={150}
                  suffix="px"
                  onChange={(value) =>
                    setTitlePosition((current) => ({
                      ...current,
                      x: value,
                    }))
                  }
                />

                <RangeControl
                  label="Move Title Up / Down"
                  value={titlePosition.y}
                  min={-80}
                  max={80}
                  suffix="px"
                  onChange={(value) =>
                    setTitlePosition((current) => ({
                      ...current,
                      y: value,
                    }))
                  }
                />
              </div>
            )}

            {activeTab === "images" && (
              <div>
                <PanelTitle
                  title="Flyer and Images"
                  description="Upload the event flyer directly from your computer."
                />

                <ControlLabel label="Upload Flyer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFlyerUpload}
                    disabled={uploadingFlyer}
                    style={{
                      ...inputStyle,
                      height: "auto",
                      padding: 10,
                      cursor: uploadingFlyer
                        ? "not-allowed"
                        : "pointer",
                    }}
                  />
                </ControlLabel>

                <div
                  style={{
                    marginBottom: 18,
                    padding: 12,
                    borderRadius: 10,
                    background: "#1e293b",
                    color: uploadingFlyer
                      ? "#facc15"
                      : flyerUrl
                        ? "#86efac"
                        : "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  {uploadingFlyer
                    ? "Uploading image..."
                    : flyerUrl
                      ? "Flyer image is ready."
                      : "No flyer image selected."}
                </div>

                <ControlLabel label="Flyer Position">
                  <select
                    value={flyerPosition}
                    onChange={(selectEvent) =>
                      setFlyerPosition(
                        selectEvent.target.value as FlyerPosition
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="left">Left Panel</option>
                    <option value="background">
                      Ticket Background
                    </option>
                    <option value="hidden">Hidden</option>
                  </select>
                </ControlLabel>

                

                <SwitchControl
                  label="Show Flyer"
                  checked={showFlyer}
                  onChange={setShowFlyer}
                />
              </div>
            )}

            {activeTab === "layout" && (
              <div>
                <PanelTitle
                  title="Ticket Layout"
                  description="Adjust the stub, QR code, and visible information."
                />

                <ControlLabel label="Corner Style">
                  <select
                    value={cornerStyle}
                    onChange={(selectEvent) =>
                      setCornerStyle(
                        selectEvent.target.value as CornerStyle
                      )
                    }
                    style={inputStyle}
                  >
                    <option value="square">Square</option>
                    <option value="soft">Soft</option>
                    <option value="round">Round</option>
                  </select>
                </ControlLabel>

                <RangeControl
                  label="QR Code Size"
                  value={qrSize}
                  min={100}
                  max={190}
                  suffix="px"
                  onChange={setQrSize}
                />

                <RangeControl
                  label="Stub Width"
                  value={stubWidth}
                  min={210}
                  max={330}
                  suffix="px"
                  onChange={setStubWidth}
                />

                <SwitchControl
                  label="Show Location"
                  checked={showLocation}
                  onChange={setShowLocation}
                />

                <SwitchControl
                  label="Show Customer Name"
                  checked={showCustomer}
                  onChange={setShowCustomer}
                />

                <SwitchControl
                  label="Show Ticket Number"
                  checked={showTicketNumber}
                  onChange={setShowTicketNumber}
                />
              </div>
            )}
          </div>

          <div
            style={{
              padding: 18,
              borderTop: "1px solid #334155",
              display: "grid",
              gap: 10,
            }}
          >
            <button
              type="button"
              onClick={saveDesign}
              disabled={saving}
              style={{
                ...actionButton,
                background: saving ? "#64748b" : "#2563eb",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : "Save Ticket Design"}
            </button>

            <button
              type="button"
              onClick={resetDesign}
              style={{
                ...actionButton,
                background: "#475569",
              }}
            >
              Reset Design
            </button>

            <GenerateTicketButton />
          </div>
        </aside>

        <section className="preview-panel">
          <div
            style={{
              background: "#1e293b",
              border: "1px solid #334155",
              borderRadius: 18,
              padding: 22,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 18,
                marginBottom: 18,
                flexWrap: "wrap",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: 22,
                  }}
                >
                  Live Ticket Preview
                </h2>

                <p
                  style={{
                    margin: "5px 0 0",
                    color: "#94a3b8",
                    fontSize: 13,
                  }}
                >
                  Use Preview Zoom to fit the whole ticket on screen.
                </p>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    color: "#cbd5e1",
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Preview Zoom
                </span>

                <select
                  value={previewZoom}
                  onChange={(selectEvent) =>
                    setPreviewZoom(Number(selectEvent.target.value))
                  }
                  style={{
                    ...inputStyle,
                    width: 110,
                  }}
                >
                  <option value={45}>45%</option>
                  <option value={55}>55%</option>
                  <option value={65}>65%</option>
                  <option value={70}>70%</option>
                  <option value={80}>80%</option>
                  <option value={90}>90%</option>
                  <option value={100}>100%</option>
                </select>
              </div>
            </div>

            <div
              style={{
                width: "100%",
                overflow: "auto",
                background: "#0f172a",
                borderRadius: 14,
                padding: 20,
                minHeight: 470,
              }}
            >
              <div
                style={{
                  width: ticketWidth * (previewZoom / 100),
                  height: 370 * (previewZoom / 100),
                  margin: "0 auto",
                }}
              >
                <div
                  id="printable-ticket"
                  style={{
                    width: ticketWidth,
                    minWidth: ticketWidth,
                    height: 370,
                    display: "grid",
                    gridTemplateColumns:
                      flyerWidth > 0
                        ? `${flyerWidth}px minmax(0, 1fr) ${stubWidth}px`
                        : `minmax(0, 1fr) ${stubWidth}px`,
                    border: `4px solid ${ticketColor}`,
                    borderRadius: cornerRadius[cornerStyle],
                    overflow: "hidden",
                    background: backgroundColor,
                    color: textColor,
                    fontFamily,
                    boxShadow: "0 20px 50px rgba(0,0,0,.4)",
                    transform: `scale(${previewZoom / 100})`,
                    transformOrigin: "top left",
                  }}
                >
                  {flyerWidth > 0 && (
                    <FlyerPanel
                      flyerUrl={flyerUrl}
                      eventName={event.event_name}
                    />
                  )}

                  <div
                    style={{
                      position: "relative",
                      padding: "34px 38px",
                      background:
                        flyerPosition === "background" &&
                        showFlyer &&
                        flyerUrl
                          ? `linear-gradient(rgba(255,255,255,.88), rgba(255,255,255,.88)), url("${flyerUrl}") center/cover`
                          : backgroundColor,
                    }}
                  >
                    <div
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        right: 0,
                        height: 13,
                        background: ticketColor,
                      }}
                    />

                    <p
                      style={{
                        margin: "4px 0 9px",
                        color: ticketColor,
                        fontSize: 12,
                        fontWeight: 900,
                        letterSpacing: 2.4,
                      }}
                    >
                      LAUNCHPAD AI PRESENTS
                    </p>

                    <h1
                      style={{
                        margin: 0,
                        position: "relative",
                        left: titlePosition.x,
                        top: titlePosition.y,
                        fontSize: titleSize,
                        lineHeight: 1,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {event.event_name}
                    </h1>

                    <p
                      style={{
                        margin: "12px 0 23px",
                        color: ticketColor,
                        fontSize: 18,
                        fontWeight: 900,
                        textTransform: "uppercase",
                      }}
                    >
                      {admissionLabel}
                    </p>

                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: "18px 26px",
                        padding: "19px 0",
                        borderTop: "1px solid #cbd5e1",
                        borderBottom: "1px solid #cbd5e1",
                      }}
                    >
                      <TicketField
                        label="Date"
                        value={formattedDate}
                      />

                      <TicketField
                        label="Time"
                        value={formattedTime}
                      />

                      <TicketField
                        label="Venue"
                        value={event.venue}
                      />

                      {showLocation && (
                        <TicketField
                          label="Location"
                          value={event.location}
                        />
                      )}

                      {showCustomer && (
                        <TicketField
                          label="Guest"
                          value="Preview Customer"
                        />
                      )}

                      {showTicketNumber && (
                        <TicketField
                          label="Ticket Number"
                          value="LP-000001"
                        />
                      )}
                    </div>

                    <p
                      style={{
                        margin: "19px 0 0",
                        color: "#64748b",
                        fontSize: 12,
                        fontWeight: 700,
                        textTransform: "uppercase",
                      }}
                    >
                      Present this ticket at the entrance • One entry only
                    </p>
                  </div>

                  <div
                    style={{
                      position: "relative",
                      padding: "24px 18px",
                      background: ticketColor,
                      color: "white",
                      borderLeft:
                        "4px dashed rgba(255,255,255,.85)",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "space-between",
                      textAlign: "center",
                    }}
                  >
                    <TicketNotch position="top" />
                    <TicketNotch position="bottom" />

                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 12,
                          fontWeight: 900,
                          letterSpacing: 2,
                        }}
                      >
                        ADMIT ONE
                      </p>

                      <h2
                        style={{
                          margin: "14px 0 7px",
                          fontSize: 22,
                          textTransform: "uppercase",
                        }}
                      >
                        {event.event_name}
                      </h2>

                      <p
                        style={{
                          margin: "4px 0",
                          fontWeight: 700,
                        }}
                      >
                        {formattedDate}
                      </p>

                      <p
                        style={{
                          margin: "4px 0",
                          fontWeight: 700,
                        }}
                      >
                        {formattedTime}
                      </p>
                    </div>

                    <div
                      style={{
                        width: qrSize,
                        height: qrSize,
                        maxWidth: "90%",
                        background: "white",
                        color: "#111827",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 900,
                        fontSize: 20,
                      }}
                    >
                      {qrCodeUrl ? (
  <img
    src={qrCodeUrl}
    alt="Preview ticket QR code"
    style={{
      width: "100%",
      height: "100%",
      objectFit: "contain",
      padding: 8,
    }}
  />
) : (
  "Loading QR..."
)}
                    </div>

                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: 11,
                          opacity: 0.85,
                        }}
                      >
                        Ticket #
                      </p>

                      <p
                        style={{
                          margin: "4px 0 0",
                          fontWeight: 900,
                          fontSize: 17,
                        }}
                      >
                        {showTicketNumber ? "LP-000001" : "—"}
                      </p>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: 10,
                        opacity: 0.8,
                      }}
                    >
                      Powered by LaunchPad AI
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

function TabButton({
  label,
  tab,
  activeTab,
  onClick,
}: {
  label: string;
  tab: EditorTab;
  activeTab: EditorTab;
  onClick: (tab: EditorTab) => void;
}) {
  return (
    <button
      type="button"
      className={`tab-button ${activeTab === tab ? "active" : ""}`}
      onClick={() => onClick(tab)}
    >
      {label}
    </button>
  );
}

function PanelTitle({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
      }}
    >
      <h3
        style={{
          margin: 0,
          fontSize: 19,
        }}
      >
        {title}
      </h3>

      <p
        style={{
          margin: "5px 0 0",
          color: "#94a3b8",
          fontSize: 13,
        }}
      >
        {description}
      </p>
    </div>
  );
}

function ControlLabel({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label
      style={{
        display: "grid",
        gap: 7,
        marginBottom: 16,
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {label}
      {children}
    </label>
  );
}

function ColorInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ControlLabel label={label}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "52px 1fr",
          gap: 9,
        }}
      >
        <input
          type="color"
          value={value}
          onChange={(inputEvent) =>
            onChange(inputEvent.target.value)
          }
          style={{
            width: 52,
            height: 44,
            border: "1px solid #475569",
            borderRadius: 8,
            background: "#1e293b",
            cursor: "pointer",
          }}
        />

        <input
          type="text"
          value={value}
          onChange={(inputEvent) =>
            onChange(inputEvent.target.value)
          }
          style={inputStyle}
        />
      </div>
    </ControlLabel>
  );
}

function RangeControl({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  suffix: string;
  onChange: (value: number) => void;
}) {
  return (
    <div
      style={{
        marginBottom: 20,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 8,
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        <span>{label}</span>

        <span
          style={{
            color: "#94a3b8",
          }}
        >
          {value}
          {suffix}
        </span>
      </div>

      <input
        type="range"
        value={value}
        min={min}
        max={max}
        onChange={(rangeEvent) =>
          onChange(Number(rangeEvent.target.value))
        }
        style={{
          width: "100%",
          cursor: "pointer",
        }}
      />
    </div>
  );
}

function SwitchControl({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        padding: "11px 0",
        borderBottom: "1px solid #334155",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          fontSize: 14,
          fontWeight: 700,
        }}
      >
        {label}
      </span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(checkboxEvent) =>
          onChange(checkboxEvent.target.checked)
        }
        style={{
          width: 21,
          height: 21,
          cursor: "pointer",
        }}
      />
    </label>
  );
}

function FlyerPanel({
  flyerUrl,
  eventName,
}: {
  flyerUrl: string;
  eventName: string;
}) {
  return (
    <div
      style={{
        padding: 14,
        background: "#111827",
      }}
    >
      {flyerUrl ? (
        <img
          src={flyerUrl}
          alt={`${eventName} flyer`}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: 10,
          }}
        />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "2px dashed #64748b",
            borderRadius: 10,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#cbd5e1",
          }}
        >
          No Flyer
        </div>
      )}
    </div>
  );
}

function TicketField({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div
      style={{
        minWidth: 0,
      }}
    >
      <span
        style={{
          display: "block",
          marginBottom: 5,
          color: "#64748b",
          fontSize: 10,
          fontWeight: 900,
          letterSpacing: 1.1,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>

      <strong
        style={{
          display: "block",
          fontSize: 15,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {value}
      </strong>
    </div>
  );
}

function TicketNotch({
  position,
}: {
  position: "top" | "bottom";
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: -18,
        [position]: -18,
        width: 34,
        height: 34,
        borderRadius: "50%",
        background: "#1e293b",
      }}
    />
  );
}

const inputStyle = {
  width: "100%",
  height: 44,
  padding: "0 11px",
  boxSizing: "border-box" as const,
  border: "1px solid #475569",
  borderRadius: 8,
  background: "#1e293b",
  color: "white",
  fontSize: 14,
};

const actionButton = {
  width: "100%",
  color: "white",
  border: "none",
  padding: "13px 16px",
  borderRadius: 9,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 800,
};

const smallLabelStyle = {
  margin: "0 0 10px",
  color: "#cbd5e1",
  fontSize: 13,
  fontWeight: 700,
};