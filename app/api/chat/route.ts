import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from "ai";
import { requireEnv } from "@/lib/env";
import { aj } from "@/lib/arcjet";
import { slidingWindow, detectPromptInjection } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { getFreeModels } from "@/lib/infrastructure/model-catalog";

const routeAj = aj.withRule(
  slidingWindow({
    mode: "LIVE",
    interval: 60, // 60 seconds
    max: 10, // 10 requests per minute
  })
).withRule(
  detectPromptInjection({
    mode: "LIVE",
  })
);

const OPENROUTER_API_KEY = requireEnv("OPENROUTER_API_KEY");

const openrouter = createOpenRouter({
  apiKey: OPENROUTER_API_KEY,
  appName: "LLM Arena",
  appUrl: "http://localhost:3000",
});

type ChatRequest = {
  model: string;
  messages: Array<Omit<UIMessage, "id">>;
};

type ModelMetadata = {
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  timingMs: number;
  firstTokenMs: number | null;
  tokensPerSecond: number | null;
};

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: ChatRequest;
  try {
    body = (await request.json()) as ChatRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "The request body couldn't be read, please try again." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return new Response(
      JSON.stringify({ error: "Unauthorized. Please sign in." }),
      { status: 401, headers: { "content-type": "application/json" } }
    );
  }

  if (typeof body.model !== "string" || body.model.length === 0) {
    return new Response(
      JSON.stringify({ error: "A model must be selected before sending, please try again." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "A message is required before sending, please try again." }),
      { status: 400, headers: { "content-type": "application/json" } },
    );
  }

  // Security validation: verify model is actually free and known
  const freeModels = await getFreeModels();
  const isApproved = freeModels.some((m) => m.id === body.model);
  
  if (!isApproved) {
    return new Response(
      JSON.stringify({ error: "Access denied. Only approved free-tier models are permitted." }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  }

  const latestMessage = body.messages[body.messages.length - 1] as any;
  const promptText = typeof latestMessage?.content === "string" ? latestMessage.content : "";

  const decision = await routeAj.protect(request, {
    detectPromptInjectionMessage: promptText,
  });

  if (decision.isDenied()) {
    if (decision.reason.isRateLimit()) {
      return new Response(JSON.stringify({ error: "Too many requests. Please slow down." }), {
        status: 429,
        headers: { "content-type": "application/json" },
      });
    }
    if (decision.reason.isPromptInjection()) {
      return new Response(JSON.stringify({ error: "That prompt was blocked as potentially unsafe." }), {
        status: 400,
        headers: { "content-type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Access denied." }), {
      status: 403,
      headers: { "content-type": "application/json" },
    });
  }

  const startedAt = performance.now();
  let firstTokenAt: number | null = null;

  try {
    const result = streamText({
      model: openrouter.chat(body.model),
      messages: await convertToModelMessages(body.messages),
    });

    const stream = toUIMessageStream({
      stream: result.stream,
      onError: () => "That model couldn't finish, please try again.",
      messageMetadata: ({ part }) => {
        if (part.type === "text-delta" && firstTokenAt === null) {
          firstTokenAt = performance.now();
        }

        if (part.type === "finish") {
          const timingMs = performance.now() - startedAt;
          const { inputTokens = 0, outputTokens = 0, totalTokens = 0 } = part.totalUsage;
          const streamMs = firstTokenAt === null ? null : performance.now() - firstTokenAt;

          const metadata: ModelMetadata = {
            usage: { inputTokens, outputTokens, totalTokens },
            timingMs,
            firstTokenMs: firstTokenAt === null ? null : firstTokenAt - startedAt,
            tokensPerSecond:
              streamMs !== null && streamMs > 0 ? Math.round((outputTokens / streamMs) * 1000) : null,
          };

          return metadata;
        }

        return undefined;
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch {
    return new Response(
      JSON.stringify({ error: "That model couldn't answer right now. Please try again later." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}