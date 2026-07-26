import { describe, expect, it } from 'vitest';
import { scanFlagReachability } from './FlagReachability';

const ENV = (globalThis as typeof globalThis & {
  process?: { env?: Record<string, string | undefined> };
}).process?.env ?? {};

describe('Headless Game Simulation Harness — Flag reachability', () => {
  it('为每个权威 FLAG 建立生产者/消费者分类', () => {
    const report = scanFlagReachability();
    const values = report.entries.map((entry) => entry.value);

    console.info('[FlagReachability]', JSON.stringify({
      total: report.totalFlags,
      linked: report.linkedCount,
      producerOnly: report.producerOnlyCount,
      consumerOnly: report.consumerOnlyCount,
      orphan: report.orphanCount,
    }));

    expect(report.totalFlags).toBeGreaterThan(20);
    expect(new Set(values).size).toBe(values.length);
    expect(report.entries.every((entry) => entry.status.length > 0)).toBe(true);

    if (ENV.SIM_STRICT_FLAGS === '1') {
      const blocking = report.entries.filter(
        (entry) => entry.status === 'consumer-only' || entry.status === 'orphan',
      );
      expect(blocking, JSON.stringify(blocking, null, 2)).toEqual([]);
    }
  });
});
