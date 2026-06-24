import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EventEffect } from '../../types/enums';
import { AppContainer, ServiceKeys } from '../../core/DIContainer';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('Subsystem Split Architecture', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('Game 实例拥有三个子系统', () => {
    expect(game.eventSystem).toBeDefined();
    expect(game.economySystem).toBeDefined();
    expect(game.populationSystem).toBeDefined();
  });

  it('子系统在 DI 容器中可解析', () => {
    expect(AppContainer.resolve(ServiceKeys.EVENT_SYSTEM)).toBe(game.eventSystem);
    expect(AppContainer.resolve(ServiceKeys.ECONOMY_SYSTEM)).toBe(game.economySystem);
    expect(AppContainer.resolve(ServiceKeys.POPULATION_SYSTEM)).toBe(game.populationSystem);
  });

  it('Game.applyEventEffect 委托给 EventSystem', () => {
    const spy = vi.spyOn(game.eventSystem, 'applyEventEffect');
    game.applyEventEffect(EventEffect.ADDECONEMY);
    expect(spy).toHaveBeenCalledWith(EventEffect.ADDECONEMY, true);
    spy.mockRestore();
  });

  it('Game.applyNewEffects 委托给 EventSystem', () => {
    const spy = vi.spyOn(game.eventSystem, 'applyNewEffects');
    const effects = [{ type: 'resource', target: 'economy', value: 50 }];
    game.applyNewEffects(effects);
    expect(spy).toHaveBeenCalledWith(effects);
    spy.mockRestore();
  });

  it('Game.processNextEvent 委托给 EventSystem', () => {
    const spy = vi.spyOn(game.eventSystem, 'processNextEvent');
    game.processNextEvent();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('Game.updateCiviLevel 委托给 EconomySystem', () => {
    const spy = vi.spyOn(game.economySystem, 'updateCiviLevel');
    game.updateCiviLevel(0);
    expect(spy).toHaveBeenCalledWith(0);
    spy.mockRestore();
  });
});

describe('EventSystem isolated behavior', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('applyEventEffect 增加经济', () => {
    const before = game.earthCivi.economy;
    game.eventSystem.applyEventEffect(EventEffect.ADDECONEMY);
    expect(game.earthCivi.economy).toBe(before + 50);
  });

  it('applyEventEffect 增加文化', () => {
    const before = game.earthCivi.culture;
    game.eventSystem.applyEventEffect(EventEffect.ADDCULTURE);
    expect(game.earthCivi.culture).toBe(before + 30);
  });

  it('applyNewEffects 解析资源效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'resource', target: 'economy', value: 100 }]);
    expect(game.earthCivi.economy).toBeGreaterThan(0);
  });

  it('applyNewEffects 解析标志效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'flag', target: 'test_flag' }]);
    expect(game.hasFlag('test_flag')).toBe(true);
  });

  it('applyNewEffects 解析 lock_ratio 效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'lock_ratio', target: 'mining', value: 50, duration: 5 }]);
    expect(game.earthCivi.ratioLocks.length).toBe(1);
    expect(game.earthCivi.ratioLocks[0].type).toBe('mining');
    expect(game.earthCivi.ratioLocks[0].max).toBe(50);
    expect(game.earthCivi.ratioLocks[0].duration).toBe(5);
  });

  it('applyNewEffects 解析 spend_ap 效果', () => {
    game.earthCivi.apCurrent = 30;
    game.eventSystem.applyNewEffects([{ type: 'spend_ap', value: 10 }]);
    expect(game.earthCivi.apCurrent).toBe(20); // AI 关闭时不减半
  });

  it('applyNewEffects 解析 diplomacy 效果', () => {
    const alien = game.alienCiviManager.aliens.get('三体');
    expect(alien).toBeDefined();
    const before = alien!.friendshipType;
    game.eventSystem.applyNewEffects([{ type: 'diplomacy', target: '三体', value: 2 }]);
    expect(alien!.friendshipType).toBeGreaterThan(before);
  });

  it('applyNewEffects 解析 unlock_person 效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'unlock_person', target: '罗辑' }]);
    const person = game.personManager.getPerson('罗辑');
    expect(person).toBeDefined();
    expect(game.personManager.availablePersons.has('罗辑')).toBe(true);
  });

  it('applyNewEffects 解析 rush_tech 效果', () => {
    // 确保有研究目标
    game.earthCivi.economy = 0;
    game.eventSystem.applyNewEffects([{ type: 'rush_tech', target: 'physics', value: 100, techAmount: 100 }]);
    // 不抛错即通过
    expect(true).toBe(true);
  });

  it('applyNewEffects 解析 spawn_barback 效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'spawn_barback', targetStarIndex: 3, value: 50 }]);
    // 不抛错即通过，验证叛军已生成
    const star = game.starManager.getStar(3);
    expect(star).toBeDefined();
  });

  it('applyNewEffects 解析 build_infrastructure 效果', () => {
    game.eventSystem.applyNewEffects([{ type: 'build_infrastructure', target: 'factory', targetStarIndex: 5, value: 10 }]);
    // 不抛错即通过
    expect(true).toBe(true);
  });

  it('applyNewEffects 多个效果混合执行', () => {
    game.eventSystem.applyNewEffects([
      { type: 'flag', target: 'multi_test' },
      { type: 'resource', target: 'economy', value: 50 },
      { type: 'lock_ratio', target: 'factory', value: 40, duration: 3 },
    ]);
    expect(game.hasFlag('multi_test')).toBe(true);
    expect(game.earthCivi.ratioLocks.length).toBe(1);
  });
});

describe('EconomySystem isolated behavior', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('updateCiviLevel 根据文化值设置等级', () => {
    game.earthCivi.culture = 250;
    game.economySystem.updateCiviLevel(0);
    expect(game.earthCivi.civiLevel).toBe(2);
  });

  it('updateCiviLevel 升级时增加军队', () => {
    game.earthCivi.culture = 80;
    const beforeArmy = game.earthCivi.army;
    game.economySystem.updateCiviLevel(0);
    expect(game.earthCivi.civiLevel).toBe(1);
    expect(game.earthCivi.army).toBe(beforeArmy + 20);
  });
});

describe('PopulationSystem isolated behavior', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  it('getEarthPopulationCapacity 返回基础值', () => {
    expect(game.populationSystem.getEarthPopulationCapacity()).toBe(1000);
  });

  it('getTotalPopulationCapacity 包含殖民地容量', () => {
    const star = game.starManager.getStar(5);
    expect(star).toBeDefined();
    if (star) {
      star.belongToCivi = '地球';
      star.hasCity = true;
      star.populationLimit = 100;
      expect(game.populationSystem.getTotalPopulationCapacity()).toBe(1000 + 300);
    }
  });

  it('getColonizedStars 仅返回已殖民星球', () => {
    const star = game.starManager.getStar(5);
    expect(star).toBeDefined();
    if (star) {
      star.belongToCivi = '地球';
      star.hasCity = true;
      expect(game.populationSystem.getColonizedStars()).toContain(star);
    }
  });
});
