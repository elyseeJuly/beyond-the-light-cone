import { describe, expect, it } from 'vitest';
import { GameSimulationAdapter } from './GameSimulationAdapter';
import { FirstChoicePolicy, SeededRandomChoicePolicy } from './policies';
import { SeededRng } from './SeededRng';

function expectHealthyRun(result: ReturnType<GameSimulationAdapter['run']>): void {
  if (result.violations.length > 0) {
    console.error(JSON.stringify(result, null, 2));
  }
  expect(result.errorMessage).toBeUndefined();
  expect(result.violations).toEqual([]);
  expect(result.terminationReason).not.toBe('exception');
  expect(result.terminationReason).not.toBe('event-resolution-cap');
  expect(result.terminationReason).not.toBe('turn-attempt-cap');
}

describe('Headless Game Simulation Harness — smoke', () => {
  it('SeededRng 对同一 seed 产生相同序列', () => {
    const left = new SeededRng(20260726);
    const right = new SeededRng(20260726);
    const leftSequence = Array.from({ length: 12 }, () => left.random());
    const rightSequence = Array.from({ length: 12 }, () => right.random());

    expect(leftSequence).toEqual(rightSequence);
    expect(new Set(leftSequence).size).toBeGreaterThan(1);
  });

  it('first-choice 策略可稳定完成 10 回合', () => {
    const result = new GameSimulationAdapter({
      seed: 20260726,
      targetTurns: 10,
      policy: new FirstChoicePolicy(),
    }).run();

    expectHealthyRun(result);
    expect(result.completedTurns).toBe(10);
    expect(result.yearsAdvanced).toBeGreaterThanOrEqual(10);
    expect(result.trace.length).toBeGreaterThan(0);
    expect(result.replayCommand).toContain('SIM_SEED=20260726');
  });

  it('相同 seed 与策略得到相同终态和轨迹', () => {
    const run = () => new GameSimulationAdapter({
      seed: 314159,
      targetTurns: 15,
      policy: new SeededRandomChoicePolicy(314159),
    }).run();

    const first = run();
    const second = run();

    expectHealthyRun(first);
    expectHealthyRun(second);
    expect(second.end).toEqual(first.end);
    expect(second.terminationReason).toBe(first.terminationReason);
    expect(second.trace).toEqual(first.trace);
  });

  it.each([1, 7, 42, 2026, 65537])('多 seed smoke 无运行时不变量违例：seed=%s', (seed) => {
    const result = new GameSimulationAdapter({
      seed,
      targetTurns: 12,
      policy: new SeededRandomChoicePolicy(seed),
    }).run();

    expectHealthyRun(result);
    expect(result.completedTurns).toBe(12);
  });
});
