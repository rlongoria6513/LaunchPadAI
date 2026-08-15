import { auth } from "@/app/auth";
import {
  getAiSettings,
  getDailyLimit,
  isAiToolEnabled,
  releaseAiUsage,
  reserveAiUsage,
  type AiTool,
} from "@/app/lib/aiTools";
import { generateFalMarketingText } from "@/app/lib/aiProviders/fal";
import { NextResponse } from "next/server";

type SessionUser = {
  id?: unknown;
  role?: unknown;
};

const VALID_TOOLS = new Set<AiTool>([
  "event-description",
  "social-post",
]);

export async function POST(request: Request) {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  const userId = Number(user?.id || 0);
  const role = String(user?.role || "").toLowerCase();

  if (
    !session ||
    !Number.isInteger(userId) ||
    userId <= 0 ||
    (role !== "admin" && role !== "promoter")
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.FAL_KEY) {
    return NextResponse.json(
      {
        error:
          "LaunchPad AI is not connected yet. An administrator needs to add the fal.ai API key.",
      },
      { status: 503 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "The request could not be read." },
      { status: 400 }
    );
  }

  const tool = String(body.tool || "") as AiTool;

  if (!VALID_TOOLS.has(tool)) {
    return NextResponse.json(
      { error: "Choose a valid LaunchPad AI tool." },
      { status: 400 }
    );
  }

  const eventName = cleanText(body.eventName, 160);
  const eventDetails = cleanText(body.eventDetails, 2500);

  if (!eventName || !eventDetails) {
    return NextResponse.json(
      { error: "Enter an event name and event details first." },
      { status: 400 }
    );
  }

  const settings = await getAiSettings();

  if (!isAiToolEnabled(settings, tool)) {
    return NextResponse.json(
      { error: "This AI tool is currently disabled by the administrator." },
      { status: 403 }
    );
  }

  const limit = getDailyLimit(settings, role);
  const reservation = await reserveAiUsage({
    userId,
    role,
    tool,
    limit,
  });

  if (!reservation.allowed) {
    return NextResponse.json(
      {
        error: `You have reached today's limit of ${limit} uses for this tool. Try again tomorrow.`,
        remaining: 0,
        limit,
      },
      { status: 429 }
    );
  }

  try {
    const result = await generateFalMarketingText({
      systemPrompt:
        "You are LaunchPad AI, a professional event-marketing copywriter. Follow the requested format, use only facts supplied by the user, never invent performers, prices, dates, locations, sponsors, or ticket links, and return only the finished copy without commentary.",
      prompt: buildPrompt(tool, body, eventName, eventDetails),
      maxTokens: tool === "event-description" ? 700 : 500,
    });

    return NextResponse.json({
      result,
      remaining: reservation.remaining,
      limit,
    });
  } catch (error) {
    await releaseAiUsage(userId, tool).catch((releaseError) => {
      console.error("AI usage rollback failed:", releaseError);
    });
    console.error("LaunchPad AI generation failed:", error);

    return NextResponse.json(
      {
        error:
          "The AI writer could not finish that request. Please wait a moment and try again.",
      },
      { status: 502 }
    );
  }
}

function buildPrompt(
  tool: AiTool,
  body: Record<string, unknown>,
  eventName: string,
  eventDetails: string
) {
  const audience = cleanText(body.audience, 300) || "local event fans";
  const tone = cleanText(body.tone, 80) || "exciting and professional";

  if (tool === "event-description") {
    return `Write a polished ticket-page event description of 130-220 words.

Event name: ${eventName}
Event details: ${eventDetails}
Target audience: ${audience}
Tone: ${tone}

Use short readable paragraphs. Include a strong opening and a clear call to action. Do not add hashtags.`;
  }

  const platform = cleanText(body.platform, 40) || "Facebook";
  return `Create one ready-to-post ${platform} social media post for this event.

Event name: ${eventName}
Event details: ${eventDetails}
Target audience: ${audience}
Tone: ${tone}

Keep it appropriate for ${platform}, include a clear ticket call to action, tasteful emojis, and 3-5 relevant hashtags. Do not invent a ticket URL; if none is supplied, say "Get your tickets now" without adding a link.`;
}

function cleanText(value: unknown, maxLength: number) {
  return String(value || "").trim().slice(0, maxLength);
}
