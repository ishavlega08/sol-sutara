import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Connection pool — keeps connections alive between requests instead of
// creating a new TCP connection to the DB on every API call.
const adapter = new PrismaPg({
    connectionString:      process.env.DATABASE_URL!,
    max:                   10,   // up to 10 concurrent DB connections
    idleTimeoutMillis:     30_000,
    connectionTimeoutMillis: 3_000,
});

export const prisma = new PrismaClient({ adapter });
