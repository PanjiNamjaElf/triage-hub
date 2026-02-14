/**
 * Global error handler middleware.
 * Catches unhandled errors and returns consistent JSON responses.
 *
 * @author Panji Setya Nur Prawira
 */
function errorHandler(err, req, res, _next) {
  console.error(`[Error] ${err.message}`, err.stack);

  // Prisma known errors.
  if (err.code === "P2025") {
    return res.status(404).json({ error: "Record not found." });
  }

  if (err.code === "P2002") {
    return res.status(409).json({ error: "Duplicate record." });
  }

  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "Internal server error."
      : err.message;

  return res.status(statusCode).json({ error: message });
}

module.exports = errorHandler;
