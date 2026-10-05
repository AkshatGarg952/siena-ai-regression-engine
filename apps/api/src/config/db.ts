import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} catch (err) {
  console.warn('Prisma client initialized with default configuration:', err);
  prisma = new PrismaClient();
}

export { prisma };
export default prisma;
