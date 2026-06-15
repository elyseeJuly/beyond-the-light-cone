import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { AlienCivilization } from '../../core/AlienCivilization';
import { AiPersonality, FriendshipType } from '../../types/enums';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('AlienCivilization and Manager tests', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('AI Behaviors under different personalities', () => {
    // Set up a mock RNG that returns specific values to trigger code paths
    let rngVal = 0.01;
    const mockRng = {
      random: () => rngVal
    };

    // Hunter Behavior
    const hunter = new AlienCivilization('猎手AI', 0, AiPersonality.HUNTER);
    hunter.setRngProvider(mockRng);
    hunter.friendshipType = FriendshipType.NORMAL;

    // Run hunterBehavior via runARound / ageBehavior
    // hunter behavior conditions: rng() < 0.18 (mock is 0.01) and attackCooldown === 0
    (hunter as any).ageBehavior(game);
    expect(hunter.attackCooldown).toBeGreaterThan(0);
    const firstCooldown = hunter.attackCooldown;

    // Decrement cooldown
    (hunter as any).ageBehavior(game);
    expect(hunter.attackCooldown).toBe(firstCooldown - 1);

    // Run down to 0 and launch
    hunter.attackCooldown = 1;
    (hunter as any).ageBehavior(game);
    expect(hunter.attackCooldown).toBe(0);
    expect(hunter.fleets.length).toBe(1);
    expect(hunter.fleets[0].name).toContain('远征军');

    // Cleaner Behavior
    const cleaner = new AlienCivilization('清理者AI', 1, AiPersonality.CLEANER);
    cleaner.setRngProvider(mockRng);
    (cleaner as any).ageBehavior(game);
    expect(cleaner.attackCooldown).toBeGreaterThan(0);
    cleaner.attackCooldown = 1;
    (cleaner as any).ageBehavior(game);
    expect(cleaner.fleets.length).toBe(1);

    // Expansionist Behavior
    const expansionist = new AlienCivilization('扩张者AI', 2, AiPersonality.EXPANSIONIST);
    expansionist.setRngProvider(mockRng);
    // Trigger expansion behavior (rng() < 0.10)
    // Make sure there is an unowned star with index > 8
    const star = game.starManager.getStar(9);
    if (star) {
      star.isPlanet = true;
      star.belongToCivi = '';
    }
    (expansionist as any).ageBehavior(game);
    
    // Validate that some star was successfully claimed
    expect(expansionist.starIndices.size).toBeGreaterThan(0);
    const claimedIndex = Array.from(expansionist.starIndices)[0];
    expect(game.starManager.getStar(claimedIndex)?.belongToCivi).toBe('扩张者AI');

    // Defensive Behavior
    const defensive = new AlienCivilization('防御者AI', 3, AiPersonality.DEFENSIVE);
    defensive.setRngProvider(mockRng);
    const initArmy = defensive.army;
    (defensive as any).ageBehavior(game);
    expect(defensive.army).toBeGreaterThan(initArmy);

    // Opportunist Behavior
    const opportunist = new AlienCivilization('机会主义AI', 4, AiPersonality.OPPORTUNIST);
    opportunist.setRngProvider(mockRng);
    // Scenario 1: Friendship >= FRIEND -> ask for economic aid
    opportunist.friendshipType = FriendshipType.FRIEND;
    game.earthCivi.economy = 1000;
    (opportunist as any).ageBehavior(game);
    expect(game.earthCivi.economy).toBeLessThan(1000);

    // Scenario 2: Friendship < FRIEND and deterrence < 50 -> attack
    opportunist.friendshipType = FriendshipType.NORMAL;
    game.earthCivi.deterrenceValue = 20; // deterrenceRate < 50
    (opportunist as any).ageBehavior(game);
    expect(opportunist.fleets.length).toBe(1);
  });

  it('Fleet progression and combat resolution', () => {
    const hunter = new AlienCivilization('三体', 0, AiPersonality.HUNTER);
    // Launch a fleet with ETA = 2
    (hunter as any).launchFleetAttack(game, 2);
    expect(hunter.fleets.length).toBe(1);

    const fleet = hunter.fleets[0];
    expect(fleet.eta).toBe(2);

    // Process turn 1 -> ETA decreases to 1
    (hunter as any).processFleets(game);
    expect(fleet.eta).toBe(1);

    // Make target belong to Earth
    const targetStar = game.starManager.getStar(fleet.targetStarIndex);
    if (targetStar) {
      targetStar.belongToCivi = '地球';
    }

    // Scenario A: Earth defense wins (we mock defBarback soldier count or fleet strength)
    // resolveFleetVsBarback uses random, let's keep defBarback extremely strong
    game.earthCivi.army = 99999;
    (hunter as any).processFleets(game);
    // Since ETA hits 0, it resolves combat. Earth should defeat the fleet, and fleet is removed.
    expect(hunter.fleets.length).toBe(0);
    expect(targetStar?.belongToCivi).toBe('地球');

    // Scenario B: Alien wins combat and occupies Earth
    (hunter as any).launchFleetAttack(game, 1);
    const fleet2 = hunter.fleets[0];
    const targetStar2 = game.starManager.getStar(fleet2.targetStarIndex);
    if (targetStar2) {
      targetStar2.belongToCivi = '地球';
    }
    game.earthCivi.army = -490; // Extremely weak defense
    (hunter as any).processFleets(game);
    // Since alien won, the target star belongToCivi is updated
    expect(targetStar2?.belongToCivi).toBe('三体');
  });

  it('AI special weapons (Waterdrop & Dimension strike execution)', () => {
    const trisolaris = game.alienCiviManager.aliens.get('三体');
    expect(trisolaris).toBeDefined();

    if (trisolaris) {
      // Waterdrop launch
      // Add stars so earth has > 1 star (safety valve check)
      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);

      trisolaris.launchWaterdropAttack(game);
      expect(trisolaris.waterdropCount).toBe(1);
      expect(trisolaris.waterdropCooldown).toBe(10);
      expect(trisolaris.fleets.length).toBeGreaterThan(0);

      // Dimension strike warning execution
      trisolaris.hasDimensionStruck = false;
      trisolaris.triggerDimensionStrike(game);
      expect(trisolaris.hasDimensionStruck).toBe(true);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(5);

      // Warning countdown ticks down
      for (let i = 0; i < 4; i++) {
        (trisolaris as any).processDimensionStrike(game);
      }
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(1);

      // Final strike triggers Game Over when survives is false
      game.isGameOver = false;
      const tm = game.earthCivi.tecTreeManager;
      // Ensure no survival techs are finished
      expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);
      expect(tm.isTecFinishedAnywhere('数字方舟')).toBe(false);

      (trisolaris as any).processDimensionStrike(game);
      game.checkVictoryConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.defeatType).toBe(3);

      // Reset and trigger survival case
      game.isGameOver = false;
      trisolaris.dimensionStrikeWarningTurns = 1;
      // Mock survival flag
      game.addFlag('galaxy_exodus_seen');
      (trisolaris as any).processDimensionStrike(game);
      expect(game.isGameOver).toBe(false);
    }
  });

  it('loseStar behavior in AlienCiviManager', () => {
    const manager = game.alienCiviManager;
    const alien = manager.aliens.get('三体');
    expect(alien).toBeDefined();

    if (alien) {
      alien.starIndices.add(55);
      expect(alien.starIndices.has(55)).toBe(true);

      // lose star but not die out
      alien.starIndices.add(56);
      manager.loseStar('三体', 55);
      expect(alien.starIndices.has(55)).toBe(false);

      // lose star and die out (empty starIndices)
      alien.starIndices.clear();
      alien.starIndices.add(55);
      manager.loseStar('三体', 55);
      expect(alien.isDieOut()).toBe(true);
    }
  });
});
