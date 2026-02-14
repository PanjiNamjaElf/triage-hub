const { PrismaClient } = require("@prisma/client");

/**
 * Prisma client singleton to prevent connection pool exhaustion.
 *
 * @author Panji Setya Nur Prawira
 */
const prisma = global.__prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.__prisma = prisma;
}

module.exports = prisma;
