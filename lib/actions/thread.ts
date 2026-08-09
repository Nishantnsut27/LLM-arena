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
  const models = await getFreeModels();
  const selectedModels = models.filter(m => modelIds.includes(m.id));

  if (selectedModels.length === 0) {
    throw new Error("No valid models selected");
  }

  const turn = await prisma.turn.create({
    data: {
      threadId,
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

  revalidatePath(`/t/${threadId}`);

  return { turnId: turn.id };
}
