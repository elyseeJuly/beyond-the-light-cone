import { describe, expect, it } from 'vitest';
import { GameSimulationAdapter } from './GameSimulationAdapter';
import { createPolicy, isSimulationPolicyId } from './policies';

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

describe('Headless Game Simulation Harness — replay', () => {
  it('按 SIM_SEED / SIM_POLICY 精确重放单次模拟', () => {
    const seed = parsePositiveInteger(ENV.SIM_SEED, 20260726);
    const targetTurns = parsePositiveInteger(ENV.SIM_TURNS, 20);
    const policyId = isSimulationPolicyId(ENV.SIM_POLICY)
      ? ENV.SIM_POLICY
      : 'first-choice';

    const result = new GameSimulationAdapter({
      seed,
      targetTurns,
      policy: createPolicy(policyId, seed),
    }).run();

    if (result.violations.length > 0 || result.errorMessage) {
      console.error(JSON.stringify(result, null, 2));
    }

    expect(result.errorMessage).toBeUndefined();
    expect(result.violations).toEqual([]);
    expect(result.terminationReason).not.toBe('exception');
    expect(result.terminationReason).not.toBe('event-resolution-cap');
    expect(result.terminationReason).not.toBe('turn-attempt-cap');
  });
});
