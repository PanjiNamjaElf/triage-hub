require("dotenv").config();
require("express-async-errors");

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const ticketRoutes = require("./routes/tickets");
const errorHandler = require("./middleware/errorHandler");

/**
 * Express application entry point.
 * Starts both the API server and the background triage worker.
 *
 * @author Panji Setya Nur Prawira
 */
const app = express();
const PORT = process.env.PORT || 4000;

// Middleware.
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "1mb" }));
app.use(morgan("short"));

// Routes.
app.use("/api/tickets", ticketRoutes);

// Health check.
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Global error handler.
app.use(errorHandler);

// Start server.
app.listen(PORT, () => {
  console.log(`[Server] API running on http://localhost:${PORT}`);
});

// Start background worker in the same process for simplicity.
// In production, run worker separately: `node src/workers/triageWorker.js`.
require("./workers/triageWorker");

module.exports = app;
