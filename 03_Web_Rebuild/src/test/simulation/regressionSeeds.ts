export interface RegressionSeed {
  id: string;
  seed: number;
  targetTurns: number;
  policy: 'first-choice' | 'seeded-random-choice';
  protects: string[];
}

/**
 * Stable seed bank for PR-level regression runs.
 * New runtime defects should add their reproducing seed and audit/SCEN IDs here.
 */
export const REGRESSION_SEEDS: RegressionSeed[] = [
  {
    id: 'SIM-BASE-CRISIS-001',
    seed: 20260726,
    targetTurns: 25,
    policy: 'first-choice',
    protects: ['SCEN-STRICT-MODE', 'FIX-01', 'FIX-07', 'FIX-13'],
  },
  {
    id: 'SIM-RANDOM-BRANCH-001',
    seed: 314159,
    targetTurns: 25,
    policy: 'seeded-random-choice',
    protects: ['SYS-1', 'SYS-3', 'AR-37'],
  },
  {
    id: 'SIM-RANDOM-BRANCH-002',
    seed: 65537,
    targetTurns: 25,
    policy: 'seeded-random-choice',
    protects: ['SCEN-EVENT-FREEZE', 'SCEN-EVENTBUS-COMPAT'],
  },
];
