import "server-only";

import { createFalClient } from "@fal-ai/client";

export const FAL_ENDPOINTS = {
  text: "openrouter/router",
  flyerImage: "fal-ai/qwen-image-2/text-to-image",
  promotionalVideo: "fal-ai/pika/v2.2/text-to-video",
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
  prompt: string;
  aspectRatio: "16:9" | "9:16" | "1:1" | "4:5" | "5:4" | "3:2" | "2:3";
  resolution: "720p" | "1080p";
  duration: 5 | 10;
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
      prompt: input.prompt,
      negative_prompt: "blurry, distorted text, unreadable text, low quality",
      aspect_ratio: input.aspectRatio,
      resolution: input.resolution,
      duration: input.duration,
    },
  };
}

function getFalClient() {
  const key = process.env.FAL_KEY;

  if (!key) {
    throw new Error("FAL_KEY is not configured.");
  }

  return createFalClient({ credentials: key });
}
