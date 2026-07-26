import { beforeEach, describe, expect, it } from 'vitest';
import { Game, GameInstance } from '../../core/Game';

describe('EventSystem resource effect lower bounds', () => {
  let game: Game;

  beforeEach(() => {
    GameInstance.reset();
    game = GameInstance.get();
  });

  it('negative resource effects clamp all canonical resources at zero', () => {
    game.earthCivi.army = 10;
    game.earthCivi.economy = 20;
    game.earthCivi.population = 5;
    game.earthCivi.culture = 3;
    game.earthCivi.deterrenceValue = 8;
    game.earthCivi.resource = 4;

    game.applyNewEffects([
      { type: 'resource', target: 'army', value: -1000 },
      { type: 'resource', target: 'economy', value: -1000 },
      { type: 'resource', target: 'population', value: -1000 },
      { type: 'resource', target: 'culture', value: -1000 },
      { type: 'resource', target: 'deterrenceValue', value: -1000 },
      { type: 'resource', target: 'resource', value: -1000 },
    ]);

    expect(game.earthCivi.army).toBe(0);
    expect(game.earthCivi.economy).toBe(0);
    expect(game.earthCivi.population).toBe(0);
    expect(game.earthCivi.culture).toBe(0);
    expect(game.earthCivi.deterrenceValue).toBe(0);
    expect(game.earthCivi.resource).toBe(0);
  });

  it('military and prestige aliases use the same lower-bound protection', () => {
    game.earthCivi.army = 10;
    game.earthCivi.deterrenceValue = 5;

    game.applyNewEffects([
      { type: 'resource', target: 'military', value: -50 },
      { type: 'resource', target: 'prestige', value: -50 },
    ]);

    expect(game.earthCivi.army).toBe(0);
    expect(game.earthCivi.deterrenceValue).toBe(0);
  });

  it('positive resource effects remain additive', () => {
    game.earthCivi.army = 10;
    game.earthCivi.deterrenceValue = 5;

    game.applyNewEffects([
      { type: 'resource', target: 'military', value: 12 },
      { type: 'resource', target: 'prestige', value: 7 },
    ]);

    expect(game.earthCivi.army).toBe(22);
    expect(game.earthCivi.deterrenceValue).toBe(12);
  });
});
