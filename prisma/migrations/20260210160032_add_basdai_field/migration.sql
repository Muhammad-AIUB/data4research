-- AlterTable
ALTER TABLE "PatientTest" ADD COLUMN     "basdai" JSONB;

-- CreateIndex
CREATE INDEX "Patient_name_idx" ON "Patient"("name");

-- CreateIndex
CREATE INDEX "Patient_mobile_idx" ON "Patient"("mobile");

-- CreateIndex
CREATE INDEX "Patient_patientId_idx" ON "Patient"("patientId");

-- CreateIndex
CREATE INDEX "Patient_finalDiagnosis_idx" ON "Patient"("finalDiagnosis");

-- CreateIndex
CREATE INDEX "Patient_relativeMobile_idx" ON "Patient"("relativeMobile");

-- CreateIndex
CREATE INDEX "Patient_spouseMobile_idx" ON "Patient"("spouseMobile");

-- CreateIndex
CREATE INDEX "PatientTest_patientId_idx" ON "PatientTest"("patientId");

-- CreateIndex
CREATE INDEX "PatientTest_sampleDate_idx" ON "PatientTest"("sampleDate");

-- CreateIndex
CREATE INDEX "PatientTest_createdAt_idx" ON "PatientTest"("createdAt");

-- CreateIndex
CREATE INDEX "PatientTest_patientId_createdAt_idx" ON "PatientTest"("patientId", "createdAt");
