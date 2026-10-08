import dotenv from 'dotenv';
dotenv.config();

if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/siena_db?schema=public';
}

import { PrismaClient } from '@prisma/client';

let prisma: PrismaClient = null as any;

try {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
} catch (err: any) {
  console.warn('Prisma client initialization skipped (using In-Memory mode):', err?.message || err);
  prisma = null as any;
}

export { prisma };
export default prisma;
