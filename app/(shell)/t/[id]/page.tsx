import { auth } from "@clerk/nextjs/server";
import { notFound, forbidden } from "next/navigation";
import { prisma } from "@/lib/db";
import { TurnView, type TurnData } from "@/features/arena/components/turn-view";
import { ArenaComposer } from "@/features/arena/components/arena-composer";
import { getFreeModels } from "@/lib/infrastructure/model-catalog";
import { aj } from "@/lib/arcjet";
import { slidingWindow } from "@arcjet/next";
import { headers } from "next/headers";

/**
 * A saved thread, and the URL that feature 8 shares. Anyone can open this link
 * and see the thread, signed in or not: `notFound()` is the only gate.
 *
 * `isOwner` controls two things:
 * 1. Whether StreamingModelResponseCard fires (non-owners never trigger a stream,
 *    they just see the stored text from the DB)
 * 2. Whether the chat composer renders (only owner can continue the thread)
 *
 * Any signed-in user can vote on any thread — the vote button is shown to all
 * signed-in users. Unsigned users see a "please login" prompt.
 */
export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: threadId } = await params;
  const { userId: clerkId } = await auth();

  // Create a synthetic Request to run Arcjet in a Server Component
  const req = new Request(`https://llm-arena.com/t/${threadId}`, {
    headers: await headers()
  });

  // Apply base rules (Shield, Bot Detection) + route-specific Rate Limiting (IP-based, generous)
  const decision = await aj
    .withRule(
      slidingWindow({
        mode: "LIVE",
        interval: "60s",
        max: 60, // Generous limit for public link viewing
      })
    )
    .protect(req);

  if (decision.isDenied()) {
    forbidden();
  }
  
  // Find the thread
  const thread = await prisma.thread.findUnique({
    where: { id: threadId },
    include: {
      turns: {
        orderBy: { createdAt: "asc" },
        include: {
          responses: true,
          vote: true
        }
      }
    }
  });

  if (!thread) notFound();

  const catalog = await getFreeModels();

  // Determine if the current viewer is the thread owner.
  // Only the owner can continue the thread AND trigger live streaming.
  // A non-owner always sees stored DB text (no stream re-triggered).
  let isOwner = false;
  if (clerkId) {
    const dbUser = await prisma.user.findUnique({ where: { clerkId } });
    if (dbUser && thread.userId === dbUser.id) {
      isOwner = true;
    } else if (!thread.userId) {
      // Thread was created by an anonymous user — treat the current viewer as owner
      isOwner = true;
    }
  } else if (!thread.userId) {
    // Both thread and viewer are anonymous — allow streaming
    isOwner = true;
  }

  const turns: TurnData[] = thread.turns.map(turn => ({
    id: turn.id,
    prompt: turn.prompt,
    createdAt: turn.createdAt.toISOString(),
    vote: turn.vote ? { winnerModelId: turn.vote.winnerModelId } : null,
    responses: turn.responses.map(res => ({
      id: res.id,
      modelId: res.modelId,
      modelNameSnapshot: res.modelNameSnapshot,
      status: res.status,
      text: res.text,
      timeToFirstToken: res.timeToFirstToken,
      tokensPerSecond: res.tokensPerSecond ? Number(res.tokensPerSecond) : null,
      totalTokens: res.totalTokens
    }))
  }));

  const defaultSelection = turns.length > 0 
    ? turns[turns.length - 1].responses.map(r => r.modelId) 
    : [];

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] relative">
      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8">
        {turns.map((turn, index) => (
          <TurnView 
            key={turn.id}
            turn={turn}
            historicalTurns={turns.slice(0, index)}
            isOwner={isOwner}
            isSignedIn={!!clerkId}
          />
        ))}
      </div>
      
      {/* Floating sticky composer at bottom */}
      <div className="sticky bottom-0 px-4 pt-2 pb-4 sm:px-6 w-full max-w-4xl mx-auto z-10 bg-background/95 backdrop-blur-md">
        <div className="mx-auto w-full p-2">
          {clerkId ? (
            <ArenaComposer catalog={catalog} threadId={thread.id} defaultSelection={defaultSelection} />
          ) : (
            // Not logged in: show login prompt
            <div className="bg-muted text-center py-4 rounded-xl border border-border">
              <p className="text-muted-foreground text-sm font-medium">Please sign in to vote and chat</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
