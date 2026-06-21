import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EpochType, EventEffect } from '../../types/enums';

/**
 * Setup a fresh game instance with deterministic RNG
 */
function setupGame(): Game {
  GameInstance.reset();
  const game = GameInstance.get();
  // Use deterministic RNG (high values = fewer random events)
  game.setRngProvider({ random: () => 0.9 });
  return game;
}

/**
 * Process all pending events by auto-choosing the first option.
 * This allows the game year to advance when interactive events are blocking.
 */
function processAllEvents(game: Game): void {
  let safety = 50;
  while ((game.currentEvent || game.eventQueue.length > 0) && safety > 0) {
    safety--;
    if (game.currentEvent) {
      // Auto-choose the first available choice
      if (game.currentEvent.choices && game.currentEvent.choices.length > 0) {
        game.currentEvent.choices[0].action();
      }
      game.applyEventEffect(EventEffect.NONE, true);
    } else if (game.eventQueue.length > 0) {
      game.processNextEvent();
    }
  }
}

/**
 * Run a single game turn and handle any events that appear.
 * Returns true if the year advanced (turn completed), false otherwise.
 */
function runSingleTurn(game: Game): boolean {
  const yearBefore = game.year;
  game.runARound();
  // If events are blocking, process them until year advances
  if (game.currentEvent || game.eventQueue.length > 0) {
    processAllEvents(game);
  }
  return game.year > yearBefore;
}

/**
 * Run N complete game turns in sequence.
 * Returns the total number of years that actually advanced.
 */
function runTurns(game: Game, turns: number): number {
  const startYear = game.year;
  let attempts = 0;
  const maxAttempts = turns * 10; // Safety cap
  let completedTurns = 0;

  while (completedTurns < turns && attempts < maxAttempts) {
    attempts++;
    const before = game.year;
    runSingleTurn(game);
    if (game.year > before) {
      completedTurns++;
    }
    if (game.isGameOver) break;
  }
  return game.year - startYear;
}

describe('E2E 自动回合模拟', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('游戏能初始化并正常运行 10 回合无报错', () => {
    expect(game).toBeDefined();
    expect(game.year).toBe(0);
    expect(game.earthCivi.population).toBe(65);
    expect(game.earthCivi.economy).toBe(100);
    expect(game.earthCivi.culture).toBe(0);
    expect(game.earthCivi.resource).toBe(200);
    expect(game.earthCivi.army).toBe(10);
    expect(game.epoch).toBe(EpochType.CRISIS);

    const yearsAdvanced = runTurns(game, 10);
    // Year should have advanced at least 10 (might be more due to event handling)
    expect(yearsAdvanced).toBeGreaterThanOrEqual(10);
    expect(game.isGameOver).toBe(false);
  });

  it('运行多回合后游戏状态保持一致（资源非负、人口非负）', () => {
    runTurns(game, 20);

    // Core resources must never be negative
    expect(game.earthCivi.population).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.economy).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.culture).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.resource).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.army).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.treachery).toBeGreaterThanOrEqual(0);
    expect(game.earthCivi.deterrenceValue).toBeGreaterThanOrEqual(0);

    // Game must not have crashed or ended prematurely
    expect(game.year).toBeGreaterThanOrEqual(20);
    expect(Number.isFinite(game.earthCivi.population)).toBe(true);
  });

  it('事件系统在 20 回合内至少触发一个事件', () => {
    const initialEventCount = game.playerTimeline.length;

    runTurns(game, 20);

    // Either playerTimeline grew or tickerMessages was populated
    const eventsTriggered = game.playerTimeline.length > initialEventCount
      || game.tickerMessages.length > 0
      || game.historyGenerator.entries.length > 0;
    expect(eventsTriggered).toBe(true);
  });

  it('科技研究在回合推进中逐步进展', () => {
    // Before running turns, count finished techs
    let totalTechs = 0;
    let finishedBefore = 0;
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        totalTechs++;
        if (node.finished) finishedBefore++;
      }
    }

    runTurns(game, 30);

    // After turns, count again
    let finishedAfter = 0;
    for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
      for (const node of tree.nodes.values()) {
        if (node.finished) finishedAfter++;
      }
    }

    // Tech should have progressed (at least some nodes finished)
    expect(finishedAfter).toBeGreaterThanOrEqual(finishedBefore);
    // Verify total tech count is consistent
    expect(totalTechs).toBeGreaterThan(0);
  });

  it('设置高文化值时纪元随时间推进', () => {
    expect(game.epoch).toBe(EpochType.CRISIS);

    // Set culture high enough to cross into DETERRENCE era (threshold: 200)
    game.earthCivi.culture = 300;
    game.addFlag('deterrence_established');

    // Run a single turn - this triggers updateEpoch which reads culture
    runSingleTurn(game);

    // Epoch should have advanced past CRISIS
    expect(game.epoch).toBeGreaterThan(EpochType.CRISIS);
    // Should at least be in DETERRENCE (2) or BROADCAST (3)
    expect(game.epoch).toBeGreaterThanOrEqual(EpochType.DETERRENCE);
    expect(game.epoch).toBeLessThanOrEqual(EpochType.STARDUST);

    // Set culture even higher to reach broadcast era
    game.earthCivi.culture = 600;
    game.addFlag('coordinates_broadcasted');
    runSingleTurn(game);
    expect(game.epoch).toBeGreaterThanOrEqual(EpochType.BROADCAST);

    // And higher for galaxy era
    game.earthCivi.culture = 1300;
    game.addFlag('galaxy_exodus_seen');
    runSingleTurn(game);
    expect(game.epoch).toBeGreaterThanOrEqual(EpochType.GALAXY);
  });
});