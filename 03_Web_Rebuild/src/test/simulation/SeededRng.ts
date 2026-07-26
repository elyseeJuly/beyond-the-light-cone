import type { RngProvider } from '../../core/Game';

/**
 * Small deterministic PRNG for simulation and replay.
 * Mulberry32 is not cryptographic; it is fast and stable across JS runtimes.
 */
export class SeededRng implements RngProvider {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  random(): number {
    this.state = (this.state + 0x6d2b79f5) >>> 0;
    let value = this.state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    if (!Number.isInteger(min) || !Number.isInteger(max) || max < min) {
      throw new RangeError(`Invalid integer range: ${min}..${max}`);
    }
    return min + Math.floor(this.random() * (max - min + 1));
  }

  pickIndex(length: number): number {
    if (!Number.isInteger(length) || length <= 0) {
      throw new RangeError(`Cannot choose from collection of length ${length}`);
    }
    return this.int(0, length - 1);
  }

  fork(salt: number): SeededRng {
    const mixed = Math.imul((this.state ^ (salt >>> 0)) >>> 0, 0x9e3779b1) >>> 0;
    return new SeededRng(mixed);
  }
}
