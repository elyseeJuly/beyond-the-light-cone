export class SeededRandom {
  private seed: number;
  private state: number;

  constructor(seed: number = Date.now()) {
    this.seed = seed;
    this.state = seed;
  }

  next(): number {
    this.state = (this.state * 1664525 + 1013904223) & 0x7fffffff;
    return this.state / 0x7fffffff;
  }

  random(): number {
    return this.next();
  }

  randInt(min: number, max: number): number {
    return min + Math.floor(this.next() * (max - min + 1));
  }

  chance(probability: number): boolean {
    return this.next() < probability;
  }

  pick<T>(array: T[]): T | undefined {
    if (array.length === 0) return undefined;
    return array[Math.floor(this.next() * array.length)];
  }

  reset(seed?: number): void {
    if (seed !== undefined) this.seed = seed;
    this.state = this.seed;
  }
}

export function createRngProvider(factory: () => { random: () => number }) {
  return factory;
}