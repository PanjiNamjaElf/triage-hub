const { Router } = require("express");
const {
  validate,
  createTicketSchema,
  updateTicketSchema,
} = require("../middleware/validation");
const {
  listTickets,
  getTicket,
  createTicket,
  resolveTicket,
  retryTriage,
  getStats,
} = require("../controllers/ticketController");

/**
 * Ticket API routes.
 *
 * @author Panji Setya Nur Prawira
 */
const router = Router();

// Stats must be defined before :id to avoid route conflict.
router.get("/stats", getStats);

router.get("/", listTickets);
router.get("/:id", getTicket);
router.post("/", validate(createTicketSchema), createTicket);
router.patch("/:id/resolve", validate(updateTicketSchema), resolveTicket);
router.post("/:id/retry", retryTriage);

module.exports = router;
