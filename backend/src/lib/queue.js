const { Queue } = require("bullmq");
const IORedis = require("ioredis");

/**
 * Redis connection shared across queue producer and consumers.
 *
 * @author Panji Setya Nur Prawira
 */
const connection = new IORedis(process.env.REDIS_URL || "redis://localhost:6379", {
  maxRetriesPerRequest: null,
});

/**
 * BullMQ queue for AI triage background jobs.
 * Jobs are persisted in Redis for reliability.
 */
const triageQueue = new Queue("triage", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: { age: 86400 },
    removeOnFail: { age: 604800 },
  },
});

module.exports = { triageQueue, connection };
