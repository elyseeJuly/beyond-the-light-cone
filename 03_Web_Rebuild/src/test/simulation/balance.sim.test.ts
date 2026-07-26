import { describe, expect, it } from 'vitest';
import { FirstChoicePolicy, SeededRandomChoicePolicy } from './policies';
import { runSimulationSuite } from './SimulationSuite';

function readPositiveInteger(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer, received: ${raw}`);
  }
  return value;
}

const balanceDescribe = process.env.SIM_BALANCE === '1' ? describe : describe.skip;

balanceDescribe('Headless Game Simulation Harness — balance matrix', () => {
  it('多 seed × 多策略矩阵无运行时失败', () => {
    const runCount = readPositiveInteger('SIM_RUNS', 50);
    const targetTurns = readPositiveInteger('SIM_TURNS', 100);
    const cases = Array.from({ length: runCount }, (_, index) => {
      const seed = 1000 + index;
      return {
        seed,
        targetTurns,
        createPolicy: index % 2 === 0
          ? () => new FirstChoicePolicy()
          : (policySeed: number) => new SeededRandomChoicePolicy(policySeed),
      };
    });

    const summary = runSimulationSuite(cases);
    console.info('[SIMULATION_BALANCE_SUMMARY]', JSON.stringify({
      totalRuns: summary.totalRuns,
      passedRuns: summary.passedRuns,
      failedRuns: summary.failedRuns,
      gameOverRuns: summary.gameOverRuns,
      averageYearsAdvanced: summary.averageYearsAdvanced,
      terminationCounts: summary.terminationCounts,
      policyCounts: summary.policyCounts,
      finalEpochCounts: summary.finalEpochCounts,
      failures: summary.failures.map((failure) => ({
        seed: failure.seed,
        policyId: failure.policyId,
        terminationReason: failure.terminationReason,
        violations: failure.violations,
        replayCommand: failure.replayCommand,
      })),
    }, null, 2));

    expect(summary.totalRuns).toBe(runCount);
    expect(summary.failedRuns).toBe(0);
    expect(summary.terminationCounts.exception ?? 0).toBe(0);
    expect(summary.terminationCounts['event-resolution-cap'] ?? 0).toBe(0);
    expect(summary.terminationCounts['turn-attempt-cap'] ?? 0).toBe(0);
  });
});
