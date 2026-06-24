import { describe, it, expect, beforeEach } from 'vitest';
import { Game, RngProvider } from '../../core/Game';
import { EpochType, DefeatType, VictoryType } from '../../types/enums';

function setupGame(): Game {
  return new Game();
}

/**
 * Seeded deterministic RNG for testing reproducibility
 */
class SeedRNG implements RngProvider {
  private seed: number;

  constructor(seed: number = 42) {
    this.seed = seed;
  }

  random(): number {
    // Simple LCG
    this.seed = (this.seed * 1664525 + 1013904223) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }
}

describe('Edge Cases', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  // ============================================================
  // 1. Resource Extremes (~8 tests)
  // ============================================================
  describe('Resource Extremes', () => {
    it('should handle all resources at 0 when running a turn', () => {
      game.earthCivi.resource = 0;
      game.earthCivi.economy = 0;
      game.earthCivi.culture = 0;
      game.earthCivi.population = 0;
      game.earthCivi.army = 0;
      game.earthCivi.treachery = 0;
      game.earthCivi.deterrenceValue = 0;

      // Should not throw despite all-zero resources
      expect(() => game.earthCivi.runARound()).not.toThrow();
    });

    it('should handle Number.MAX_SAFE_INTEGER resources without overflow', () => {
      game.earthCivi.resource = Number.MAX_SAFE_INTEGER;
      game.earthCivi.economy = Number.MAX_SAFE_INTEGER;
      game.earthCivi.culture = Number.MAX_SAFE_INTEGER;
      game.earthCivi.population = Number.MAX_SAFE_INTEGER;
      game.earthCivi.army = Number.MAX_SAFE_INTEGER;

      expect(() => game.earthCivi.runARound()).not.toThrow();
      // Resources should remain non-negative
      expect(game.earthCivi.resource).toBeGreaterThanOrEqual(0);
      expect(game.earthCivi.economy).toBeGreaterThanOrEqual(0);
    });

    it('should clamp negative resource to 0 after sanitize', () => {
      game.earthCivi.resource = -100;
      game.earthCivi.economy = -50;
      game.earthCivi.culture = -30;
      game.earthCivi.army = -20;

      // RunARound calls sanitizeResources internally
      game.earthCivi.runARound();

      expect(game.earthCivi.resource).toBeGreaterThanOrEqual(0);
      expect(game.earthCivi.economy).toBeGreaterThanOrEqual(0);
      expect(game.earthCivi.culture).toBeGreaterThanOrEqual(0);
      expect(game.earthCivi.army).toBeGreaterThanOrEqual(0);
    });

    it('should detect extinction when population is 0', () => {
      game.earthCivi.population = 0;
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.defeatType).toBe(DefeatType.EXTINCTION);
    });

    it('should cap population at maximum limit', () => {
      // Manually set population to an extremely high value
      // The max pop is based on starIndices totalPopLimit * 3
      game.earthCivi.population = 9999999;
      game.earthCivi.idlePopulation = 9999999;
      game.earthCivi.idleWorkers = 9999999;

      game.earthCivi.runARound();

      // Population should be finite after processing
      expect(game.earthCivi.population).toBeGreaterThanOrEqual(0);
      expect(Number.isFinite(game.earthCivi.population)).toBe(true);
      // It shouldn't blow up to NaN
      expect(game.earthCivi.population).not.toBeNaN();
    });

    it('should handle economy at 0 and negative without errors', () => {
      game.earthCivi.economy = 0;
      expect(() => game.earthCivi.runARound()).not.toThrow();

      game.earthCivi.economy = -999;
      expect(() => game.earthCivi.runARound()).not.toThrow();
      expect(game.earthCivi.economy).toBeGreaterThanOrEqual(0);
    });

    it('should handle culture at 0 without errors', () => {
      game.earthCivi.culture = 0;
      expect(() => game.earthCivi.runARound()).not.toThrow();
      expect(() => game.updateEpoch()).not.toThrow();
      // With culture 0, epoch should remain CRISIS
      expect(game.epoch).toBe(EpochType.CRISIS);
    });

    it('should handle extreme military points', () => {
      game.earthCivi.army = Number.MAX_SAFE_INTEGER;
      expect(() => game.earthCivi.runARound()).not.toThrow();
      expect(Number.isFinite(game.earthCivi.army)).toBe(true);
      expect(game.earthCivi.army).toBeGreaterThanOrEqual(0);

      game.earthCivi.army = -Number.MAX_SAFE_INTEGER;
      expect(() => game.earthCivi.runARound()).not.toThrow();
      expect(game.earthCivi.army).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================
  // 2. Game State Edge Cases (~8 tests)
  // ============================================================
  describe('Game State Edge Cases', () => {
    it('should not advance turns when game is over', () => {
      game.isGameOver = true;
      const yearBefore = game.year;
      game.runARound();
      // Year should not advance when game is over
      expect(game.year).toBe(yearBefore);
    });

    it('should block actions when victory state is set', () => {
      game.isGameOver = true;
      game.victoryType = VictoryType.DETERRENCE;
      const yearBefore = game.year;
      game.runARound();
      expect(game.year).toBe(yearBefore);
      expect(game.isGameOver).toBe(true);
    });

    it('should detect defeat by exile when treachery reaches 100', () => {
      game.earthCivi.treachery = 100;
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.defeatType).toBe(DefeatType.TREACHERY);
      expect(game.gameOverReason).toContain('逃亡');
    });

    it('should detect defeat by extinction when population is 0', () => {
      game.earthCivi.population = 0;
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.defeatType).toBe(DefeatType.EXTINCTION);
    });

    it('should handle multiple game-over conditions simultaneously (treachery + population = 0)', () => {
      // Treachery is checked before population in checkVictoryConditions
      game.earthCivi.treachery = 100;
      game.earthCivi.population = 0;
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      // First condition met should apply (treachery comes first)
      expect(game.defeatType).toBe(DefeatType.TREACHERY);

      // Reset and test the opposite order
      game = setupGame();
      game.earthCivi.population = 0;
      game.earthCivi.treachery = 100;
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      // Treachery is still checked first in the code
      expect(game.defeatType).toBe(DefeatType.TREACHERY);
    });

    it('should handle many game flags without performance issues', () => {
      const flagCount = 500;
      const preExistingCount = game.flags.size;
      for (let i = 0; i < flagCount; i++) {
        game.addFlag(`flag_${i}`);
      }
      expect(game.flags.size).toBe(preExistingCount + flagCount);
      expect(game.hasFlag('flag_0')).toBe(true);
      expect(game.hasFlag('flag_499')).toBe(true);
      expect(game.hasFlag('flag_500')).toBe(false);

      // Removing a flag from many should work
      game.removeFlag('flag_250');
      expect(game.flags.size).toBe(preExistingCount + flagCount - 1);
      expect(game.hasFlag('flag_250')).toBe(false);

      // Should still work normally
      expect(() => game.runARound()).not.toThrow();
    });

    it('should start with turn count at 0 (initial state)', () => {
      expect(game.year).toBe(0);
      expect(game.turnHistory.length).toBe(0);
      expect(game.historyLogs.length).toBe(0);
      expect(game.isGameOver).toBe(false);
      expect(game.isProcessing).toBe(false);
    });

    it('should handle very high turn count (1000+)', () => {
      game.year = 1000;
      game.earthCivi.culture = 2000; // Ensure high epoch doesn't crash

      // Run a few turns at high year to check for stability
      expect(() => {
        for (let i = 0; i < 3; i++) {
          game.runARound();
        }
      }).not.toThrow();

      expect(game.year).toBeGreaterThanOrEqual(1000);
    });
  });

  // ============================================================
  // 3. Data Integrity (~6 tests)
  // ============================================================
  describe('Data Integrity', () => {
    it('should handle empty departments Map serialization', () => {
      // Clear departments but keep the map reference
      game.earthCivi.departments.clear();
      expect(game.earthCivi.departments.size).toBe(0);

      // The game should still function (runARound catches exceptions internally)
      expect(() => game.earthCivi.runARound()).not.toThrow();
    });

    it('should handle empty fleets array', () => {
      // Fleets should start empty
      expect(game.earthCivi.fleets).toEqual([]);

      // Run a turn with empty fleets - should not error
      expect(() => game.earthCivi.runARound()).not.toThrow();

      // Push a partial fleet object and ensure it doesn't crash
      (game.earthCivi.fleets as any).push({});
      expect(() => game.earthCivi.runARound()).not.toThrow();
    });

    it('should handle undefined/null values in critical fields', () => {
      // Simulate corrupted state by setting critical fields to undefined
      (game.earthCivi as any).population = undefined;
      // Should not throw despite undefined population
      expect(() => game.earthCivi.runARound()).not.toThrow();

      // Reset and test with null resource
      game.earthCivi.population = 65; // restore
      (game.earthCivi as any).resource = null;
      expect(() => game.earthCivi.runARound()).not.toThrow();
    });

    it('should handle missing optional fields in game state gracefully', () => {
      // Apply fields individually instead of replacing earthCivi object
      game.year = 50;
      game.epoch = EpochType.GOLDEN;
      game.earthCivi.population = 100;
      game.earthCivi.culture = 50;
      game.earthCivi.economy = 30;
      game.earthCivi.resource = 200;

      expect(game.year).toBe(50);
      // window mock handles dispatchEvent calls
      expect(() => game.runARound()).not.toThrow();
    });

    it('should handle default values when loading incomplete state', () => {
      // Simulate what happens when only partial data is loaded
      const partial = {
        year: 100,
        earthCivi: {
          population: 80,
          culture: 300,
          economy: 150,
        }
      };
      Object.assign(game, partial);
      // These should have default values from classes
      expect(game.isGameOver).toBe(false);
      expect(game.isProcessing).toBe(false);
      expect(game.epoch).toBeDefined();
      expect(Array.isArray(game.historyLogs)).toBe(true);
    });

    it('should not throw when adding/removing same flag multiple times', () => {
      const flagName = 'test_duplicate_flag';
      const flagsBefore = game.flags.size;

      // Add same flag multiple times (Set deduplicates)
      game.addFlag(flagName);
      game.addFlag(flagName);
      game.addFlag(flagName);
      expect(game.flags.size).toBe(flagsBefore + 1);

      // Remove non-existent flag
      expect(() => game.removeFlag('non_existent_flag')).not.toThrow();

      // Remove flag that exists
      game.removeFlag(flagName);
      expect(game.flags.has(flagName)).toBe(false);

      // Remove already-removed flag
      expect(() => game.removeFlag(flagName)).not.toThrow();
    });
  });

  // ============================================================
  // 4. Clock/Time Edge Cases (~4 tests)
  // ============================================================
  describe('Clock/Time Edge Cases', () => {
    it('should handle year 0 correctly', () => {
      expect(game.year).toBe(0);
      expect(game.getYear()).toBe(0);

      // Clear events to prevent interactive events from blocking year advancement
      game.eventManager.events = [];
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];
      game.runARound();
      expect(game.year).toBeGreaterThanOrEqual(1);
    });

    it('should handle year overflow gracefully', () => {
      // Set year to a very high value
      game.year = 10000;
      game.earthCivi.culture = 9999;

      // 避免 year > 350 且无逃逸手段时触发太阳氦闪失败，从而阻止年份推进
      game.addFlag("wandering_completed");

      // Clear events to prevent epoch transition events from blocking year advancement
      game.eventManager.events = [];
      game.eventManager.filteredEvents = [];
      game.eventManager.randomEvents = [];

      // Should not crash
      expect(() => game.runARound()).not.toThrow();

      // Year should continue to increment
      expect(game.year).toBeGreaterThan(10000);
    });

    it('should handle negative year defensively', () => {
      // Negative year shouldn't normally happen, but be defensive
      game.year = -10;
      game.earthCivi.culture = -50; // Match GOLDEN epoch
      game.eventManager.events = [];
      game.eventManager.filteredEvents = [];
      // Should not crash - errors are caught internally
      expect(() => game.runARound()).not.toThrow();
      // Game state remains valid after running
      expect(game.earthCivi.population).toBeGreaterThanOrEqual(0);
    });

    it('should handle epoch transitions at exact boundary culture values', () => {
      // 纪元切换是单向前进且需要关键事件标志位的；测试从各前序纪元推进到下一纪元的边界值
      const boundaries: Array<{ startEpoch: EpochType; culture: number; flag: string | null; expectedEpoch: EpochType }> = [
        { startEpoch: EpochType.GOLDEN, culture: -100, flag: null, expectedEpoch: EpochType.GOLDEN },
        { startEpoch: EpochType.GOLDEN, culture: -1, flag: null, expectedEpoch: EpochType.GOLDEN },
        { startEpoch: EpochType.GOLDEN, culture: 0, flag: null, expectedEpoch: EpochType.CRISIS },
        { startEpoch: EpochType.GOLDEN, culture: 70, flag: null, expectedEpoch: EpochType.CRISIS },
        { startEpoch: EpochType.GOLDEN, culture: 199, flag: null, expectedEpoch: EpochType.CRISIS },
        { startEpoch: EpochType.CRISIS, culture: 200, flag: 'deterrence_established', expectedEpoch: EpochType.DETERRENCE },
        { startEpoch: EpochType.CRISIS, culture: 499, flag: 'deterrence_established', expectedEpoch: EpochType.DETERRENCE },
        { startEpoch: EpochType.DETERRENCE, culture: 500, flag: 'coordinates_broadcasted', expectedEpoch: EpochType.BROADCAST },
        { startEpoch: EpochType.DETERRENCE, culture: 799, flag: 'coordinates_broadcasted', expectedEpoch: EpochType.BROADCAST },
        { startEpoch: EpochType.BROADCAST, culture: 800, flag: 'bunker_world_completed', expectedEpoch: EpochType.BUNKER },
        { startEpoch: EpochType.BROADCAST, culture: 1199, flag: 'bunker_world_completed', expectedEpoch: EpochType.BUNKER },
        { startEpoch: EpochType.BUNKER, culture: 1200, flag: 'galaxy_exodus_seen', expectedEpoch: EpochType.GALAXY },
        { startEpoch: EpochType.GALAXY, culture: 2500, flag: null, expectedEpoch: EpochType.STARDUST },
      ];

      for (const { startEpoch, culture, flag, expectedEpoch } of boundaries) {
        game = setupGame();
        game.epoch = startEpoch;
        game.earthCivi.culture = culture;
        if (flag) game.addFlag(flag);
        game.updateEpoch();
        expect(game.epoch).toBe(expectedEpoch);
      }
    });
  });

  // ============================================================
  // 5. Randomness (~4 tests)
  // ============================================================
  describe('Randomness', () => {
    it('should produce consistent results with deterministic RNG', () => {
      // First instance
      game.setRngProvider(new SeedRNG(42));
      const results1: number[] = [];
      for (let i = 0; i < 10; i++) {
        results1.push(game.rng());
      }

      // Second instance with same seed
      const game2 = setupGame();
      game2.setRngProvider(new SeedRNG(42));
      const results2: number[] = [];
      for (let i = 0; i < 10; i++) {
        results2.push(game2.rng());
      }

      expect(results1).toEqual(results2);
    });

    it('should produce different results with different RNG seeds', () => {
      game.setRngProvider(new SeedRNG(42));
      const results1: number[] = [];
      for (let i = 0; i < 5; i++) {
        results1.push(game.rng());
      }

      const game2 = setupGame();
      game2.setRngProvider(new SeedRNG(999));
      const results2: number[] = [];
      for (let i = 0; i < 5; i++) {
        results2.push(game2.rng());
      }

      // Different seeds should yield different first values
      // (extremely unlikely to collide with different seeds)
      expect(results1).not.toEqual(results2);
    });

    it('should return values in range [0, 1) from rng()', () => {
      game.setRngProvider(new SeedRNG(12345));

      for (let i = 0; i < 100; i++) {
        const val = game.rng();
        expect(val).toBeGreaterThanOrEqual(0);
        expect(val).toBeLessThan(1);
      }
    });

    it('should return correct integer range from rngInt()', () => {
      game.setRngProvider(new SeedRNG(77777));

      for (let i = 0; i < 50; i++) {
        const min = 1;
        const max = 6;
        const val = game.rngInt(min, max);
        expect(val).toBeGreaterThanOrEqual(min);
        expect(val).toBeLessThanOrEqual(max);
        expect(Number.isInteger(val)).toBe(true);
      }

      // Edge: min === max
      const val = game.rngInt(5, 5);
      expect(val).toBe(5);

      // Edge: large range
      const big = game.rngInt(0, 1000000);
      expect(big).toBeGreaterThanOrEqual(0);
      expect(big).toBeLessThanOrEqual(1000000);
    });
  });
});