import "server-only";

import { createFalClient } from "@fal-ai/client";

export const FAL_ENDPOINTS = {
  text: "openrouter/router",
  flyerImage: "fal-ai/qwen-image-2/text-to-image",
  imageEdit: "fal-ai/qwen-image-2/edit",
  promotionalVideo: "fal-ai/pika/v2.2/image-to-video",
} as const;

export const DEFAULT_FAL_TEXT_MODEL = "google/gemini-2.5-flash";

type FalTextOutput = {
  output?: unknown;
  error?: unknown;
};

export type FalFlyerBannerRequest = {
  prompt: string;
  format:
    | "square"
    | "portrait_4_3"
    | "portrait_16_9"
    | "landscape_4_3"
    | "landscape_16_9";
};

export type FalPikaPromotionalVideoRequest = {
  imageUrl: string;
  prompt: string;
};

type FalVideoOutput = {
  video?: { url?: unknown };
};

type FalImageOutput = {
  images?: Array<{ url?: unknown }>;
};

export type FalImageStudioSize =
  | "event-flyer"
  | "square-social"
  | "story"
  | "banner";

const IMAGE_STUDIO_SIZES: Record<
  FalImageStudioSize,
  { width: number; height: number }
> = {
  "event-flyer": { width: 1200, height: 1500 },
  "square-social": { width: 1200, height: 1200 },
  story: { width: 1080, height: 1920 },
  banner: { width: 1600, height: 900 },
};

export async function generateFalMarketingText(input: {
  prompt: string;
  systemPrompt: string;
  maxTokens: number;
}) {
  const client = getFalClient();
  const response = await client.subscribe(FAL_ENDPOINTS.text, {
    input: {
      prompt: input.prompt,
      system_prompt: input.systemPrompt,
      model: process.env.FAL_TEXT_MODEL || DEFAULT_FAL_TEXT_MODEL,
      reasoning: false,
      temperature: 0.65,
      max_tokens: input.maxTokens,
    },
    logs: false,
    timeout: 45_000,
    startTimeout: 20,
  });
  const data = response.data as FalTextOutput;

  if (data.error) {
    throw new Error("fal.ai returned an error for the text request.");
  }

  const output = String(data.output || "").trim();

  if (!output) {
    throw new Error("fal.ai returned an empty text response.");
  }

  return output;
}

// These builders keep future media endpoints and schemas centralized. They are
// intentionally not connected to public routes until admin controls, billing,
// storage, and asynchronous job tracking are added for media generation.
export function buildFalFlyerBannerInput(input: FalFlyerBannerRequest) {
  return {
    endpoint: FAL_ENDPOINTS.flyerImage,
    input: {
      prompt: input.prompt,
      image_size: input.format,
      enable_prompt_expansion: true,
      enable_safety_checker: true,
      num_images: 1,
      output_format: "png" as const,
    },
  };
}

export function buildFalPikaPromotionalVideoInput(
  input: FalPikaPromotionalVideoRequest
) {
  return {
    endpoint: FAL_ENDPOINTS.promotionalVideo,
    input: {
      image_url: input.imageUrl,
      prompt: input.prompt,
      negative_prompt:
        "blurry, distorted lettering, unreadable event text, warped faces, low quality",
      resolution: "720p" as const,
      duration: "5" as const,
    },
  };
}

export async function uploadFalImage(file: Blob) {
  return getFalClient().storage.upload(file, {
    lifecycle: { expiresIn: "30d" },
  });
}

export async function submitFalPikaPromotionalVideo(
  input: FalPikaPromotionalVideoRequest
) {
  const request = buildFalPikaPromotionalVideoInput(input);
  const response = await getFalClient().queue.submit(request.endpoint, {
    input: request.input,
    startTimeout: 30,
    storageSettings: { expiresIn: "1y" },
  });

  return response.request_id;
}

export async function getFalPikaPromotionalVideoStatus(requestId: string) {
  const client = getFalClient();
  const status = await client.queue.status(FAL_ENDPOINTS.promotionalVideo, {
    requestId,
    logs: false,
  });

  if (status.status !== "COMPLETED") {
    return {
      status: status.status === "IN_PROGRESS" ? "processing" : "queued",
      videoUrl: "",
    } as const;
  }

  const result = await client.queue.result(FAL_ENDPOINTS.promotionalVideo, {
    requestId,
  });
  const data = result.data as FalVideoOutput;
  const videoUrl = String(data.video?.url || "").trim();

  if (!videoUrl) {
    throw new Error("fal.ai completed the request without a video URL.");
  }

  return { status: "completed", videoUrl } as const;
}

export async function submitFalImageStudio(input: {
  mode: "text-to-image" | "edit-image";
  prompt: string;
  size: FalImageStudioSize;
  sourceImageUrl?: string;
}) {
  const endpoint =
    input.mode === "edit-image"
      ? FAL_ENDPOINTS.imageEdit
      : FAL_ENDPOINTS.flyerImage;
  const commonInput = {
    prompt: input.prompt,
    image_size: IMAGE_STUDIO_SIZES[input.size],
    negative_prompt:
      "blurry, low resolution, distorted lettering, unreadable text, watermark",
    enable_prompt_expansion: true,
    enable_safety_checker: true,
    num_images: 1,
    output_format: "png" as const,
  };
  const modelInput =
    input.mode === "edit-image"
      ? { ...commonInput, image_urls: [String(input.sourceImageUrl || "")] }
      : commonInput;
  const response = await getFalClient().queue.submit(endpoint, {
    input: modelInput,
    startTimeout: 30,
    storageSettings: { expiresIn: "1y" },
  });

  return { requestId: response.request_id, endpoint };
}

export async function getFalImageStudioStatus(input: {
  requestId: string;
  endpoint: string;
}) {
  const client = getFalClient();
  const status = await client.queue.status(input.endpoint, {
    requestId: input.requestId,
    logs: false,
  });

  if (status.status !== "COMPLETED") {
    return {
      status: status.status === "IN_PROGRESS" ? "processing" : "queued",
      imageUrl: "",
    } as const;
  }

  const result = await client.queue.result(
    input.endpoint as typeof FAL_ENDPOINTS.flyerImage,
    { requestId: input.requestId }
  );
  const data = result.data as FalImageOutput;
  const imageUrl = String(data.images?.[0]?.url || "").trim();

  if (!imageUrl) {
    throw new Error("fal.ai completed the request without an image URL.");
  }

  return { status: "completed", imageUrl } as const;
}

function getFalClient() {
  const key = process.env.FAL_KEY;

  if (!key) {
    throw new Error("FAL_KEY is not configured.");
  }

  return createFalClient({ credentials: key });
}
