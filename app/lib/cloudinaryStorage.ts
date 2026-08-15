type CloudinaryCredentials = {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export function isDurableVideoStorageConfigured() {
  return Boolean(readCloudinaryCredentials());
}

function readCloudinaryCredentials(): CloudinaryCredentials | null {
  const value = String(process.env.CLOUDINARY_URL || "").trim();
  if (!value) return null;

  try {
    const url = new URL(value);
    if (url.protocol !== "cloudinary:") return null;
    const cloudName = url.hostname;
    const apiKey = decodeURIComponent(url.username);
    const apiSecret = decodeURIComponent(url.password);
    return cloudName && apiKey && apiSecret
      ? { cloudName, apiKey, apiSecret }
      : null;
  } catch {
    return null;
  }
}

export async function uploadDurableAsset(input: {
  file: string | File;
  resourceType: "image" | "video";
  publicId: string;
}) {
  const credentials = readCloudinaryCredentials();
  if (!credentials) {
    throw new Error("CLOUDINARY_URL is not configured on the server.");
  }

  const body = new FormData();
  body.set("file", input.file);
  body.set("public_id", input.publicId);
  body.set("overwrite", "true");
  body.set("invalidate", "true");

  const authorization = Buffer.from(
    `${credentials.apiKey}:${credentials.apiSecret}`
  ).toString("base64");
  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${encodeURIComponent(credentials.cloudName)}/${input.resourceType}/upload`,
    {
      method: "POST",
      headers: { Authorization: `Basic ${authorization}` },
      body,
    }
  );
  const result = (await response.json().catch(() => ({}))) as {
    secure_url?: string;
    public_id?: string;
    error?: { message?: string };
  };

  if (!response.ok || !result.secure_url || !result.public_id) {
    throw new Error(result.error?.message || "Cloudinary could not store this asset.");
  }

  return { url: result.secure_url, publicId: result.public_id };
}
