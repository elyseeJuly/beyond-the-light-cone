import type { Game } from '../../core/Game';
import type { GameEventPayload } from '../../types/narrative';
import { SeededRng } from './SeededRng';
import type { SimulationPolicy, SimulationPolicyContext } from './types';

function enableAutopilot(game: Game): void {
  game.earthCivi.isAiBrainEnabled = true;
}

export class FirstChoicePolicy implements SimulationPolicy {
  readonly id = 'first-choice';

  beforeRun(game: Game): void {
    enableAutopilot(game);
  }

  beforeTurn(context: SimulationPolicyContext): void {
    enableAutopilot(context.game);
  }

  chooseEventChoice(_event: GameEventPayload, _context: SimulationPolicyContext): number {
    return 0;
  }
}

export class SeededRandomChoicePolicy implements SimulationPolicy {
  readonly id = 'seeded-random-choice';
  private readonly rng: SeededRng;

  constructor(seed: number) {
    this.rng = new SeededRng(seed).fork(0x504f4c49);
  }

  beforeRun(game: Game): void {
    enableAutopilot(game);
  }

  beforeTurn(context: SimulationPolicyContext): void {
    enableAutopilot(context.game);
  }

  chooseEventChoice(event: GameEventPayload, _context: SimulationPolicyContext): number {
    const choiceCount = event.choices?.length ?? 0;
    return choiceCount > 0 ? this.rng.pickIndex(choiceCount) : 0;
  }
}

export function createPolicy(policyId: 'first-choice' | 'seeded-random-choice', seed: number): SimulationPolicy {
  return policyId === 'seeded-random-choice'
    ? new SeededRandomChoicePolicy(seed)
    : new FirstChoicePolicy();
}
