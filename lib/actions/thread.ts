"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import type { ModelCatalogItem } from "@/lib/infrastructure/model-catalog";
import { getFreeModels } from "@/lib/infrastructure/model-catalog";
import { revalidatePath } from "next/cache";

export async function createThreadAction(prompt: string, models: ModelCatalogItem[]) {
  const { userId } = await auth();

  // Find user in our db if they are signed in
  let dbUserId = null;
  if (userId) {
     let dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
     if (!dbUser) {
        dbUser = await prisma.user.create({ data: { clerkId: userId } });
     }
     dbUserId = dbUser.id;
  }

  const thread = await prisma.thread.create({
    data: {
      userId: dbUserId,
      title: prompt.slice(0, 50),
      turns: {
        create: {
          prompt,
          responses: {
            create: models.map(m => ({
              modelId: m.id,
              modelNameSnapshot: m.name,
              status: "streaming",
            }))
          }
        }
      }
    },
    include: {
      turns: {
        include: {
          responses: true
        }
      }
    }
  });

  return { threadId: thread.id, turnId: thread.turns[0].id };
}

export async function createTurnAction(threadId: string, prompt: string, modelIds: string[]) {
  const { userId } = await auth();

  let dbUserId = null;
  if (userId) {
     const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
     if (dbUser) {
        dbUserId = dbUser.id;
     }
  }

  const thread = await prisma.thread.findUnique({ where: { id: threadId } });
  if (!thread) {
    throw new Error("Thread not found");
  }

  if (!dbUserId) {
    throw new Error("Unauthorized");
  }

  // We will either use the existing thread or create a new one (forking)
  let targetThreadId = threadId;
  let didFork = false;

  if (thread.userId && thread.userId !== dbUserId) {
    // Fork the thread
    didFork = true;
    
    // Fetch all existing turns and their responses to copy
    const fullThread = await prisma.thread.findUnique({
      where: { id: threadId },
      include: {
        turns: {
          include: {
            responses: true
          }
        }
      }
    });

    if (!fullThread) throw new Error("Thread disappeared");

    const newThread = await prisma.thread.create({
      data: {
        userId: dbUserId,
        title: thread.title,
        turns: {
          create: fullThread.turns.map(t => ({
            prompt: t.prompt,
            createdAt: t.createdAt,
            responses: {
              create: t.responses.map(r => ({
                modelId: r.modelId,
                modelNameSnapshot: r.modelNameSnapshot,
                status: r.status === "streaming" ? "failed" : r.status,
                text: r.text,
                timeToFirstToken: r.timeToFirstToken,
                tokensPerSecond: r.tokensPerSecond,
                inputTokens: r.inputTokens,
                outputTokens: r.outputTokens,
                totalTokens: r.totalTokens,
                costUsd: r.costUsd,
                createdAt: r.createdAt
              }))
            }
          }))
        }
      }
    });
    
    targetThreadId = newThread.id;
  }

  const models = await getFreeModels();
  const selectedModels = models.filter(m => modelIds.includes(m.id));

  if (selectedModels.length === 0) {
    throw new Error("No valid models selected");
  }

  const turn = await prisma.turn.create({
    data: {
      threadId: targetThreadId,
      prompt,
      responses: {
        create: selectedModels.map((m) => ({
          modelId: m.id,
          modelNameSnapshot: m.name,
          status: "streaming"
        }))
      }
    },
    include: { responses: true }
  });

  // Bump the thread's updatedAt timestamp for recency grouping
  await prisma.thread.update({
    where: { id: targetThreadId },
    data: { updatedAt: new Date() }
  });

  revalidatePath(`/t/${targetThreadId}`);
  if (didFork) {
    revalidatePath(`/t/${threadId}`);
  }
  // revalidate layout to update the sidebar
  revalidatePath(`/`, "layout");

  return { turnId: turn.id, threadId: targetThreadId, didFork };
}
