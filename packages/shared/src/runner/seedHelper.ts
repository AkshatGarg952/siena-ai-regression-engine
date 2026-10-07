import { agentRepository } from '../repositories/agentRepository';
import { testCaseRepository } from '../repositories/testCaseRepository';
import { INITIAL_TEST_CASES } from '../testCases';
import { AGENT_V1_0, AGENT_V1_1 } from '../agent/prompts';

export async function seedInitialData() {
  const existingAgents = await agentRepository.getAll();
  let agent = existingAgents[0];

  if (!agent) {
    agent = await agentRepository.create({
      name: 'Customer Support Agent',
      description: 'Autonomous customer support agent handling order lookups, returns, and subscriptions.',
    });
  }

  const existingVersions = await agentRepository.getVersions(agent.id);
  const versionMap = new Map(existingVersions.map((v) => [v.version, v]));

  if (!versionMap.has('v1.0')) {
    await agentRepository.createVersion({
      agentId: agent.id,
      version: 'v1.0',
      systemPrompt: AGENT_V1_0.systemPrompt,
      sopPolicy: AGENT_V1_0.sopPolicy,
      config: AGENT_V1_0.config,
    });
  }

  if (!versionMap.has('v1.1')) {
    await agentRepository.createVersion({
      agentId: agent.id,
      version: 'v1.1',
      systemPrompt: AGENT_V1_1.systemPrompt,
      sopPolicy: AGENT_V1_1.sopPolicy,
      config: AGENT_V1_1.config,
    });
  }

  const existingCases = await testCaseRepository.getAll();
  if (existingCases.length === 0) {
    for (const tc of INITIAL_TEST_CASES) {
      await testCaseRepository.create({
        id: tc.id,
        name: tc.name,
        category: tc.category,
        input: tc.input,
        contextData: tc.contextData,
        expectedBehavior: tc.expectedBehavior,
      });
    }
  }
}
