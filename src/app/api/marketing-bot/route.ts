export const dynamic = "force-dynamic";

import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { PRODUCT_CTA_MAP, normalizeProduct, type ProductKey } from "@/lib/marketing-bot/config";
import { postLeadToWebhook } from "@/lib/marketing-bot/leadWebhook";
import { getBotPrompt } from "@/lib/marketing-bot/prompt";
import { checkRateLimit } from "@/lib/marketing-bot/rateLimiter";

const getOpenAI = () => {
  // Use a dummy key during build phase to prevent static analysis failure.
  // Real key is required only during runtime.
  const apiKey = process.env.OPENAI_API_KEY || "sk-build-time-dummy";
  return new OpenAI({
    apiKey,
  });
};

const tools: any[] = [
  {
    type: "function",
    name: "recommend_product",
    description: "Recommend the best next product page or signup step for the visitor.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        product: {
          type: "string",
          enum: ["resume_builder", "ats_optimizer", "career_workspace", "general_signup"],
        },
        reason: {
          type: "string",
          description: "Why this product is the best next step for this visitor.",
        },
        segment: {
          type: "string",
          description: "Visitor segment, for example student, career_switcher, or active_job_seeker.",
        },
      },
      required: ["product", "reason", "segment"],
      additionalProperties: false,
    },
  },
  {
    type: "function",
    name: "save_lead",
    description: "Store a lead only after the visitor has explicitly opted in to receive follow-up or marketing emails.",
    strict: true,
    parameters: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Visitor email address.",
        },
        first_name: {
          type: ["string", "null"],
          description: "Visitor first name when known.",
        },
        goal: {
          type: "string",
          description: "What the visitor wants help with.",
        },
        segment: {
          type: ["string", "null"],
          description: "Visitor segment when known.",
        },
        consent_marketing: {
          type: "boolean",
          description: "Must be true before this function is called.",
        },
        notes: {
          type: ["string", "null"],
          description: "Optional notes for the CRM or email tool.",
        },
      },
      required: ["email", "first_name", "goal", "segment", "consent_marketing", "notes"],
      additionalProperties: false,
    },
  },
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
  if (!process.env.OPENAI_API_KEY) {
    return false;
  }

  try {
    const moderation = await getOpenAI().moderations.create({
      model: "omni-moderation-latest",
      input: message,
    });

    return Boolean(moderation.results?.[0]?.flagged);
  } catch (error) {
    console.warn("[marketing-bot:moderation]", error);
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
    const model = String(process.env.MARKETING_BOT_MODEL || "gpt-4o-mini").trim();
    const userEnvelope = {
      user_message: message,
      page: body?.page ?? {},
      session_id: body?.sessionId ?? null,
      timestamp: new Date().toISOString(),
    };

    // Use the newer responses.create API if available in this SDK version
    let response: any = await (getOpenAI() as any).responses.create({
      model,
      instructions,
      previous_response_id: body?.previousResponseId || undefined,
      parallel_tool_calls: false,
      tools,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: JSON.stringify(userEnvelope),
            },
          ],
        },
      ],
    });

    const actions: any[] = [];
    let leadSaved = false;
    let toolPasses = 0;

    while (toolPasses < 4) {
      const functionCalls = (response.output ?? []).filter((item: any) => item.type === "function_call");
      if (!functionCalls.length) break;

      const functionOutputs: any[] = [];

      for (const call of functionCalls) {
        const args = safeJsonParse(call.arguments);

        if (call.name === "recommend_product") {
          const product = normalizeProduct(String(args.product ?? "general_signup"));
          const cta = PRODUCT_CTA_MAP[product];

          actions.push({
            type: "cta",
            label: cta.label,
            url: cta.url,
            reason: String(args.reason ?? ""),
            product,
            segment: String(args.segment ?? ""),
          });

          functionOutputs.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify({
              ok: true,
              product,
              label: cta.label,
              url: cta.url,
              description: cta.description,
            }),
          });
          continue;
        }

        if (call.name === "save_lead") {
          const result = await postLeadToWebhook({
            email: String(args.email ?? ""),
            first_name: args.first_name == null ? undefined : String(args.first_name),
            goal: String(args.goal ?? "General career help"),
            segment: args.segment == null ? undefined : String(args.segment),
            consent_marketing: Boolean(args.consent_marketing),
            source_page: body?.page?.path,
            session_id: body?.sessionId,
            notes: args.notes == null ? undefined : String(args.notes),
          });

          leadSaved = leadSaved || Boolean(result.ok);

          functionOutputs.push({
            type: "function_call_output",
            call_id: call.call_id,
            output: JSON.stringify(result),
          });
        }
      }

      response = await (getOpenAI() as any).responses.create({
        model,
        instructions,
        previous_response_id: response.id,
        parallel_tool_calls: false,
        tools,
        input: functionOutputs,
      });

      toolPasses += 1;
    }

    return NextResponse.json({
      reply: getReplyText(response),
      responseId: response.id,
      actions: dedupeActions(actions),
      leadSaved,
    });
  } catch (error: any) {
    console.error("[marketing-bot:route]", error);
    return NextResponse.json(buildFallbackResponse(userMessage || "general help"));
  }
}
