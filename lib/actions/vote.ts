"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/lib/generated/prisma/client";

export async function castVoteAction(turnId: string, winnerModelId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.upsert({
    where: { clerkId: userId },
    create: { clerkId: userId },
    update: {},
  });
  const dbUserId = dbUser.id;

  if (typeof turnId !== "string" || typeof winnerModelId !== "string") {
    throw new Error("Invalid vote");
  }

  let vote: { id: string; threadId: string };
  try {
    vote = await prisma.$transaction(async (tx) => {
      const turn = await tx.turn.findUnique({
        where: { id: turnId },
        include: { thread: true, responses: true, vote: true },
      });
      if (!turn) throw new Error("Turn not found");
      if (turn.vote) throw new Error("This battle has already been voted on");

      const completedResponses = turn.responses.filter((response) => response.status === "complete");
      if (completedResponses.length < 2) {
        throw new Error("At least two completed responses are required to vote");
      }

      const selectedResponse = completedResponses.find((response) => response.modelId === winnerModelId);
      if (!selectedResponse) throw new Error("Invalid model selection");

      const createdVote = await tx.vote.create({
        data: {
          turnId: turn.id,
          userId: dbUserId,
          winnerModelId: selectedResponse.modelId,
        },
      });
      return { id: createdVote.id, threadId: turn.threadId };
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      throw new Error("This battle has already been voted on");
    }
    throw error;
  }

  revalidatePath(`/t/${vote.threadId}`);

  return { voteId: vote.id };
}
