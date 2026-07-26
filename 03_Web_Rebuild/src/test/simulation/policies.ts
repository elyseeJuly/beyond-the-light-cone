import type { Game } from '../../core/Game';
import type { GameEventPayload } from '../../types/narrative';
import { SeededRng } from './SeededRng';
import type { SimulationPolicy, SimulationPolicyContext } from './types';

export type SimulationPolicyId =
  | 'first-choice'
  | 'last-choice'
  | 'cycling-choice'
  | 'seeded-random-choice';

function enableAutopilot(game: Game): void {
  game.earthCivi.isAiBrainEnabled = true;
}

abstract class AutopilotPolicy implements SimulationPolicy {
  abstract readonly id: SimulationPolicyId;

  beforeRun(game: Game): void {
    enableAutopilot(game);
  }

  beforeTurn(context: SimulationPolicyContext): void {
    enableAutopilot(context.game);
  }

  abstract chooseEventChoice(event: GameEventPayload, context: SimulationPolicyContext): number;
}

export class FirstChoicePolicy extends AutopilotPolicy {
  readonly id = 'first-choice' as const;

  chooseEventChoice(_event: GameEventPayload, _context: SimulationPolicyContext): number {
    return 0;
  }
}

export class LastChoicePolicy extends AutopilotPolicy {
  readonly id = 'last-choice' as const;

  chooseEventChoice(event: GameEventPayload, _context: SimulationPolicyContext): number {
    return Math.max(0, (event.choices?.length ?? 1) - 1);
  }
}

export class CyclingChoicePolicy extends AutopilotPolicy {
  readonly id = 'cycling-choice' as const;
  private cursor: number;

  constructor(seed: number) {
    this.cursor = Math.abs(seed) % 97;
  }

  chooseEventChoice(event: GameEventPayload, _context: SimulationPolicyContext): number {
    const choiceCount = event.choices?.length ?? 0;
    if (choiceCount <= 0) return 0;
    const selected = this.cursor % choiceCount;
    this.cursor++;
    return selected;
  }
}

export class SeededRandomChoicePolicy extends AutopilotPolicy {
  readonly id = 'seeded-random-choice' as const;
  private readonly rng: SeededRng;

  constructor(seed: number) {
    super();
    this.rng = new SeededRng(seed).fork(0x504f4c49);
  }

  chooseEventChoice(event: GameEventPayload, _context: SimulationPolicyContext): number {
    const choiceCount = event.choices?.length ?? 0;
    return choiceCount > 0 ? this.rng.pickIndex(choiceCount) : 0;
  }
}

export function isSimulationPolicyId(value: string | undefined): value is SimulationPolicyId {
  return value === 'first-choice'
    || value === 'last-choice'
    || value === 'cycling-choice'
    || value === 'seeded-random-choice';
}

export function createPolicy(policyId: SimulationPolicyId, seed: number): SimulationPolicy {
  switch (policyId) {
    case 'last-choice':
      return new LastChoicePolicy();
    case 'cycling-choice':
      return new CyclingChoicePolicy(seed);
    case 'seeded-random-choice':
      return new SeededRandomChoicePolicy(seed);
    case 'first-choice':
    default:
      return new FirstChoicePolicy();
  }
}
