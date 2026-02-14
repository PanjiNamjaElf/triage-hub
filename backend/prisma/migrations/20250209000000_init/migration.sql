-- CreateEnum
CREATE TYPE "TicketStatus" AS ENUM ('PENDING', 'PROCESSING', 'TRIAGED', 'RESOLVED', 'FAILED');

-- CreateEnum
CREATE TYPE "Urgency" AS ENUM ('HIGH', 'MEDIUM', 'LOW');

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('BILLING', 'TECHNICAL', 'FEATURE_REQUEST', 'UNCATEGORIZED');

-- CreateTable
CREATE TABLE "tickets" (
    "id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "complaint" TEXT NOT NULL,
    "status" "TicketStatus" NOT NULL DEFAULT 'PENDING',
    "category" "Category" NOT NULL DEFAULT 'UNCATEGORIZED',
    "urgency" "Urgency",
    "sentiment_score" SMALLINT,
    "ai_draft" TEXT,
    "resolved_reply" TEXT,
    "error_message" TEXT,
    "retry_count" SMALLINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),

    CONSTRAINT "tickets_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tickets_status_idx" ON "tickets"("status");

-- CreateIndex
CREATE INDEX "tickets_urgency_idx" ON "tickets"("urgency");

-- CreateIndex
CREATE INDEX "tickets_category_idx" ON "tickets"("category");

-- CreateIndex
CREATE INDEX "tickets_created_at_idx" ON "tickets"("created_at" DESC);
