const OpenAI = require("openai");
const { z } = require("zod");

/**
 * Schema for validating AI triage response.
 * Ensures structured data integrity before database insertion.
 *
 * @author Panji Setya Nur Prawira
 */
const TriageResultSchema = z.object({
  category: z.enum(["BILLING", "TECHNICAL", "FEATURE_REQUEST"]),
  urgency: z.enum(["HIGH", "MEDIUM", "LOW"]),
  sentimentScore: z.number().int().min(1).max(10),
  draft: z.string().min(1),
});

/**
 * OpenAI-compatible client.
 * Supports any provider with compatible API (OpenAI, Anthropic via proxy, Groq, etc.).
 */
const openai = new OpenAI({
  apiKey: process.env.LLM_API_KEY,
  baseURL: process.env.LLM_BASE_URL || "https://api.openai.com/v1",
});

const SYSTEM_PROMPT = `You are an AI support triage agent. Analyze customer complaints and return a JSON response.

You MUST respond with ONLY valid JSON (no markdown, no code fences, no extra text).

JSON Schema:
{
  "category": "BILLING" | "TECHNICAL" | "FEATURE_REQUEST",
  "urgency": "HIGH" | "MEDIUM" | "LOW",
  "sentimentScore": <integer 1-10, where 1=very negative, 10=very positive>,
  "draft": "<polite, context-aware response draft addressing the customer's issue>"
}

Triage Rules:
- BILLING: payment issues, charges, refunds, invoices, subscription billing.
- TECHNICAL: bugs, errors, crashes, login issues, performance problems.
- FEATURE_REQUEST: suggestions, enhancements, new functionality requests.
- HIGH urgency: financial impact, service outage, data loss, deadline pressure.
- MEDIUM urgency: functionality issues with workarounds, moderate inconvenience.
- LOW urgency: cosmetic issues, nice-to-have features, general feedback.
- The draft should be empathetic, professional, and actionable.`;

/**
 * Call the LLM to triage a support ticket.
 *
 * @author Panji Setya Nur Prawira
 * @param {object} ticket - The ticket data containing subject and complaint.
 * @param {string} ticket.customerName - Customer's name.
 * @param {string} ticket.subject - Ticket subject line.
 * @param {string} ticket.complaint - Full complaint text.
 * @returns {Promise<object>} Validated triage result.
 * @throws {Error} When LLM returns invalid or unparseable response.
 */
async function triageTicket(ticket) {
  const userMessage = `Customer: ${ticket.customerName}
Subject: ${ticket.subject}
Complaint: ${ticket.complaint}`;

  const response = await openai.chat.completions.create({
    model: process.env.LLM_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userMessage },
    ],
    temperature: 0.3,
    max_tokens: 1024,
  });

  const rawContent = response.choices?.[0]?.message?.content;

  if (!rawContent) {
    throw new Error("LLM returned empty response.");
  }

  // Strip markdown code fences if present (edge case with some models).
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned invalid JSON: ${cleaned.substring(0, 200)}`);
  }

  // Validate with Zod to ensure type safety and constraints.
  const result = TriageResultSchema.safeParse(parsed);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `${i.path.join(".")}: ${i.message}`)
      .join(", ");
    throw new Error(`LLM response validation failed: ${issues}`);
  }

  return result.data;
}

module.exports = { triageTicket };
