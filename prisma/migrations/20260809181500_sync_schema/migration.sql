-- Drop old snake_case tables that were orphaned by the init_schema migration
DROP TABLE IF EXISTS "turns" CASCADE;
DROP TABLE IF EXISTS "model_responses" CASCADE;
DROP TABLE IF EXISTS "votes" CASCADE;
DROP TABLE IF EXISTS "threads" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- CreateTable for Turn
CREATE TABLE "Turn" (
    "id" TEXT NOT NULL,
    "threadId" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Turn_pkey" PRIMARY KEY ("id")
);

-- CreateTable for ModelResponse
CREATE TABLE "ModelResponse" (
    "id" TEXT NOT NULL,
    "turnId" TEXT NOT NULL,
    "modelId" TEXT NOT NULL,
    "modelNameSnapshot" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "text" TEXT,
    "timeToFirstToken" INTEGER,
    "tokensPerSecond" DOUBLE PRECISION,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "costUsd" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    CONSTRAINT "ModelResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ModelResponse_turnId_modelId_key" ON "ModelResponse"("turnId", "modelId");

-- Reconcile Vote table
ALTER TABLE "Vote" DROP CONSTRAINT IF EXISTS "Vote_threadId_fkey";
ALTER TABLE "Vote" DROP COLUMN IF EXISTS "promptText";
ALTER TABLE "Vote" DROP COLUMN IF EXISTS "threadId";
ALTER TABLE "Vote" RENAME COLUMN "winnerModel" TO "winnerModelId";
ALTER TABLE "Vote" ADD COLUMN "turnId" TEXT NOT NULL;
CREATE UNIQUE INDEX "Vote_turnId_key" ON "Vote"("turnId");

-- Add Foreign Keys
ALTER TABLE "Turn" ADD CONSTRAINT "Turn_threadId_fkey" FOREIGN KEY ("threadId") REFERENCES "Thread"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ModelResponse" ADD CONSTRAINT "ModelResponse_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_turnId_fkey" FOREIGN KEY ("turnId") REFERENCES "Turn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
