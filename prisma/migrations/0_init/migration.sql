-- CreateEnum
CREATE TYPE "SaleType" AS ENUM ('foreign', 'local');

-- CreateEnum
CREATE TYPE "ImprovementType" AS ENUM ('Signage', 'Product', 'Promotion', 'Layout', 'Pricing', 'Staff', 'Other');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "daily_records" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "foreignPassers" INTEGER NOT NULL DEFAULT 0,
    "localPassers" INTEGER NOT NULL DEFAULT 0,
    "foreignVisitors" INTEGER NOT NULL DEFAULT 0,
    "localVisitors" INTEGER NOT NULL DEFAULT 0,
    "foreignBuyers" INTEGER NOT NULL DEFAULT 0,
    "localBuyers" INTEGER NOT NULL DEFAULT 0,
    "weather" TEXT,
    "dayType" TEXT,
    "specialNotes" TEXT,
    "missingProducts" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sales" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "type" "SaleType" NOT NULL,
    "amountKes" DECIMAL(12,2) NOT NULL,
    "items" TEXT,
    "dailyRecordId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sales_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "improvements" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "ImprovementType" NOT NULL,
    "description" TEXT,
    "implementationDate" DATE NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "improvements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "daily_records_date_key" ON "daily_records"("date");

-- CreateIndex
CREATE INDEX "daily_records_date_idx" ON "daily_records"("date");

-- CreateIndex
CREATE INDEX "sales_dailyRecordId_idx" ON "sales"("dailyRecordId");

-- CreateIndex
CREATE INDEX "sales_date_idx" ON "sales"("date");

-- CreateIndex
CREATE INDEX "sales_type_idx" ON "sales"("type");

-- CreateIndex
CREATE INDEX "improvements_implementationDate_idx" ON "improvements"("implementationDate");

-- AddForeignKey
ALTER TABLE "sales" ADD CONSTRAINT "sales_dailyRecordId_fkey" FOREIGN KEY ("dailyRecordId") REFERENCES "daily_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;
