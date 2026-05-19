import { describe, it, expect } from 'vitest';
import { SeededRandom } from '../../utils/random';
import { GameInstance } from '../../core/Game';

describe('SeededRandom', () => {
  it('确定性：相同种子产生相同序列', () => {
    const rng1 = new SeededRandom(42);
    const rng2 = new SeededRandom(42);

    const seq1 = Array.from({ length: 20 }, () => rng1.next());
    const seq2 = Array.from({ length: 20 }, () => rng2.next());

    expect(seq1).toEqual(seq2);
  });

  it('不同种子产生不同序列', () => {
    const rng1 = new SeededRandom(1);
    const rng2 = new SeededRandom(2);

    const seq1 = Array.from({ length: 5 }, () => rng1.next());
    const seq2 = Array.from({ length: 5 }, () => rng2.next());

    expect(seq1).not.toEqual(seq2);
  });

  it('返回值在 [0, 1) 范围内', () => {
    const rng = new SeededRandom(12345);
    for (let i = 0; i < 1000; i++) {
      const val = rng.next();
      expect(val).toBeGreaterThanOrEqual(0);
      expect(val).toBeLessThan(1);
    }
  });

  it('random() 与 next() 等价', () => {
    const rng1 = new SeededRandom(99);
    const rng2 = new SeededRandom(99);
    expect(rng1.next()).toBe(rng2.random());
  });

  it('randInt 返回指定范围内的整数', () => {
    const rng = new SeededRandom(777);
    for (let i = 0; i < 500; i++) {
      const val = rng.randInt(5, 15);
      expect(val).toBeGreaterThanOrEqual(5);
      expect(val).toBeLessThanOrEqual(15);
      expect(Number.isInteger(val)).toBe(true);
    }
  });

  it('randInt 范围正确 结尾可达', () => {
    const rng = new SeededRandom(888);
    const hits = new Set<number>();
    for (let i = 0; i < 2000; i++) {
      hits.add(rng.randInt(0, 3));
    }
    expect(hits.has(0)).toBe(true);
    expect(hits.has(3)).toBe(true);
  });

  it('chance 概率方法', () => {
    const rng = new SeededRandom(555);
    let count = 0;
    for (let i = 0; i < 1000; i++) {
      if (rng.chance(0.5)) count++;
    }
    expect(count).toBeGreaterThan(400);
    expect(count).toBeLessThan(600);
  });

  it('chance 0% 永远返回 false', () => {
    const rng = new SeededRandom(333);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(0)).toBe(false);
    }
  });

  it('chance 100% 永远返回 true', () => {
    const rng = new SeededRandom(333);
    for (let i = 0; i < 100; i++) {
      expect(rng.chance(1)).toBe(true);
    }
  });

  it('pick 从数组中随机选取', () => {
    const rng = new SeededRandom(42);
    const arr = ['a', 'b', 'c', 'd', 'e'];
    const picked = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const item = rng.pick(arr);
      expect(item).toBeDefined();
      picked.add(item!);
    }
    expect(picked.size).toBeGreaterThanOrEqual(3);
  });

  it('pick 空数组返回 undefined', () => {
    const rng = new SeededRandom(1);
    expect(rng.pick([])).toBeUndefined();
  });

  it('reset 恢复初始状态', () => {
    const rng = new SeededRandom(101);
    const first = rng.next();
    rng.next();
    rng.next();
    rng.reset();
    expect(rng.next()).toBe(first);
  });

  it('reset 改变种子', () => {
    const rng = new SeededRandom(1);
    const ref = new SeededRandom(42);
    rng.reset(42);
    expect(rng.next()).toBe(ref.next());
  });
});

describe('Game with SeededRandom', () => {
  it('Game.setRngProvider 注入后回合可复现', () => {
    GameInstance.reset();
    const rng = new SeededRandom(100);
    const game = GameInstance.get();
    game.setRngProvider(rng);

    game.runARound();
    const lastLog1 = game.historyLogs[game.historyLogs.length - 1];

    GameInstance.reset();
    const rng2 = new SeededRandom(100);
    const game2 = GameInstance.get();
    game2.setRngProvider(rng2);
    game2.runARound();
    const lastLog2 = game2.historyLogs[game2.historyLogs.length - 1];

    expect(lastLog1).toBe(lastLog2);
  });
});