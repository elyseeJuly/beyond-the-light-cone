import { describe, expect, it } from 'vitest';
import { buildReachabilityReport, writeReachabilityReport } from './ReachabilityReport';
import { createPolicy, type SimulationPolicyId } from './policies';
import { runSimulationSuite } from './SimulationSuite';

const ENV = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`Expected positive integer, received: ${value}`);
  }
  return parsed;
}

const SOAK_POLICIES: SimulationPolicyId[] = [
  'cycling-choice',
  'seeded-random-choice',
  'last-choice',
  'first-choice',
];

describe.runIf(ENV.SIM_SOAK === '1')('Headless Game Simulation Harness — soak', () => {
  it('长周期运行不出现异常、事件死锁或回合尝试上限', async () => {
    const runs = parsePositiveInteger(ENV.SIM_SOAK_RUNS, 12);
    const turns = parsePositiveInteger(ENV.SIM_SOAK_TURNS, 500);
    const baseSeed = parsePositiveInteger(ENV.SIM_SOAK_BASE_SEED, 2026072699);

    const summary = runSimulationSuite(Array.from({ length: runs }, (_, index) => {
      const seed = baseSeed + index * 104729;
      const policyId = SOAK_POLICIES[index % SOAK_POLICIES.length];
      return {
        seed,
        targetTurns: turns,
        maxTurnAttempts: turns * 20,
        maxEventResolutionsPerTurn: 200,
        traceLimit: 500,
        createPolicy: () => createPolicy(policyId, seed),
      };
    }));

    const report = buildReachabilityReport(summary);
    const paths = await writeReachabilityReport(report, 'soak');
    console.info('[SoakReport]', JSON.stringify({
      paths,
      runs: summary.totalRuns,
      averageYearsAdvanced: summary.averageYearsAdvanced,
      terminationCounts: summary.terminationCounts,
      observedEndings: report.observed.endings,
      observedEpochs: report.observed.epochs,
    }, null, 2));

    if (summary.failures.length > 0) {
      console.error(JSON.stringify(summary.failures, null, 2));
    }

    expect(summary.failedRuns).toBe(0);
    expect(summary.terminationCounts.exception ?? 0).toBe(0);
    expect(summary.terminationCounts['event-resolution-cap'] ?? 0).toBe(0);
    expect(summary.terminationCounts['turn-attempt-cap'] ?? 0).toBe(0);
  }, 30 * 60 * 1000);
});
