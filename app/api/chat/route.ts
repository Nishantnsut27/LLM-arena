import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import {
  streamText,
  toUIMessageStream,
  createUIMessageStreamResponse,
  type UIMessage,
} from "ai";
import { requireEnv } from "@/lib/env";
import { aj } from "@/lib/arcjet";
import { slidingWindow, detectPromptInjection } from "@arcjet/next";
import { auth } from "@clerk/nextjs/server";
import { getFreeModels } from "@/lib/infrastructure/model-catalog";
import { prisma } from "@/lib/db";
import { calculateEstimatedCost } from "@/lib/arena-cost";

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
  modelId: string;
  turnId: string;
  messages: Array<Omit<UIMessage, "id">>;
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

  if (typeof body.modelId !== "string" || body.modelId.length === 0) {
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
  const selectedCatalogModel = freeModels.find((m) => m.id === body.modelId);
  const isApproved = !!selectedCatalogModel;
  
  if (!isApproved) {
    return new Response(
      JSON.stringify({ error: "Access denied. Only approved free-tier models are permitted." }),
      { status: 403, headers: { "content-type": "application/json" } },
    );
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  
  // Verify the turn exists and belongs to the authenticated user's thread
  const turn = await prisma.turn.findUnique({
    where: { id: body.turnId },
    include: { thread: true, responses: true },
  });

  if (!turn || (turn.thread.userId && turn.thread.userId !== dbUser?.id)) {
    return new Response(
      JSON.stringify({ error: "Unauthorized access to thread." }),
      { status: 403, headers: { "content-type": "application/json" } }
    );
  }

  const responseRecord = turn.responses.find((response) => response.modelId === body.modelId);
  if (!responseRecord) {
    return new Response(JSON.stringify({ error: "This model is not part of the selected battle." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }
  if (responseRecord.status !== "streaming") {
    return new Response(JSON.stringify({ error: "This response is not available for another generation." }), {
      status: 409,
      headers: { "content-type": "application/json" },
    });
  }

  const latestMessage = body.messages[body.messages.length - 1] as
    | { content?: unknown }
    | undefined;
  const promptText =
    latestMessage && typeof latestMessage.content === "string" ? latestMessage.content : "";

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
    const result = await streamText({
      model: openrouter.chat(body.modelId),
      messages: body.messages.map((message) => {
        const maybeContent = (message as { content?: unknown }).content;
        const rawParts = (message as { parts?: unknown }).parts;
        const content =
          (typeof maybeContent === "string" && maybeContent) ||
          (Array.isArray(rawParts)
            ? rawParts
                .filter(
                  (p): p is { type: string; text: string } =>
                    typeof p === "object" &&
                    p !== null &&
                    (p as { type?: unknown }).type === "text" &&
                    typeof (p as { text?: unknown }).text === "string",
                )
                .map((p) => p.text)
                .join("")
            : "");
            
        return {
          role: message.role as "user" | "assistant" | "system",
          content,
        };
      }),
      onChunk: ({ chunk }) => {
        if (chunk.type === "text-delta" && firstTokenAt === null) {
          firstTokenAt = performance.now();
        }
      },
      onFinish: async ({ text, usage }) => {
        const streamMs = firstTokenAt === null ? null : performance.now() - firstTokenAt;
        const ttft = firstTokenAt === null ? null : Math.round(firstTokenAt - startedAt);
        const inputTokens = usage.inputTokens ?? null;
        const outputTokens = usage.outputTokens ?? null;
        const totalTokens = inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;
        const tps = streamMs !== null && streamMs > 0 && outputTokens != null
          ? outputTokens / (streamMs / 1000)
          : null;

        await prisma.modelResponse.update({
          where: { turnId_modelId: { turnId: body.turnId, modelId: body.modelId } },
          data: {
            status: "complete",
            text,
            timeToFirstToken: ttft,
            tokensPerSecond: tps != null ? Number(tps.toFixed(1)) : null,
            inputTokens,
            outputTokens,
            totalTokens,
            costUsd: calculateEstimatedCost({
              inputTokens,
              outputTokens,
              pricing: selectedCatalogModel.pricing,
            }),
          }
        }).catch(console.error);
      },
    });

    const stream = toUIMessageStream({
      stream: result.stream,
      onError: () => {
        prisma.modelResponse.update({
          where: { turnId_modelId: { turnId: body.turnId, modelId: body.modelId } },
          data: { status: "failed" }
        }).catch(console.error);
        return "That model couldn't finish, please try again.";
      },
      messageMetadata: ({ part }) => {
        if (part.type === "finish") {
           const { inputTokens = null, outputTokens = null } = part.totalUsage;
           const totalTokens = inputTokens != null && outputTokens != null ? inputTokens + outputTokens : null;
          const streamMs = firstTokenAt === null ? null : performance.now() - firstTokenAt;

          return {
            timeToFirstToken: firstTokenAt === null ? null : Math.round(firstTokenAt - startedAt),
             tokensPerSecond: streamMs !== null && streamMs > 0 && outputTokens != null
               ? Number((outputTokens / (streamMs / 1000)).toFixed(1))
               : null,
             inputTokens,
             outputTokens,
             totalTokens,
             estimatedCost: calculateEstimatedCost({
               inputTokens,
               outputTokens,
               pricing: selectedCatalogModel.pricing,
             }),
          };
        }
        return undefined;
      },
    });

    return createUIMessageStreamResponse({ stream });
  } catch (err) {
    console.error("Stream error in /api/chat:", err);
    await prisma.modelResponse.update({
      where: { turnId_modelId: { turnId: body.turnId, modelId: body.modelId } },
      data: { status: "failed" }
    }).catch(console.error);
    
    return new Response(
      JSON.stringify({ error: "That model couldn't answer right now. Please try again later." }),
      { status: 500, headers: { "content-type": "application/json" } },
    );
  }
}
