const prisma = require("../lib/prisma");
const { triageQueue } = require("../lib/queue");

/**
 * Ticket controller handling CRUD operations and triage queue dispatch.
 *
 * @author Panji Setya Nur Prawira
 */

/**
 * List all tickets with optional filtering and pagination.
 *
 * GET /api/tickets?status=TRIAGED&urgency=HIGH&page=1&limit=20
 */
async function listTickets(req, res) {
  const {
    status,
    urgency,
    category,
    page = 1,
    limit = 20,
    sort = "createdAt",
    order = "desc",
  } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const skip = (pageNum - 1) * limitNum;

  // Build dynamic where clause.
  const where = {};
  if (status) where.status = status;
  if (urgency) where.urgency = urgency;
  if (category) where.category = category;

  // Validate sort field to prevent injection.
  const allowedSorts = ["createdAt", "updatedAt", "urgency", "sentimentScore"];
  const sortField = allowedSorts.includes(sort) ? sort : "createdAt";
  const sortOrder = order === "asc" ? "asc" : "desc";

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limitNum,
    }),
    prisma.ticket.count({ where }),
  ]);

  return res.json({
    data: tickets,
    meta: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  });
}

/**
 * Get a single ticket by ID.
 *
 * GET /api/tickets/:id
 */
async function getTicket(req, res) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: req.params.id },
  });

  if (!ticket) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  return res.json({ data: ticket });
}

/**
 * Create a new ticket and enqueue for AI triage.
 * Returns 201 immediately without waiting for AI processing.
 *
 * POST /api/tickets
 */
async function createTicket(req, res) {
  const { customerName, customerEmail, subject, complaint } = req.validated;

  const ticket = await prisma.ticket.create({
    data: {
      customerName,
      customerEmail,
      subject,
      complaint,
      status: "PENDING",
    },
  });

  // Dispatch background job - non-blocking.
  await triageQueue.add(
    "triage-ticket",
    { ticketId: ticket.id },
    { jobId: `triage-${ticket.id}` }
  );

  return res.status(201).json({
    data: ticket,
    message: "Ticket created. AI triage processing in background.",
  });
}

/**
 * Resolve a ticket with agent's edited reply.
 *
 * PATCH /api/tickets/:id/resolve
 */
async function resolveTicket(req, res) {
  const { id } = req.params;
  const { resolvedReply } = req.validated;

  const existing = await prisma.ticket.findUnique({ where: { id } });

  if (!existing) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  if (existing.status === "RESOLVED") {
    return res.status(409).json({ error: "Ticket is already resolved." });
  }

  const ticket = await prisma.ticket.update({
    where: { id },
    data: {
      resolvedReply,
      status: "RESOLVED",
      resolvedAt: new Date(),
    },
  });

  return res.json({
    data: ticket,
    message: "Ticket resolved successfully.",
  });
}

/**
 * Retry AI triage for a failed ticket.
 *
 * POST /api/tickets/:id/retry
 */
async function retryTriage(req, res) {
  const { id } = req.params;

  const existing = await prisma.ticket.findUnique({ where: { id } });

  if (!existing) {
    return res.status(404).json({ error: "Ticket not found." });
  }

  if (!["FAILED", "PENDING"].includes(existing.status)) {
    return res.status(409).json({
      error: "Only FAILED or PENDING tickets can be retried.",
    });
  }

  await prisma.ticket.update({
    where: { id },
    data: { status: "PENDING", errorMessage: null },
  });

  await triageQueue.add(
    "triage-ticket",
    { ticketId: id },
    { jobId: `triage-${id}-retry-${Date.now()}` }
  );

  return res.json({ message: "Triage retry enqueued." });
}

/**
 * Get queue health and statistics.
 *
 * GET /api/tickets/stats
 */
async function getStats(req, res) {
  const [statusCounts, urgencyCounts, queueCounts] = await Promise.all([
    prisma.ticket.groupBy({
      by: ["status"],
      _count: { status: true },
    }),
    prisma.ticket.groupBy({
      by: ["urgency"],
      _count: { urgency: true },
    }),
    triageQueue.getJobCounts(),
  ]);

  return res.json({
    data: {
      byStatus: statusCounts.reduce(
        (acc, item) => ({ ...acc, [item.status]: item._count.status }),
        {}
      ),
      byUrgency: urgencyCounts.reduce(
        (acc, item) => ({
          ...acc,
          [item.urgency || "UNSET"]: item._count.urgency,
        }),
        {}
      ),
      queue: queueCounts,
    },
  });
}

module.exports = {
  listTickets,
  getTicket,
  createTicket,
  resolveTicket,
  retryTriage,
  getStats,
};
