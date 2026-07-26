import { describe, expect, it } from 'vitest';
import { createPolicy } from './policies';
import { REGRESSION_SEEDS } from './regressionSeeds';
import { runSimulationSuite } from './SimulationSuite';

describe('Headless Game Simulation Harness — regression seed bank', () => {
  it('全部登记 seed 可复现且无运行时违例', () => {
    const summary = runSimulationSuite(
      REGRESSION_SEEDS.map((entry) => ({
        seed: entry.seed,
        targetTurns: entry.targetTurns,
        createPolicy: (seed: number) => createPolicy(entry.policy, seed),
      })),
    );

    if (summary.failedRuns > 0) {
      console.error(JSON.stringify(summary.failures, null, 2));
    }

    expect(summary.totalRuns).toBe(REGRESSION_SEEDS.length);
    expect(summary.failedRuns).toBe(0);
    expect(summary.passedRuns).toBe(REGRESSION_SEEDS.length);
    expect(summary.averageYearsAdvanced).toBeGreaterThan(0);
  });

  it('每个 seed 都有审计或场景保护目标', () => {
    for (const entry of REGRESSION_SEEDS) {
      expect(entry.id).toMatch(/^SIM-/);
      expect(entry.protects.length).toBeGreaterThan(0);
      expect(new Set(entry.protects).size).toBe(entry.protects.length);
    }
  });
});
