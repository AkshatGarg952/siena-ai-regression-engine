import { prisma } from '../config/db';
import { Agent, AgentVersion } from '@siena/shared';

// In-memory fallback cache if PostgreSQL is unreachable
const memoryAgents: Map<string, Agent> = new Map();
const memoryVersions: Map<string, AgentVersion> = new Map();

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

export const agentRepository = {
  async getAll(): Promise<Agent[]> {
    if (await checkDb()) {
      try {
        const rows = await prisma.agent.findMany({
          include: { versions: true },
          orderBy: { createdAt: 'desc' },
        });
        return rows.map((r) => ({
          id: r.id,
          name: r.name,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
          versions: r.versions.map((v) => ({
            id: v.id,
            agentId: v.agentId,
            version: v.version,
            systemPrompt: v.systemPrompt,
            sopPolicy: v.sopPolicy,
            config: v.config as any,
            createdAt: v.createdAt.toISOString(),
          })),
        }));
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return Array.from(memoryAgents.values()).map((agent) => ({
      ...agent,
      versions: Array.from(memoryVersions.values()).filter((v) => v.agentId === agent.id),
    }));
  },

  async getById(id: string): Promise<Agent | null> {
    if (await checkDb()) {
      try {
        const r = await prisma.agent.findUnique({
          where: { id },
          include: { versions: true },
        });
        if (!r) return null;
        return {
          id: r.id,
          name: r.name,
          description: r.description,
          createdAt: r.createdAt.toISOString(),
          versions: r.versions.map((v) => ({
            id: v.id,
            agentId: v.agentId,
            version: v.version,
            systemPrompt: v.systemPrompt,
            sopPolicy: v.sopPolicy,
            config: v.config as any,
            createdAt: v.createdAt.toISOString(),
          })),
        };
      } catch (e) {
        console.warn('DB query failed, using memory fallback:', e);
      }
    }
    const agent = memoryAgents.get(id);
    if (!agent) return null;
    return {
      ...agent,
      versions: Array.from(memoryVersions.values()).filter((v) => v.agentId === agent.id),
    };
  },

  async create(data: { name: string; description?: string }): Promise<Agent> {
    const id = crypto.randomUUID ? crypto.randomUUID() : `agent_${Date.now()}`;
    const now = new Date().toISOString();
    const created: Agent = {
      id,
      name: data.name,
      description: data.description || null,
      createdAt: now,
      versions: [],
    };

    if (await checkDb()) {
      try {
        const row = await prisma.agent.create({
          data: {
            id,
            name: data.name,
            description: data.description,
          },
        });
        return {
          id: row.id,
          name: row.name,
          description: row.description,
          createdAt: row.createdAt.toISOString(),
          versions: [],
        };
      } catch (e) {
        console.warn('DB write failed, caching in memory:', e);
      }
    }

    memoryAgents.set(id, created);
    return created;
  },

  async getVersions(agentId: string): Promise<AgentVersion[]> {
    if (await checkDb()) {
      try {
        const rows = await prisma.agentVersion.findMany({
          where: { agentId },
          orderBy: { createdAt: 'asc' },
        });
        return rows.map((v) => ({
          id: v.id,
          agentId: v.agentId,
          version: v.version,
          systemPrompt: v.systemPrompt,
          sopPolicy: v.sopPolicy,
          config: v.config as any,
          createdAt: v.createdAt.toISOString(),
        }));
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return Array.from(memoryVersions.values()).filter((v) => v.agentId === agentId);
  },

  async getVersionById(versionId: string): Promise<AgentVersion | null> {
    if (await checkDb()) {
      try {
        const v = await prisma.agentVersion.findUnique({
          where: { id: versionId },
        });
        if (!v) return null;
        return {
          id: v.id,
          agentId: v.agentId,
          version: v.version,
          systemPrompt: v.systemPrompt,
          sopPolicy: v.sopPolicy,
          config: v.config as any,
          createdAt: v.createdAt.toISOString(),
        };
      } catch (e) {
        console.warn('DB query failed, using memory cache:', e);
      }
    }
    return memoryVersions.get(versionId) || null;
  },

  async createVersion(data: {
    agentId: string;
    version: string;
    systemPrompt: string;
    sopPolicy: string;
    config?: Record<string, any>;
  }): Promise<AgentVersion> {
    const id = crypto.randomUUID ? crypto.randomUUID() : `ver_${Date.now()}`;
    const now = new Date().toISOString();
    const version: AgentVersion = {
      id,
      agentId: data.agentId,
      version: data.version,
      systemPrompt: data.systemPrompt,
      sopPolicy: data.sopPolicy,
      config: data.config || null,
      createdAt: now,
    };

    if (await checkDb()) {
      try {
        const row = await prisma.agentVersion.create({
          data: {
            id,
            agentId: data.agentId,
            version: data.version,
            systemPrompt: data.systemPrompt,
            sopPolicy: data.sopPolicy,
            config: data.config || {},
          },
        });
        return {
          id: row.id,
          agentId: row.agentId,
          version: row.version,
          systemPrompt: row.systemPrompt,
          sopPolicy: row.sopPolicy,
          config: row.config as any,
          createdAt: row.createdAt.toISOString(),
        };
      } catch (e) {
        console.warn('DB write failed, caching in memory:', e);
      }
    }

    memoryVersions.set(id, version);
    return version;
  },
};
