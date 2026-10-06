import { seedDatabase } from '../prisma/seed';
import { agentRepository, testRunRepository, testCaseRepository } from '@siena/shared';
import { processTestRun } from '../../worker/src/worker';
import { comparisonService } from '../src/services/comparisonService';

async function main() {
  console.log('🧪 Starting End-to-End Regression Test Verification...\n');

  await seedDatabase();

  const agents = await agentRepository.getAll();
  const agent = agents[0];
  const versions = await agentRepository.getVersions(agent.id);
  const v1_0 = versions.find((v) => v.version === 'v1.0')!;
  const v1_1 = versions.find((v) => v.version === 'v1.1')!;

  const cases = await testCaseRepository.getAll();
  console.log(`\n🚀 Executing Test Run for Agent [v1.0] (${cases.length} scenarios)...`);
  const run1 = await testRunRepository.create({
    agentVersionId: v1_0.id,
    totalTests: cases.length,
  });
  await processTestRun({ testRunId: run1.id, agentVersionId: v1_0.id });

  console.log(`\n🚀 Executing Test Run for Agent [v1.1] (${cases.length} scenarios)...`);
  const run2 = await testRunRepository.create({
    agentVersionId: v1_1.id,
    totalTests: cases.length,
  });
  await processTestRun({ testRunId: run2.id, agentVersionId: v1_1.id });

  console.log(`\n⚖️ Generating Comparison Report: v1.0 vs v1.1...`);
  const report = await comparisonService.compareRuns(run1.id, run2.id);

  console.log('\n================== COMPARISON REPORT ==================');
  console.log(`Base Run (v1.0):   ${report.baseRun.passed}/${report.baseRun.totalTests} passed`);
  console.log(`Target Run (v1.1): ${report.targetRun.passed}/${report.targetRun.totalTests} passed`);
  console.log(`Pass Rate Delta:   ${report.summary.passRateDelta}%`);
  console.log(`🚨 Regressions:    ${report.summary.totalRegressions}`);
  console.log('=======================================================\n');

  if (report.summary.totalRegressions > 0) {
    console.log('✅ PASS: Engine successfully detected behavioral regressions with rich diffs!');
  } else {
    console.error('❌ FAIL: Regressions were not detected.');
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
