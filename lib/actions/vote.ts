"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function castVoteAction(turnId: string, winnerModelId: string) {
  const { userId } = await auth();

  let dbUserId = null;
  if (userId) {
     const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
     if (dbUser) {
        dbUserId = dbUser.id;
     }
  }

  const turn = await prisma.turn.findUnique({ where: { id: turnId } });
  if (!turn) throw new Error("Turn not found");

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
