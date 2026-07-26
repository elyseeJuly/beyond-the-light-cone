import { Game, GameInstance } from '../../core/Game';
import { DefeatType, EventEffect, NeutralType, VictoryType } from '../../types/enums';
import { defaultSimulationInvariants } from './invariants';
import { SeededRng } from './SeededRng';
import type {
  InvariantViolation,
  SimulationConfig,
  SimulationInvariant,
  SimulationRunResult,
  SimulationSnapshot,
  SimulationTerminationReason,
  SimulationTraceEntry,
} from './types';

interface ResolvedConfig extends SimulationConfig {
  maxTurnAttempts: number;
  maxEventResolutionsPerTurn: number;
  traceLimit: number;
  strictMode: boolean;
}

function countFinishedTechs(game: Game): number {
  let count = 0;
  for (const tree of game.earthCivi.tecTreeManager.trees.values()) {
    for (const node of tree.nodes.values()) {
      if (node.finished) count++;
    }
  }
  return count;
}

export class GameSimulationAdapter {
  private readonly config: ResolvedConfig;
  private readonly invariants: SimulationInvariant[];
  private readonly trace: SimulationTraceEntry[] = [];
  private readonly observedEventIds = new Set<string>();
  private readonly observedFlags = new Set<string>();
  private readonly observedEpochs = new Set<number>();
  private readonly observedEndings = new Set<string>();
  private traceStep = 0;
  private game: Game | null = null;

  constructor(
    config: SimulationConfig,
    invariants: SimulationInvariant[] = defaultSimulationInvariants,
  ) {
    if (!Number.isInteger(config.targetTurns) || config.targetTurns <= 0) {
      throw new RangeError(`targetTurns must be a positive integer: ${config.targetTurns}`);
    }
    this.config = {
      ...config,
      maxTurnAttempts: config.maxTurnAttempts ?? config.targetTurns * 10,
      maxEventResolutionsPerTurn: config.maxEventResolutionsPerTurn ?? 100,
      traceLimit: config.traceLimit ?? 200,
      strictMode: config.strictMode ?? true,
    };
    this.invariants = invariants;
  }

  run(): SimulationRunResult {
    const startedAt = Date.now();
    const previousStrictMode = Game.strictMode;
    const violations: InvariantViolation[] = [];
    let terminationReason: SimulationTerminationReason = 'target-reached';
    let errorMessage: string | undefined;
    let turnAttempts = 0;
    let completedTurns = 0;
    let previousSnapshot: SimulationSnapshot | null = null;

    Game.strictMode = this.config.strictMode;
    const game = this.initializeGame();
    const start = this.snapshot(game);
    this.captureCoverage(game);

    try {
      this.config.policy.beforeRun?.(game);
      previousSnapshot = start;

      while (completedTurns < this.config.targetTurns && !game.isGameOver) {
        if (turnAttempts >= this.config.maxTurnAttempts) {
          terminationReason = 'turn-attempt-cap';
          break;
        }

        turnAttempts++;
        const yearBefore = game.year;
        const context = { game, turnAttempt: turnAttempts, completedTurns };
        this.config.policy.beforeTurn?.(context);
        game.earthCivi.isAiBrainEnabled = true;
        game.runARound();

        const eventsResolved = this.resolvePendingEvents(game, turnAttempts, completedTurns);
        if (!eventsResolved) {
          terminationReason = 'event-resolution-cap';
          violations.push({
            id: 'INV-EVENT-RESOLUTION-CAP',
            message: `pending events exceeded cap ${this.config.maxEventResolutionsPerTurn}`,
            year: game.year,
            epoch: game.epoch,
          });
          break;
        }

        if (game.year > yearBefore) completedTurns++;
        const currentSnapshot = this.snapshot(game);
        this.captureCoverage(game);
        this.pushTrace({
          kind: 'turn',
          year: game.year,
          epoch: game.epoch,
          message: `attempt=${turnAttempts}, completed=${completedTurns}, year=${yearBefore}->${game.year}`,
        });

        for (const invariant of this.invariants) {
          violations.push(...invariant(game, previousSnapshot, currentSnapshot));
        }
        previousSnapshot = currentSnapshot;

        if (violations.length > 0) {
          terminationReason = 'invariant-violation';
          break;
        }
      }

      if (game.isGameOver) terminationReason = 'game-over';
    } catch (error) {
      terminationReason = 'exception';
      errorMessage = error instanceof Error ? error.stack ?? error.message : String(error);
      violations.push({
        id: 'INV-NO-RUNTIME-EXCEPTION',
        message: errorMessage,
        year: game.year,
        epoch: game.epoch,
      });
    } finally {
      this.captureCoverage(game);
      Game.strictMode = previousStrictMode;
    }

    const end = this.snapshot(game);
    this.pushTrace({
      kind: 'termination',
      year: end.year,
      epoch: end.epoch,
      message: `${terminationReason}; completed=${completedTurns}/${this.config.targetTurns}`,
    });

    return {
      seed: this.config.seed,
      policyId: this.config.policy.id,
      targetTurns: this.config.targetTurns,
      completedTurns,
      turnAttempts,
      yearsAdvanced: end.year - start.year,
      terminationReason,
      start,
      end,
      violations,
      trace: [...this.trace],
      coverage: {
        observedEventIds: [...this.observedEventIds].sort(),
        observedFlags: [...this.observedFlags].sort(),
        observedEpochs: [...this.observedEpochs].sort((a, b) => a - b),
        observedEndings: [...this.observedEndings].sort(),
      },
      errorMessage,
      replayCommand: `SIM_SEED=${this.config.seed} SIM_POLICY=${this.config.policy.id} SIM_TURNS=${this.config.targetTurns} npm run test:simulation:replay`,
      durationMs: Date.now() - startedAt,
    };
  }

