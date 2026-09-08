CREATE INDEX "ModelResponse_modelId_idx" ON "ModelResponse"("modelId");
CREATE INDEX "ModelResponse_turnId_idx" ON "ModelResponse"("turnId");
CREATE INDEX "ModelResponse_createdAt_idx" ON "ModelResponse"("createdAt");
CREATE INDEX "Thread_userId_idx" ON "Thread"("userId");
CREATE INDEX "Thread_createdAt_idx" ON "Thread"("createdAt");
CREATE INDEX "Turn_threadId_idx" ON "Turn"("threadId");
CREATE INDEX "Turn_createdAt_idx" ON "Turn"("createdAt");
CREATE INDEX "Vote_userId_idx" ON "Vote"("userId");
CREATE INDEX "Vote_winnerModelId_idx" ON "Vote"("winnerModelId");
CREATE INDEX "Vote_createdAt_idx" ON "Vote"("createdAt");

-- Backfill the @@unique([turnId, modelId]) backing index: the hosted database
-- was baselined from a pushed schema that never created it (verified zero
-- duplicate (turnId, modelId) pairs before adding).
CREATE UNIQUE INDEX "ModelResponse_turnId_modelId_key" ON "ModelResponse"("turnId", "modelId");
