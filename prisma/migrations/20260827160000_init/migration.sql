-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'NEEDS_CHANGES');

-- CreateEnum
CREATE TYPE "PassportStatus" AS ENUM ('VALID', 'REVOKED');

-- CreateTable
CREATE TABLE "Application" (
    "id" SERIAL NOT NULL,
    "applicationId" TEXT NOT NULL,
    "playerName" TEXT NOT NULL,
    "minecraftUsername" TEXT NOT NULL,
    "discordUsername" TEXT NOT NULL,
    "discordId" TEXT NOT NULL,
    "serverMode" TEXT NOT NULL,
    "playerBio" TEXT NOT NULL,
    "photoKey" TEXT NOT NULL,
    "accessHash" TEXT NOT NULL,
    "status" "Status" NOT NULL DEFAULT 'PENDING',
    "adminMessage" TEXT,
    "rejectionReason" TEXT,
    "passportId" TEXT,
    "passportNumber" TEXT,
    "verificationUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Application_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AdminSession" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AdminSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PlayerSession" (
    "id" SERIAL NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PlayerSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ReviewHistory" (
    "id" SERIAL NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "previousStatus" "Status",
    "newStatus" "Status",
    "actor" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ReviewHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Passport" (
    "id" SERIAL NOT NULL,
    "passportId" TEXT NOT NULL,
    "applicationId" INTEGER NOT NULL,
    "passportNumber" TEXT NOT NULL,
    "issueDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "PassportStatus" NOT NULL DEFAULT 'VALID',
    "verificationId" TEXT NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,
    CONSTRAINT "Passport_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Application_applicationId_key" ON "Application"("applicationId");
CREATE UNIQUE INDEX "Application_passportId_key" ON "Application"("passportId");
CREATE UNIQUE INDEX "Application_passportNumber_key" ON "Application"("passportNumber");
CREATE INDEX "Application_minecraftUsername_idx" ON "Application"("minecraftUsername");
CREATE INDEX "Application_status_idx" ON "Application"("status");
CREATE INDEX "Application_submittedAt_idx" ON "Application"("submittedAt");
CREATE UNIQUE INDEX "AdminSession_tokenHash_key" ON "AdminSession"("tokenHash");
CREATE UNIQUE INDEX "PlayerSession_tokenHash_key" ON "PlayerSession"("tokenHash");
CREATE INDEX "ReviewHistory_applicationId_idx" ON "ReviewHistory"("applicationId");
CREATE UNIQUE INDEX "Passport_passportId_key" ON "Passport"("passportId");
CREATE UNIQUE INDEX "Passport_applicationId_key" ON "Passport"("applicationId");
CREATE UNIQUE INDEX "Passport_passportNumber_key" ON "Passport"("passportNumber");
CREATE UNIQUE INDEX "Passport_verificationId_key" ON "Passport"("verificationId");

ALTER TABLE "PlayerSession" ADD CONSTRAINT "PlayerSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReviewHistory" ADD CONSTRAINT "ReviewHistory_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Passport" ADD CONSTRAINT "Passport_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
