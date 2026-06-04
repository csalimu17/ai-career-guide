export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PRODUCT_CTA_MAP, normalizeProduct, type ProductKey } from "@/lib/marketing-bot/config";
import { postLeadToWebhook } from "@/lib/marketing-bot/leadWebhook";
import { getBotPrompt } from "@/lib/marketing-bot/prompt";
import { checkRateLimit } from "@/lib/marketing-bot/rateLimiter";
import { getAi } from "@/ai/genkit";
import { generateWithFallback } from "@/ai/generate-helper";
import { getGeminiModel, getFallbackGeminiModel } from "@/ai/model-router";
import { z } from "zod";

const getOpenAI = () => {
  const apiKey = process.env.OPENAI_API_KEY || "sk-build-time-dummy";
  return new OpenAI({
    apiKey,
  });
};

// -- GENKIT TOOLS --
const ai = getAi();

const recommendProductTool = ai.defineTool(
  {
    name: "recommend_product",
    description: "Recommend the best next product page or signup step for the visitor.",
    inputSchema: z.object({
      product: z.enum(["resume_builder", "ats_optimizer", "career_workspace", "general_signup"]),
      reason: z.string().describe("Why this product is the best next step for this visitor."),
      segment: z.string().describe("Visitor segment, for example student, career_switcher, or active_job_seeker."),
    }),
    outputSchema: z.object({
      ok: z.boolean(),
      product: z.string(),
      label: z.string(),
      url: z.string(),
      description: z.string().optional(),
    }),
  },
  async (args: any) => {
    const product = normalizeProduct(args.product);
    const cta = PRODUCT_CTA_MAP[product];
    return {
      ok: true,
      product,
      label: cta.label,
      url: cta.url,
      description: cta.description,
    };
  }
);

const saveLeadTool = ai.defineTool(
  {
    name: "save_lead",
    description: "Store a lead only after the visitor has explicitly opted in to receive follow-up or marketing emails.",
    inputSchema: z.object({
      email: z.string().describe("Visitor email address."),
      first_name: z.string().nullable().optional().describe("Visitor first name when known."),
      goal: z.string().describe("What the visitor wants help with."),
      segment: z.string().nullable().optional().describe("Visitor segment when known."),
      consent_marketing: z.literal(true).describe("Must be true before this function is called."),
      notes: z.string().nullable().optional().describe("Optional notes for the CRM or email tool."),
    }),
    outputSchema: z.object({
      ok: z.boolean(),
      message: z.string().optional(),
    }),
  },
  async (args: any) => {
    const result = await postLeadToWebhook({
      email: args.email,
      first_name: args.first_name || undefined,
      goal: args.goal,
      segment: args.segment || undefined,
      consent_marketing: args.consent_marketing,
      notes: args.notes || undefined,
    });
    return {
      ok: !!result.ok,
      message: 'error' in result ? result.error : undefined,
    };
  }
);


// tools array is kept for legacy compatibility if needed, but we prefer defineTool
const legacyTools: any[] = [
  // ... (keeping symbols just in case, but primary logic moved to Genkit tools)
];


