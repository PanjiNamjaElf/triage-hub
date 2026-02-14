require("dotenv").config();
const { Worker } = require("bullmq");
const IORedis = require("ioredis");
const prisma = require("../lib/prisma");
const { triageTicket } = require("../services/aiService");

/**
 * BullMQ worker that processes AI triage jobs in the background.
 * This ensures the HTTP response is not blocked by LLM calls (3-5s latency).
 *
 * @author Panji Setya Nur Prawira
 */

const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

const worker = new Worker(
  "triage",
  async (job) => {
    const { ticketId } = job.data;
    console.log(`[Worker] Processing ticket: ${ticketId} (attempt ${job.attemptsMade + 1})`);

    // Mark as processing.
    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: "PROCESSING" },
    });

    // Fetch full ticket data for AI context.
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error(`Ticket ${ticketId} not found.`);
    }

    // Call LLM for triage (this is the 3-5s operation).
    const result = await triageTicket(ticket);

    // Persist validated AI result as distinct fields.
    await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: "TRIAGED",
        category: result.category,
        urgency: result.urgency,
        sentimentScore: result.sentimentScore,
        aiDraft: result.draft,
        errorMessage: null,
      },
    });

    console.log(
      `[Worker] Ticket ${ticketId} triaged: ${result.category} / ${result.urgency} / sentiment=${result.sentimentScore}`
    );

    return result;
  },
  {
    connection,
    concurrency: 3,
    limiter: {
      max: 10,
      duration: 60000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[Worker] Job ${job.id} completed.`);
});

worker.on("failed", async (job, error) => {
  console.error(`[Worker] Job ${job.id} failed (attempt ${job.attemptsMade}): ${error.message}`);

  // Persist failure state after all retries exhausted.
  if (job.attemptsMade >= job.opts.attempts) {
    try {
      await prisma.ticket.update({
        where: { id: job.data.ticketId },
        data: {
          status: "FAILED",
          errorMessage: error.message,
          retryCount: job.attemptsMade,
        },
      });
    } catch (dbError) {
      console.error(`[Worker] Failed to update ticket status: ${dbError.message}`);
    }
  }
});

worker.on("error", (error) => {
  console.error(`[Worker] Error: ${error.message}`);
});

console.log("[Worker] Triage worker started. Waiting for jobs...");

// Graceful shutdown.
async function shutdown() {
  console.log("[Worker] Shutting down...");
  await worker.close();
  await connection.quit();
  await prisma.$disconnect();
  process.exit(0);
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
