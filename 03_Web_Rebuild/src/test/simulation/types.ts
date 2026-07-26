import type { Game } from '../../core/Game';
import type { GameEventPayload } from '../../types/narrative';

export type SimulationTerminationReason =
  | 'target-reached'
  | 'game-over'
  | 'turn-attempt-cap'
  | 'event-resolution-cap'
  | 'invariant-violation'
  | 'exception';

export interface SimulationConfig {
  seed: number;
  targetTurns: number;
  maxTurnAttempts?: number;
  maxEventResolutionsPerTurn?: number;
  traceLimit?: number;
  strictMode?: boolean;
  policy: SimulationPolicy;
}

export interface SimulationPolicyContext {
  game: Game;
  turnAttempt: number;
  completedTurns: number;
}

export interface SimulationPolicy {
  readonly id: string;
  beforeRun?(game: Game): void;
  beforeTurn?(context: SimulationPolicyContext): void;
  chooseEventChoice(event: GameEventPayload, context: SimulationPolicyContext): number;
}

export interface SimulationSnapshot {
  year: number;
  epoch: number;
  population: number;
  economy: number;
  culture: number;
  resource: number;
  army: number;
  treachery: number;
  deterrence: number;
  actionPoints: number;
  eventQueueLength: number;
  flagCount: number;
  finishedTechCount: number;
  timelineEntryCount: number;
  historyEntryCount: number;
  isGameOver: boolean;
}

export interface SimulationTraceEntry {
  step: number;
  kind: 'turn' | 'event' | 'termination';
  year: number;
  epoch: number;
  message: string;
  eventId?: string;
  eventTitle?: string;
  choiceIndex?: number;
  choiceLabel?: string;
}

export interface SimulationCoverage {
  observedEventIds: string[];
  observedFlags: string[];
  observedEpochs: number[];
  observedEndings: string[];
}

export interface InvariantViolation {
  id: string;
  message: string;
  year: number;
  epoch: number;
}

export interface SimulationRunResult {
  seed: number;
  policyId: string;
  targetTurns: number;
  completedTurns: number;
  turnAttempts: number;
  yearsAdvanced: number;
  terminationReason: SimulationTerminationReason;
  start: SimulationSnapshot;
  end: SimulationSnapshot;
  violations: InvariantViolation[];
  trace: SimulationTraceEntry[];
  coverage: SimulationCoverage;
  errorMessage?: string;
  replayCommand: string;
  durationMs: number;
}

export type SimulationInvariant = (
  game: Game,
  previous: SimulationSnapshot | null,
  current: SimulationSnapshot,
) => InvariantViolation[];
