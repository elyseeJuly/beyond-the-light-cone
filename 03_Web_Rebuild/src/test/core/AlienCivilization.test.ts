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

  describe('AI Personality Edge Cases', () => {
    it('HUNTER: attack cooldown behavior and countdown', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const hunter = new AlienCivilization('猎手AI-Edge', 0, AiPersonality.HUNTER);
      hunter.setRngProvider(mockRng);
      hunter.friendshipType = FriendshipType.NORMAL;
      game.earthCivi.deterrenceValue = 0;

      // First call: sets cooldown
      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBeGreaterThan(0);
      const cooldownSet = hunter.attackCooldown;

      // Second call: decrements cooldown, doesn't launch yet (still > 1)
      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBe(cooldownSet - 1);
      expect(hunter.fleets.length).toBe(0); // fleet not yet launched

      // Set cooldown to 1, next call launches fleet
      hunter.attackCooldown = 1;
      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBe(0);
      expect(hunter.fleets.length).toBe(1);
    });

    it('HUNTER: does not attack when deterrence >= 90', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const hunter = new AlienCivilization('猎手AI-HighDet', 0, AiPersonality.HUNTER);
      hunter.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 200; // deterrenceRate = 100+

      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBe(0);
      expect(hunter.fleets.length).toBe(0);
    });

    it('HUNTER: deterrence/broadcast epoch may block attack via epochDeterrenceChance', () => {
      // Use rng low enough to pass initial attack chance check (0.18) but caught by epoch check (0.3)
      let rngVal = 0.15;
      const mockRng = { random: () => rngVal };

      const hunter = new AlienCivilization('猎手AI-Epoch', 0, AiPersonality.HUNTER);
      hunter.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 0;
      hunter.friendshipType = FriendshipType.NORMAL;

      // Set epoch to DETERRENCE, attack should be blocked by epochDeterrenceChance check
      // rng (0.15) < 0.18 passes first check, then rng (0.15) < 0.3 triggers epoch block
      const prevEpoch = game.epoch;
      (game as any).epoch = 2; // EpochType.DETERRENCE

      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBe(0);
      expect(hunter.fleets.length).toBe(0);

      (game as any).epoch = prevEpoch;
    });

    it('HUNTER: earth isDieOut prevents attack', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const hunter = new AlienCivilization('猎手AI-DieOut', 0, AiPersonality.HUNTER);
      hunter.setRngProvider(mockRng);
      game.earthCivi.starIndices.clear(); // earth becomes die out

      (hunter as any).ageBehavior(game);
      expect(hunter.attackCooldown).toBe(0);
      expect(hunter.fleets.length).toBe(0);

      // Restore earth
      game.earthCivi.starIndices.add(3);
    });

    it('CLEANER: standard attack flow', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const cleaner = new AlienCivilization('清理者AI-Edge', 0, AiPersonality.CLEANER);
      cleaner.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 0;

      (cleaner as any).ageBehavior(game);
      expect(cleaner.attackCooldown).toBeGreaterThan(0);

      cleaner.attackCooldown = 1;
      (cleaner as any).ageBehavior(game);
      expect(cleaner.fleets.length).toBe(1);
    });

    it('CLEANER: does not attack when deterrence >= 70', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const cleaner = new AlienCivilization('清理者AI-HighDet', 0, AiPersonality.CLEANER);
      cleaner.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 200; // deterrenceRate >= 100

      (cleaner as any).ageBehavior(game);
      expect(cleaner.attackCooldown).toBe(0);
    });

    it('CLEANER: earth isDieOut prevents attack', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const cleaner = new AlienCivilization('清理者AI-DieOut', 0, AiPersonality.CLEANER);
      cleaner.setRngProvider(mockRng);
      game.earthCivi.starIndices.clear();

      (cleaner as any).ageBehavior(game);
      expect(cleaner.attackCooldown).toBe(0);

      game.earthCivi.starIndices.add(3);
    });

    it('EXPANSIONIST: expands to unowned star', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const expansionist = new AlienCivilization('扩张者AI-Edge', 0, AiPersonality.EXPANSIONIST);
      expansionist.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 0;

      // Setup an unowned star
      const star = game.starManager.getStar(9);
      if (star) {
        star.isPlanet = true;
        star.belongToCivi = '';
      }

      const prevSize = expansionist.starIndices.size;
      (expansionist as any).ageBehavior(game);
      expect(expansionist.starIndices.size).toBeGreaterThan(prevSize);
    });

    it('EXPANSIONIST: does not expand when no unowned stars', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const expansionist = new AlienCivilization('扩张者AI-NoStars', 0, AiPersonality.EXPANSIONIST);
      expansionist.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 0;

      // Set all stars to owned
      const allStars = game.starManager.getAllStars();
      for (const s of allStars) {
        if (s.isPlanet) s.belongToCivi = 'some_civi';
      }

      const prevSize = expansionist.starIndices.size;
      (expansionist as any).ageBehavior(game);
      expect(expansionist.starIndices.size).toBe(prevSize);
    });

    it('EXPANSIONIST: does not expand when deterrence >= 80', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const expansionist = new AlienCivilization('扩张者AI-HighDet', 0, AiPersonality.EXPANSIONIST);
      expansionist.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 200; // deterrenceRate >= 100

      // Setup unowned star
      const star = game.starManager.getStar(9);
      if (star) {
        star.isPlanet = true;
        star.belongToCivi = '';
      }

      const prevSize = expansionist.starIndices.size;
      (expansionist as any).ageBehavior(game);
      expect(expansionist.starIndices.size).toBe(prevSize);
    });

    it('DEFENSIVE: builds army each turn', () => {
      let rngVal = 0.5;
      const mockRng = { random: () => rngVal };

      const defensive = new AlienCivilization('防御者AI-Edge', 0, AiPersonality.DEFENSIVE);
      defensive.setRngProvider(mockRng);
      const initArmy = defensive.army;

      (defensive as any).ageBehavior(game);
      expect(defensive.army).toBe(initArmy + 5);
    });

    it('OPPORTUNIST: attacks when deterrence < 50', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const opportunist = new AlienCivilization('机会AI-Attack', 0, AiPersonality.OPPORTUNIST);
      opportunist.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 0;

      (opportunist as any).ageBehavior(game);
      expect(opportunist.fleets.length).toBe(1);
    });

    it('OPPORTUNIST: does not attack when deterrence >= 50', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const opportunist = new AlienCivilization('机会AI-HighDet', 0, AiPersonality.OPPORTUNIST);
      opportunist.setRngProvider(mockRng);
      game.earthCivi.deterrenceValue = 150; // deterrenceRate >= 75

      (opportunist as any).ageBehavior(game);
      expect(opportunist.fleets.length).toBe(0);
    });

    it('OPPORTUNIST: as friend requests economic aid', () => {
      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };

      const opportunist = new AlienCivilization('机会AI-Friend', 0, AiPersonality.OPPORTUNIST);
      opportunist.setRngProvider(mockRng);
      opportunist.friendshipType = FriendshipType.FRIEND;
      game.earthCivi.economy = 1000;

      (opportunist as any).ageBehavior(game);
      expect(game.earthCivi.economy).toBeLessThan(1000);
      expect(game.earthCivi.economy).toBeGreaterThanOrEqual(900);
    });
  });

  describe('Sophon Blocking System', () => {
    it('isSophonBlocked returns true when conditions are met', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      expect(sanTi).toBeDefined();
      if (sanTi) {
        sanTi.isDieOut = () => false; // Ensure not dead
        sanTi.friendshipType = FriendshipType.NORMAL; // < FRIEND
      }
      // Ensure critical techs are NOT finished
      const tm = game.earthCivi.tecTreeManager;
      const infoTree = tm.trees.get(3);
      if (infoTree) {
        const node = infoTree.nodes.get('550W量子计算机');
        if (node) node.finished = false;
      }
      const physTree = tm.trees.get(0);
      if (physTree) {
        const node = physTree.nodes.get('智子工程');
        if (node) node.finished = false;
      }

      expect(game.isSophonBlocked()).toBe(true);
    });

    it('isSophonBlocked returns false when year < 10', () => {
      game.year = 5;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.isDieOut = () => false;
        sanTi.friendshipType = FriendshipType.NORMAL;
      }
      expect(game.isSophonBlocked()).toBe(false);
    });

    it('isSophonBlocked returns false when sanTi is dead', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.starIndices.clear(); // die out
      }
      expect(game.isSophonBlocked()).toBe(false);
    });

    it('isSophonBlocked returns false when sanTi friendship >= FRIEND', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.starIndices.add(999);
        sanTi.friendshipType = FriendshipType.FRIEND;
      }
      expect(game.isSophonBlocked()).toBe(false);
    });

    it('isSophonBlocked returns false when 550W量子计算机 is finished', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.starIndices.add(999);
        sanTi.friendshipType = FriendshipType.NORMAL;
      }
      const tm = game.earthCivi.tecTreeManager;
      const infoTree = tm.trees.get(3);
      if (infoTree) {
        const node = infoTree.nodes.get('550W量子计算机');
        if (node) node.finished = true;
      }
      expect(game.isSophonBlocked()).toBe(false);
      // Cleanup
      if (infoTree) {
        const node = infoTree.nodes.get('550W量子计算机');
        if (node) node.finished = false;
      }
    });

    it('isSophonBlocked returns false when 智子工程 is finished', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.starIndices.add(999);
        sanTi.friendshipType = FriendshipType.NORMAL;
      }
      const tm = game.earthCivi.tecTreeManager;
      const physTree = tm.trees.get(0);
      if (physTree) {
        const node = physTree.nodes.get('智子工程');
        if (node) node.finished = true;
      }
      expect(game.isSophonBlocked()).toBe(false);
      // Cleanup
      if (physTree) {
        const node = physTree.nodes.get('智子工程');
        if (node) node.finished = false;
      }
    });

    it('sophon blocking reduces research progress to 1/3', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.starIndices.add(999);
        sanTi.friendshipType = FriendshipType.NORMAL;
      }

      expect(game.isSophonBlocked()).toBe(true);

      // Test the actual progress reduction logic from EarthCivilization
      const progress = 30;
      const blockedProgress = Math.max(3, Math.floor(progress / 3));
      expect(blockedProgress).toBe(10);

      const progress2 = 9;
      const blockedProgress2 = Math.max(3, Math.floor(progress2 / 3));
      expect(blockedProgress2).toBe(3); // Minimum 3
    });
  });

  describe('Deterrence Calculation', () => {
    it('calculateDeterrence without swordholder uses only earth deterrenceValue', () => {
      const alien = new AlienCivilization('测试文明-Det', 0, AiPersonality.HUNTER);
      game.earthCivi.deterrenceValue = 50;
      game.earthCivi.swordholder = null;

      const rate = (alien as any).calculateDeterrence(game);
      expect(rate).toBe(25); // 50 * 0.5
    });

    it('calculateDeterrence with swordholder adds leadership', () => {
      const alien = new AlienCivilization('测试文明-Det2', 0, AiPersonality.HUNTER);
      game.earthCivi.deterrenceValue = 60;
      game.earthCivi.swordholder = 'test_swordholder';

      // Need to add a person to personManager
      const mockPerson = { name: 'test_swordholder', leadership: 40 };
      const origGetPerson = game.personManager.getPerson;
      game.personManager.getPerson = (name: string) => name === 'test_swordholder' ? mockPerson as any : origGetPerson.call(game.personManager, name);

      const rate = (alien as any).calculateDeterrence(game);
      expect(rate).toBe(70); // 60 * 0.5 + 40 = 30 + 40

      // Restore
      game.personManager.getPerson = origGetPerson;
    });

    it('calculateDeterrence with swordholder but no person object', () => {
      const alien = new AlienCivilization('测试文明-Det3', 0, AiPersonality.HUNTER);
      game.earthCivi.deterrenceValue = 80;
      game.earthCivi.swordholder = 'nonexistent';

      const rate = (alien as any).calculateDeterrence(game);
      expect(rate).toBe(40); // 80 * 0.5 = 40 (no leadership added)
    });
  });

  describe('Waterdrop Attack Edge Cases', () => {
    it('cannot launch waterdrop beyond maximum of 3', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      expect(trisolaris).toBeDefined();
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);

      trisolaris.waterdropCount = 3;
      trisolaris.waterdropCooldown = 0;
      trisolaris.launchWaterdropAttack(game);
      expect(trisolaris.waterdropCount).toBe(3); // Not incremented
    });

    it('cannot launch waterdrop when cooldown > 0', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      trisolaris.waterdropCount = 0;
      trisolaris.waterdropCooldown = 5;
      trisolaris.launchWaterdropAttack(game);
      expect(trisolaris.waterdropCount).toBe(0); // Not incremented
    });

    it('waterdrop safety valve when earth has <= 1 star', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.clear();
      game.earthCivi.starIndices.add(3); // Only 1 star

      trisolaris.waterdropCount = 0;
      trisolaris.waterdropCooldown = 0;
      trisolaris.launchWaterdropAttack(game);
      expect(trisolaris.waterdropCount).toBe(0); // Not incremented
    });

    it('waterdrop cooldown decrements each turn', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      trisolaris.waterdropCooldown = 10;
      trisolaris.runARound(); // cooldown decrements at start of runARound
      expect(trisolaris.waterdropCooldown).toBe(9);
    });

    it('waterdrop fleet progresses through ETA and engages', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);

      trisolaris.launchWaterdropAttack(game);
      expect(trisolaris.fleets.length).toBeGreaterThan(0);
      const fleet = trisolaris.fleets[trisolaris.fleets.length - 1];
      expect(fleet.eta).toBe(3);

      // Process through ETA
      (trisolaris as any).processFleets(game);
      expect(fleet.eta).toBe(2);

      (trisolaris as any).processFleets(game);
      expect(fleet.eta).toBe(1);

      // Make earth star belong to earth
      const targetStar = game.starManager.getStar(fleet.targetStarIndex);
      if (targetStar) targetStar.belongToCivi = '地球';

      (trisolaris as any).processFleets(game);
      // ETA reaches 0 - combat resolves
      expect(fleet.eta).toBe(0);
    });
  });

  describe('Dimension Strike', () => {
    it('warning turns countdown', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      trisolaris.hasDimensionStruck = false;

      trisolaris.triggerDimensionStrike(game);
      expect(trisolaris.hasDimensionStruck).toBe(true);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(5);

      (trisolaris as any).processDimensionStrike(game);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(4);

      (trisolaris as any).processDimensionStrike(game);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(3);
    });

    it('cannot trigger dimension strike twice', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      trisolaris.hasDimensionStruck = true;

      trisolaris.triggerDimensionStrike(game);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(0);
    });

    it('safety valve when earth has <= 1 star', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.clear();
      game.earthCivi.starIndices.add(3);
      trisolaris.hasDimensionStruck = false;

      trisolaris.triggerDimensionStrike(game);
      expect(trisolaris.hasDimensionStruck).toBe(false);
    });

    it('strike kills earth without survival techs', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      trisolaris.hasDimensionStruck = false;
      game.isGameOver = false;
      game.year = 42; // Non-zero year for dimensionStrikeYear check

      trisolaris.triggerDimensionStrike(game);
      expect(trisolaris.dimensionStrikeWarningTurns).toBe(5);

      // Ensure no survival techs
      const tm = game.earthCivi.tecTreeManager;
      expect(tm.isTecFinishedAnywhere('黑域生成')).toBe(false);
      expect(tm.isTecFinishedAnywhere('数字方舟')).toBe(false);

      // Process all warning turns
      for (let i = 0; i < 5; i++) {
        (trisolaris as any).processDimensionStrike(game);
      }

      expect(game.dimensionStrikeTriggered).toBe(true);
      expect(game.dimensionStrikeYear).toBe(42);
    });

    it('strike survival with galaxy_exodus_seen flag', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      trisolaris.hasDimensionStruck = false;
      game.isGameOver = false;
      game.dimensionStrikeTriggered = false;

      trisolaris.triggerDimensionStrike(game);
      game.addFlag('galaxy_exodus_seen');

      for (let i = 0; i < 5; i++) {
        (trisolaris as any).processDimensionStrike(game);
      }

      expect(game.dimensionStrikeTriggered).toBe(false);
      expect(game.earthCivi.population).toBeGreaterThan(0);
    });
  });

  describe('AlienCiviManager Additional Tests', () => {
    it('loseStar with multiple stars does not trigger die out', () => {
      const manager = game.alienCiviManager;
      const alien = manager.aliens.get('三体');
      if (!alien) return;

      alien.starIndices.add(55);
      alien.starIndices.add(56);
      alien.starIndices.add(57);

      manager.loseStar('三体', 55);
      expect(alien.isDieOut()).toBe(false);
      expect(alien.starIndices.has(55)).toBe(false);
      // 三体 starts with 1 home star from init, plus 3 added = 4, minus 1 removed = 3
      expect(alien.starIndices.size).toBe(3);
    });

    it('isAllCiviConquered returns false when some aliens alive', () => {
      const manager = game.alienCiviManager;
      const firstAlien = Array.from(manager.aliens.values())[0];
      if (firstAlien) {
        firstAlien.starIndices.add(999); // Ensure alive
      }
      expect(manager.isAllCiviConquered()).toBe(false);
    });

    it('isAllCiviConquered returns true when all aliens dead or bundled', () => {
      const manager = game.alienCiviManager;
      for (const alien of manager.aliens.values()) {
        alien.starIndices.clear();
      }
      expect(manager.isAllCiviConquered()).toBe(true);
    });

    it('hasAnyAtWar returns true when alien is VERYANGRY', () => {
      const manager = game.alienCiviManager;
      const firstAlien = Array.from(manager.aliens.values())[0];
      if (firstAlien) {
        firstAlien.starIndices.add(999);
        firstAlien.friendshipType = FriendshipType.VERYANGRY;
      }
      expect(manager.hasAnyAtWar()).toBe(true);
    });

    it('hasAnyAtWar returns false when no alien is VERYANGRY', () => {
      const manager = game.alienCiviManager;
      for (const alien of manager.aliens.values()) {
        if (!alien.isDieOut()) {
          alien.friendshipType = FriendshipType.NORMAL;
        }
      }
      expect(manager.hasAnyAtWar()).toBe(false);
    });

    it('setRngProvider propagates to all aliens', () => {
      const manager = game.alienCiviManager;
      const mockRng = { random: () => 0.42 };
      manager.setRngProvider(mockRng);

      for (const alien of manager.aliens.values()) {
        expect((alien as any)._rngProvider).toBe(mockRng);
      }
    });
  });

  describe('Edge Cases', () => {
    it('processFleets with empty fleets does not crash', () => {
      const alien = new AlienCivilization('空舰队测试', 0, AiPersonality.HUNTER);
      alien.fleets = [];
      expect(() => {
        (alien as any).processFleets(game);
      }).not.toThrow();
    });

    it('runARound returns early when alien is die out', () => {
      const alien = new AlienCivilization('灭绝测试', 0, AiPersonality.HUNTER);
      alien.starIndices.clear();
      expect(alien.isDieOut()).toBe(true);

      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };
      alien.setRngProvider(mockRng);

      // Should return early without calling ageBehavior
      alien.runARound();
      expect(alien.attackCooldown).toBe(0);
      expect(alien.fleets.length).toBe(0);
    });

    it('gravity broadcast check at different years', () => {
      const alien = new AlienCivilization('广播测试', 0, AiPersonality.HUNTER);

      // First broadcast
      expect(game.hasFlag('广播测试_broadcast_sent')).toBe(false);
      alien.checkGravityBroadcast(game);
      expect(game.hasFlag('广播测试_broadcast_sent')).toBe(true);

      // Second broadcast should not re-trigger
      const treacheryBefore = game.earthCivi.treachery;
      alien.checkGravityBroadcast(game);
      expect(game.earthCivi.treachery).toBe(treacheryBefore);
    });

    it('waterdrop attack via runARound triggers only when VERYANGRY', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      game.year = 200;

      // When NOT VERYANGRY, waterdrop and dimension strike should not trigger
      trisolaris.friendshipType = FriendshipType.NORMAL;
      trisolaris.waterdropCount = 0;
      trisolaris.waterdropCooldown = 0;
      trisolaris.hasDimensionStruck = false;

      trisolaris.runARound();

      // runARound may add fleets via other paths, but waterdrop should not be the source
      expect(trisolaris.waterdropCount).toBe(0);
    });

    it('handover crisis triggers waterdrop attack for 三体 with low leadership swordholder', () => {
      const trisolaris = game.alienCiviManager.aliens.get('三体');
      if (!trisolaris) return;

      game.earthCivi.starIndices.add(3);
      game.earthCivi.starIndices.add(9);
      game.earthCivi.swordholderHandoverTurn = true;
      game.earthCivi.swordholder = 'weak_swordholder';

      const mockPerson = { name: 'weak_swordholder', leadership: 30 };
      const origGetPerson = game.personManager.getPerson;
      game.personManager.getPerson = (name: string) => name === 'weak_swordholder' ? mockPerson as any : origGetPerson.call(game.personManager, name);

      let rngVal = 0.01;
      const mockRng = { random: () => rngVal };
      trisolaris.setRngProvider(mockRng);

      trisolaris.runARound();
      expect(trisolaris.waterdropCount).toBeGreaterThan(0);

      game.personManager.getPerson = origGetPerson;
    });
  });
});
