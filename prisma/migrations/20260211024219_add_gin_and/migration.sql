-- CreateIndex
CREATE INDEX "Patient_tags_idx" ON "Patient" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "Patient_createdAt_idx" ON "Patient"("createdAt" DESC);
