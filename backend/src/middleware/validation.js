const { z } = require("zod");

/**
 * Validation schemas for ticket API requests.
 *
 * @author Panji Setya Nur Prawira
 */

const createTicketSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(255, "Customer name must not exceed 255 characters."),
  customerEmail: z
    .string()
    .trim()
    .email("Invalid email address.")
    .max(255, "Email must not exceed 255 characters."),
  subject: z
    .string()
    .trim()
    .min(1, "Subject is required.")
    .max(500, "Subject must not exceed 500 characters."),
  complaint: z
    .string()
    .trim()
    .min(10, "Complaint must be at least 10 characters.")
    .max(10000, "Complaint must not exceed 10,000 characters."),
});

const updateTicketSchema = z.object({
  resolvedReply: z
    .string()
    .trim()
    .min(1, "Resolved reply is required.")
    .max(10000, "Resolved reply must not exceed 10,000 characters."),
});

/**
 * Express middleware factory for Zod validation.
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against.
 * @returns {Function} Express middleware function.
 */
function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));

      return res.status(422).json({
        error: "Validation failed.",
        details: errors,
      });
    }

    req.validated = result.data;
    next();
  };
}

module.exports = { createTicketSchema, updateTicketSchema, validate };
