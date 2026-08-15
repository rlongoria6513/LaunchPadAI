export type SmsSendResult = { providerId: string };

export function isTwilioConfigured() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_PHONE_NUMBER
  );
}

export async function sendSms(to: string, body: string): Promise<SmsSendResult> {
  const accountSid = String(process.env.TWILIO_ACCOUNT_SID || "");
  const authToken = String(process.env.TWILIO_AUTH_TOKEN || "");
  const from = String(process.env.TWILIO_PHONE_NUMBER || "");
  if (!accountSid || !authToken || !from) {
    throw new Error("Twilio is not configured on the server.");
  }

  const payload = new URLSearchParams({ To: normalizePhone(to), From: from, Body: body });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: payload,
    }
  );
  const result = (await response.json().catch(() => ({}))) as { sid?: string; message?: string };
  if (!response.ok || !result.sid) throw new Error(result.message || "Twilio could not send the text message.");
  return { providerId: result.sid };
}

export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (value.trim().startsWith("+") && digits.length >= 10 && digits.length <= 15) return `+${digits}`;
  throw new Error("Enter a valid mobile number including area code.");
}