  getGame(): Game {
    if (!this.game) throw new Error('Simulation has not been initialized');
    return this.game;
  }

  private initializeGame(): Game {
    GameInstance.reset();
    const game = GameInstance.get();
    game.setRngProvider(new SeededRng(this.config.seed));
    this.game = game;
    return game;
  }

  private resolvePendingEvents(
    game: Game,
    turnAttempt: number,
    completedTurns: number,
  ): boolean {
    let resolutions = 0;
    while (game.currentEvent || game.eventQueue.length > 0) {
      if (resolutions >= this.config.maxEventResolutionsPerTurn) return false;
      resolutions++;

      if (!game.currentEvent) game.processNextEvent();
      const event = game.currentEvent;
      if (!event) continue;

      if (event.id) this.observedEventIds.add(event.id);
      const context = { game, turnAttempt, completedTurns };
      const choices = event.choices ?? [];
      if (choices.length === 0) {
        this.pushTrace({
          kind: 'event',
          year: game.year,
          epoch: game.epoch,
          eventId: event.id,
          eventTitle: event.title,
          message: 'event had no choices; acknowledged with NONE',
        });
        game.applyEventEffect(EventEffect.NONE, true);
        this.captureCoverage(game, event.id);
        continue;
      }

      const requestedIndex = this.config.policy.chooseEventChoice(event, context);
      const choiceIndex = Math.min(Math.max(0, requestedIndex), choices.length - 1);
      const choice = choices[choiceIndex];
      const eventBeforeAction = game.currentEvent;
      choice.action();

      this.pushTrace({
        kind: 'event',
        year: game.year,
        epoch: game.epoch,
        eventId: event.id,
        eventTitle: event.title,
        choiceIndex,
        choiceLabel: choice.label,
        message: `selected choice ${choiceIndex}: ${choice.label}`,
      });

      if (game.currentEvent === eventBeforeAction) {
        game.applyEventEffect(EventEffect.NONE, true);
      }
      this.captureCoverage(game, event.id);
    }
    return true;
  }

  private snapshot(game: Game): SimulationSnapshot {
    return {
      year: game.year,
      epoch: game.epoch,
      population: game.earthCivi.population,
      economy: game.earthCivi.economy,
      culture: game.earthCivi.culture,
      resource: game.earthCivi.resource,
      army: game.earthCivi.army,
      treachery: game.earthCivi.treachery,
      deterrence: game.earthCivi.deterrenceValue,
      actionPoints: game.earthCivi.apCurrent,
      eventQueueLength: game.eventQueue.length + (game.currentEvent ? 1 : 0),
      flagCount: game.flags.size,
      finishedTechCount: countFinishedTechs(game),
      timelineEntryCount: game.playerTimeline.length,
      historyEntryCount: game.historyLogs.length,
      isGameOver: game.isGameOver,
    };
  }

  private captureCoverage(game: Game, eventId?: string): void {
    if (eventId) this.observedEventIds.add(eventId);
    this.observedEpochs.add(game.epoch);
    for (const flag of game.flagManager.getSnapshot()) {
      this.observedFlags.add(flag);
    }
    if (game.victoryType !== null) {
      this.observedEndings.add(`victory:${VictoryType[game.victoryType]}`);
    }
    if (game.defeatType !== null) {
      this.observedEndings.add(`defeat:${DefeatType[game.defeatType]}`);
    }
    if (game.neutralType !== null) {
      this.observedEndings.add(`neutral:${NeutralType[game.neutralType]}`);
    }
  }

  private pushTrace(entry: Omit<SimulationTraceEntry, 'step'>): void {
    this.trace.push({ ...entry, step: ++this.traceStep });
    if (this.trace.length > this.config.traceLimit) this.trace.shift();
  }
}
