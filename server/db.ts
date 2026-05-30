import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient;

if (process.env.DATABASE_URL) {
  prisma = new PrismaClient();
} else {
  console.warn("⚠️ DATABASE_URL topilmadi. Baza bilan ishlash vaqtincha to'xtatildi.");
  // Fake proxy to prevent app from crashing on boot if DB is missing
  prisma = new Proxy({} as any, {
    get: () => new Proxy({}, {
      get: () => async () => null
    })
  });
}

export default prisma;
