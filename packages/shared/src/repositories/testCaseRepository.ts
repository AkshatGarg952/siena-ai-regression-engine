import { prisma } from '../config/db';
import { TestCase } from '../types';

const memoryTestCases: Map<string, TestCase> = new Map();

let isDbConnected: boolean | null = null;
async function checkDb(): Promise<boolean> {
  if (isDbConnected !== null) return isDbConnected;
  try {
    await prisma.$queryRaw`SELECT 1`;
    isDbConnected = true;
    return true;
  } catch {
    isDbConnected = false;
    return false;
  }
}

export const testCaseRepository = {
  async getAll(): Promise<TestCase[]> {
    if (await checkDb()) {
      try {
        const rows = await prisma.testCase.findMany({
          orderBy: { createdAt: 'asc' },
        });
        return rows.map((r: any) => ({
          id: r.id,
          name: r.name,
          category: r.category as any,
          input: r.input,
          contextData: r.contextData as any,
          expectedBehavior: r.expectedBehavior as any,
          createdAt: r.createdAt.toISOString(),
        }));
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return Array.from(memoryTestCases.values());
  },

  async getById(id: string): Promise<TestCase | null> {
    if (await checkDb()) {
      try {
        const r = await prisma.testCase.findUnique({ where: { id } });
        if (!r) return null;
        return {
          id: r.id,
          name: r.name,
          category: r.category as any,
          input: r.input,
          contextData: r.contextData as any,
          expectedBehavior: r.expectedBehavior as any,
          createdAt: r.createdAt.toISOString(),
        };
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return memoryTestCases.get(id) || null;
  },

  async create(data: Omit<TestCase, 'id' | 'createdAt'> & { id?: string }): Promise<TestCase> {
    const id = data.id || (crypto.randomUUID ? crypto.randomUUID() : `tc_${Date.now()}`);
    const now = new Date().toISOString();
    const testCase: TestCase = {
      id,
      name: data.name,
      category: data.category,
      input: data.input,
      contextData: data.contextData || null,
      expectedBehavior: data.expectedBehavior,
      createdAt: now,
    };

    if (await checkDb()) {
      try {
        await prisma.testCase.upsert({
          where: { id },
          update: {
            name: data.name,
            category: data.category,
            input: data.input,
            contextData: data.contextData as any,
            expectedBehavior: data.expectedBehavior as any,
          },
          create: {
            id,
            name: data.name,
            category: data.category,
            input: data.input,
            contextData: data.contextData as any,
            expectedBehavior: data.expectedBehavior as any,
          },
        });
        return testCase;
      } catch (e) {
        console.warn('DB upsert failed, saving in memory:', e);
      }
    }

    memoryTestCases.set(id, testCase);
    return testCase;
  },
};
