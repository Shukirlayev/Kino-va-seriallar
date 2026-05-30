import { PrismaClient } from "@prisma/client";

// Ensure safe instantiation even if DATABASE_URL is missing in preview.
// Queries will fail properly when invoked, but the app won't crash on boot.
const prisma = new PrismaClient();

export default prisma;
