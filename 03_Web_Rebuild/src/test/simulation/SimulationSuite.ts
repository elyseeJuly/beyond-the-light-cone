import { GameSimulationAdapter } from './GameSimulationAdapter';
import type { SimulationPolicy, SimulationRunResult } from './types';

export interface SimulationSuiteCase {
  seed: number;
  targetTurns: number;
  maxTurnAttempts?: number;
  maxEventResolutionsPerTurn?: number;
  traceLimit?: number;
  createPolicy(seed: number): SimulationPolicy;
}

export interface SimulationSuiteSummary {
  totalRuns: number;
  passedRuns: number;
  failedRuns: number;
  gameOverRuns: number;
  averageYearsAdvanced: number;
  terminationCounts: Record<string, number>;
  policyCounts: Record<string, number>;
  finalEpochCounts: Record<string, number>;
  failures: SimulationRunResult[];
  results: SimulationRunResult[];
}

function increment(record: Record<string, number>, key: string): void {
  record[key] = (record[key] ?? 0) + 1;
}

export function runSimulationSuite(cases: SimulationSuiteCase[]): SimulationSuiteSummary {
  const results = cases.map((suiteCase) => {
    const policy = suiteCase.createPolicy(suiteCase.seed);
    return new GameSimulationAdapter({
      seed: suiteCase.seed,
      targetTurns: suiteCase.targetTurns,
      maxTurnAttempts: suiteCase.maxTurnAttempts,
      maxEventResolutionsPerTurn: suiteCase.maxEventResolutionsPerTurn,
      traceLimit: suiteCase.traceLimit,
      policy,
    }).run();
  });

  const terminationCounts: Record<string, number> = {};
  const policyCounts: Record<string, number> = {};
  const finalEpochCounts: Record<string, number> = {};
  let totalYearsAdvanced = 0;
  let gameOverRuns = 0;

  for (const result of results) {
    increment(terminationCounts, result.terminationReason);
    increment(policyCounts, result.policyId);
    increment(finalEpochCounts, String(result.end.epoch));
    totalYearsAdvanced += result.yearsAdvanced;
    if (result.terminationReason === 'game-over') gameOverRuns++;
  }

  const failures = results.filter(
    (result) => result.violations.length > 0 || result.errorMessage !== undefined,
  );

  return {
    totalRuns: results.length,
    passedRuns: results.length - failures.length,
    failedRuns: failures.length,
    gameOverRuns,
    averageYearsAdvanced: results.length > 0 ? totalYearsAdvanced / results.length : 0,
    terminationCounts,
    policyCounts,
    finalEpochCounts,
    failures,
    results,
  };
}
