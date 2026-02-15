const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

/**
 * Seed demo tickets for development.
 *
 * @author Panji Setya Nur Prawira
 */
async function main() {
  const tickets = [
    {
      customerName: "John Doe",
      customerEmail: "john@example.com",
      subject: "Double charged on monthly subscription",
      complaint:
        "I was charged twice for my Pro subscription this month. Transaction IDs: TXN-001 and TXN-002. Please refund the duplicate charge immediately.",
      status: "FAILED",
    },
    {
      customerName: "Jane Smith",
      customerEmail: "jane@example.com",
      subject: "Cannot export reports to PDF",
      complaint:
        "The PDF export feature has been broken for the last 3 days. Every time I click export, I get a blank page. I need these reports for my end-of-month review tomorrow.",
      status: "TRIAGED",
      category: "TECHNICAL",
      urgency: "HIGH",
      sentimentScore: 4,
      aiDraft:
        "Dear Jane,\n\nThank you for reporting this issue with the PDF export feature. We understand the urgency given your upcoming end-of-month review.\n\nOur engineering team has been notified and is investigating the issue. In the meantime, you can use the CSV export as a workaround and convert it to PDF using any online converter.\n\nWe aim to have this resolved within the next 24 hours.\n\nBest regards,\nSupport Team",
    },
    {
      customerName: "Bob Wilson",
      customerEmail: "bob@example.com",
      subject: "Feature request: Dark mode",
      complaint:
        "It would be great if you could add a dark mode option to the dashboard. I work late hours and the bright interface strains my eyes. Many modern apps already have this feature.",
      status: "TRIAGED",
      category: "FEATURE_REQUEST",
      urgency: "LOW",
      sentimentScore: 7,
      aiDraft:
        "Dear Bob,\n\nThank you for your suggestion! We appreciate you taking the time to share your feedback about dark mode.\n\nThis is actually one of the most requested features on our roadmap. We're currently in the design phase and expect to release it in Q2 2025.\n\nWe'll make sure to notify you when it becomes available.\n\nBest regards,\nSupport Team",
    },
    {
      customerName: "Alice Chen",
      customerEmail: "alice@example.com",
      subject: "Login keeps failing with correct password",
      complaint:
        "I've been locked out of my account since this morning. I'm 100% sure my password is correct because I just reset it yesterday. I've tried different browsers and clearing cookies but nothing works.",
      status: "PENDING",
      category: "UNCATEGORIZED",
    },
  ];

  for (const ticket of tickets) {
    await prisma.ticket.create({ data: ticket });
  }

  console.log(`Seeded ${tickets.length} tickets.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
