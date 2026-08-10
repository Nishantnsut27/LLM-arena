"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function castVoteAction(turnId: string, winnerModelId: string) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) throw new Error("User not found");
  const dbUserId = dbUser.id;

  const turn = await prisma.turn.findUnique({ 
    where: { id: turnId },
    include: { thread: true, responses: true }
  });
  if (!turn) throw new Error("Turn not found");

  const selectedResponse = turn.responses.find(r => r.modelId === winnerModelId);
  if (!selectedResponse) throw new Error("Invalid model selection");
  if (selectedResponse.status !== "COMPLETE") throw new Error("Selected model did not complete successfully");

  const vote = await prisma.vote.create({
    data: {
      turnId,
      userId: dbUserId,
      winnerModelId,
    }
  });

  revalidatePath(`/t/${turn.threadId}`);

  return { voteId: vote.id };
}
