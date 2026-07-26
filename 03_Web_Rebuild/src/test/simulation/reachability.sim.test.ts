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

const POLICY_IDS: SimulationPolicyId[] = [
  'first-choice',
  'last-choice',
  'cycling-choice',
  'seeded-random-choice',
];

describe.runIf(ENV.SIM_REACHABILITY === '1')('Headless Game Simulation Harness — reachability', () => {
  it('运行多 seed × 多策略矩阵并生成事件/Flag/纪元/结局覆盖报告', async () => {
    const runs = parsePositiveInteger(ENV.SIM_REACHABILITY_RUNS, 40);
    const turns = parsePositiveInteger(ENV.SIM_REACHABILITY_TURNS, 250);
    const baseSeed = parsePositiveInteger(ENV.SIM_BASE_SEED, 2026072601);

    const summary = runSimulationSuite(Array.from({ length: runs }, (_, index) => {
      const seed = baseSeed + index * 7919;
      const policyId = POLICY_IDS[index % POLICY_IDS.length];
      return {
        seed,
        targetTurns: turns,
        maxTurnAttempts: turns * 15,
        maxEventResolutionsPerTurn: 150,
        traceLimit: 300,
        createPolicy: () => createPolicy(policyId, seed),
      };
    }));

    const report = buildReachabilityReport(summary);
    const paths = await writeReachabilityReport(report, 'reachability');
    console.info('[ReachabilityReport]', JSON.stringify({
      paths,
      runs: report.runCount,
      observed: {
        events: report.observed.events.length,
        flags: report.observed.flags.length,
        epochs: report.observed.epochs.length,
        endings: report.observed.endings.length,
      },
      unobservedEndings: report.unobserved.endings,
      flagScan: {
        linked: report.flagScan.linkedCount,
        producerOnly: report.flagScan.producerOnlyCount,
        consumerOnly: report.flagScan.consumerOnlyCount,
        orphan: report.flagScan.orphanCount,
      },
    }, null, 2));

    if (summary.failures.length > 0) {
      console.error(JSON.stringify(summary.failures, null, 2));
    }

    expect(summary.failedRuns).toBe(0);
    expect(report.observed.events.length).toBeGreaterThan(0);
    expect(report.observed.flags.length).toBeGreaterThan(0);
    expect(report.observed.epochs.length).toBeGreaterThan(0);
  }, 20 * 60 * 1000);
});
