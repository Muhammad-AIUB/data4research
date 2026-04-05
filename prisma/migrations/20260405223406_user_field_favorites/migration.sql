-- CreateTable
CREATE TABLE "UserFieldFavorite" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reportType" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "fieldLabel" TEXT NOT NULL,
    "reportName" TEXT,
    "sectionTitle" TEXT,
    "defaultValue" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserFieldFavorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UserFieldFavorite_userId_idx" ON "UserFieldFavorite"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserFieldFavorite_userId_reportType_fieldName_key" ON "UserFieldFavorite"("userId", "reportType", "fieldName");

-- AddForeignKey
ALTER TABLE "UserFieldFavorite" ADD CONSTRAINT "UserFieldFavorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