function safeJsonParse(value: any) {
  if (!value) return {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function dedupeActions(actions: any[]) {
  const seen = new Set();
  return actions.filter((action) => {
    const key = `${action.type}:${action.label}:${action.url}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function getReplyText(response: any) {
  if (typeof response?.output_text === "string" && response.output_text.trim()) {
    return response.output_text.trim();
  }

  const output = Array.isArray(response?.output) ? response.output : [];
  for (const item of output) {
    if (item?.type !== "message" || item?.role !== "assistant") continue;
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part?.type === "output_text" && typeof part.text === "string" && part.text.trim()) {
        return part.text.trim();
      }
    }
  }

  return "Tell me whether you want help with your CV, ATS score, or planning your next career move.";
}

function inferFallbackProduct(message: string): ProductKey {
  const input = message.toLowerCase();
  if (/(cv|resume|cover letter|builder|experience)/.test(input)) {
    return "resume_builder";
  }
  if (/(ats|job description|keywords|match score|tailor)/.test(input)) {
    return "ats_optimizer";
  }
  if (/(job|tracker|workspace|plan|career move|dashboard|application)/.test(input)) {
    return "career_workspace";
  }
  return "general_signup";
}

function buildFallbackResponse(message: string) {
  const product = inferFallbackProduct(message);
  const cta = PRODUCT_CTA_MAP[product];

  return {
    reply:
      product === "resume_builder"
        ? "The live assistant is temporarily limited, but the fastest next step is to open the resume builder and start from your current draft."
        : product === "ats_optimizer"
          ? "The live assistant is temporarily limited, but you can still run an ATS check and improve job-description alignment from the optimizer."
          : product === "career_workspace"
            ? "The live assistant is temporarily limited, but your dashboard is still the best place to manage applications, follow-ups, and next steps."
            : "The live assistant is temporarily limited, but you can still create a free account and continue through the main product flow.",
    responseId: null,
    actions: [
      {
        type: "cta",
        label: cta.label,
        url: cta.url,
        reason: "Fallback route selected while the live assistant is temporarily unavailable.",
        product,
        segment: "general",
      },
    ],
    leadSaved: false,
    fallback: true,
  };
}

async function isFlagged(message: string) {
  // If no key is configured, skip moderation
  if (!process.env.OPENAI_API_KEY) {
    return false;
  }

  try {
    const moderation = await getOpenAI().moderations.create({
      model: "omni-moderation-latest",
      input: message,
    });

    return Boolean(moderation.results?.[0]?.flagged);
  } catch (error: any) {
    // If we hit a 429 (Too Many Requests) on moderation, we don't want to block the user.
    // We'll log the warning and allow the request to proceed (best-effort resilience).
    if (error.status === 429) {
      console.warn("[marketing-bot:moderation] OpenAI 429 throttling detected. Proceeding without moderation check.");
      return false;
    }
    
    console.warn("[marketing-bot:moderation] Unexpected moderation failure:", error.message || error);
    return false;
  }
}


export async function POST(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0] : "unknown";
  const limit = checkRateLimit(ip);
  let userMessage = "";

  if (!limit.allowed) {
    return NextResponse.json(
      {
        error: "Too many requests.",
        reply: "You have sent too many messages in a short period. Please try again shortly.",
        actions: [],
        leadSaved: false,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": String(limit.remaining),
          "X-RateLimit-Reset": String(limit.resetAt),
        },
      }
    );
  }

  try {
    const body = await req.json();
    const message = String(body?.message ?? "").trim();
    userMessage = message;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(buildFallbackResponse(message));
    }

    if (await isFlagged(message)) {
      return NextResponse.json({
        reply: "I can help with career planning, CV improvement, ATS questions, and choosing the right AI Career Guide tool, but I cannot help with that request.",
        responseId: body?.previousResponseId ?? null,
        actions: [],
        blocked: true,
        leadSaved: false,
      });
    }

    const instructions = getBotPrompt();
    const model = await getGeminiModel("marketingChat");
    const fallbackModel = getFallbackGeminiModel("marketingChat");

    const userEnvelope = {
      user_message: message,
      page: body?.page ?? {},
      session_id: body?.sessionId ?? null,
      timestamp: new Date().toISOString(),
    };

    const response = await generateWithFallback({
      model,
      system: instructions,
      prompt: JSON.stringify(userEnvelope),
      tools: [recommendProductTool, save_lead_tool_legacy_compatible_alias],
    }, fallbackModel || undefined);

    const actions: any[] = [];
    let leadSaved = false;

    // Process Genkit tool outputs to populate response actions
    if (response.message) {
      for (const part of response.message.content) {
        if (part.toolResponse) {
          const toolName = part.toolResponse.name;
          const toolOutput = part.toolResponse.output as any;

          if (toolName === "recommend_product" && toolOutput?.ok) {
            actions.push({
              type: "cta",
              label: toolOutput.label,
              url: toolOutput.url,
              product: toolOutput.product,
              segment: "visitor", // derived from tool context if needed
            });
          }
          if (toolName === "save_lead" && toolOutput?.ok) {
            leadSaved = true;
          }
        }
      }
    }

    return NextResponse.json({
      reply: response.text,
      responseId: null,
      actions: dedupeActions(actions),
      leadSaved,
    });
  } catch (error: any) {
    console.error("[marketing-bot:route]", error);
    return NextResponse.json(buildFallbackResponse(userMessage || "general help"));
  }
}

// Support for slightly different naming in the loops above
const save_lead_tool_legacy_compatible_alias = saveLeadTool;

