import { describe, it, expect, beforeEach } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { EpochType, EventEffect, FriendshipType, TecTreeType } from '../../types/enums';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('Game Core Extended', () => {
  let game: Game;

  beforeEach(() => {
    game = setupGame();
  });

  describe('初始化', () => {
    it('初始化年份为0', () => {
      expect(game.year).toBe(0);
    });

    it('初始纪元为危机', () => {
      expect(game.epoch).toBe(EpochType.CRISIS);
    });

    it('地球人口初始65', () => {
      expect(game.earthCivi.population).toBe(65);
    });

    it('初始化各管理器非空', () => {
      expect(game.starManager).toBeDefined();
      expect(game.personManager).toBeDefined();
      expect(game.weaponManager).toBeDefined();
      expect(game.eventManager).toBeDefined();
      expect(game.earthCivi).toBeDefined();
      expect(game.alienCiviManager).toBeDefined();
    });

    it('getYear 返回当前年份', () => {
      expect(game.getYear()).toBe(0);
      game.year = 42;
      expect(game.getYear()).toBe(42);
    });

    it('getEpoch 返回当前纪元', () => {
      expect(game.getEpoch()).toBe(EpochType.CRISIS);
    });
  });

  describe('Flag系统', () => {
    it('addFlag 和 hasFlag 工作正常', () => {
      game.addFlag('test_flag_a');
      expect(game.hasFlag('test_flag_a')).toBe(true);
      expect(game.hasFlag('nonexistent')).toBe(false);
    });

    it('removeFlag 移除flag', () => {
      game.addFlag('to_remove');
      expect(game.hasFlag('to_remove')).toBe(true);
      game.removeFlag('to_remove');
      expect(game.hasFlag('to_remove')).toBe(false);
    });

    it('removeFlag 不存在的flag无异常', () => {
      expect(() => game.removeFlag('no_exist')).not.toThrow();
    });
  });

  describe('纪元更替 updateEpoch', () => {
    it('year 0-200 危机纪元', () => {
      game.year = 0;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.CRISIS);
      game.year = 200;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.CRISIS);
    });

    it('year 201-260 威慑纪元', () => {
      game.year = 201;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.DETERRENCE);
    });

    it('year 261-300 广播纪元', () => {
      game.year = 261;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.BROADCAST);
    });

    it('year 301-350 掩体纪元', () => {
      game.year = 301;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.BUNKER);
    });

    it('year 351+ 银河纪元', () => {
      game.year = 351;
      game.updateEpoch();
      expect(game.epoch).toBe(EpochType.GALAXY);
    });

    it('纪元变更时记录历史', () => {
      game.year = 201;
      game.updateEpoch();
      const hasEpochChange = game.historyLogs.some(log => log.includes('纪元更替'));
      expect(hasEpochChange).toBe(true);
    });
  });

  describe('addHistory', () => {
    it('日志格式化包含纪元年份前缀', () => {
      game.addHistory('测试事件');
      const lastLog = game.historyLogs[game.historyLogs.length - 1];
      expect(lastLog).toContain('危机纪元');
      expect(lastLog).toContain('0 年');
      expect(lastLog).toContain('测试事件');
    });
  });

  describe('isSophonBlocked', () => {
    it('year < 10 不受封锁', () => {
      game.year = 5;
      expect(game.isSophonBlocked()).toBe(false);
    });

    it('year >= 10 且三体存在且不友好时受封锁', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.friendshipType = FriendshipType.NORMAL;
        sanTi.starIndices.add(1000);
        expect(game.isSophonBlocked()).toBe(true);
      }
    });

    it('完成550W量子计算机后解除封锁', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.friendshipType = FriendshipType.NORMAL;
        sanTi.starIndices.add(1000);
        const node = game.earthCivi.tecTreeManager.trees
          .get(TecTreeType.INFORMATION)?.getNode('550W量子计算机');
        if (node) node.finished = true;
        expect(game.isSophonBlocked()).toBe(false);
      }
    });

    it('完成智子工程后解除封锁', () => {
      game.year = 15;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        sanTi.friendshipType = FriendshipType.NORMAL;
        sanTi.starIndices.add(1000);
        const node = game.earthCivi.tecTreeManager.trees
          .get(TecTreeType.PHYSICS)?.getNode('智子工程');
        if (node) node.finished = true;
        expect(game.isSophonBlocked()).toBe(false);
      }
    });
  });

  describe('applyEventEffect', () => {
    it('ADDECONEMY 增加经济50', () => {
      const before = game.earthCivi.economy;
      game.applyEventEffect(EventEffect.ADDECONEMY);
      expect(game.earthCivi.economy).toBe(before + 50);
    });

    it('ADDCULTURE 增加文化30', () => {
      const before = game.earthCivi.culture;
      game.applyEventEffect(EventEffect.ADDCULTURE);
      expect(game.earthCivi.culture).toBe(before + 30);
    });

    it('ADDPOP 增加人口20', () => {
      const before = game.earthCivi.population;
      game.applyEventEffect(EventEffect.ADDPOP);
      expect(game.earthCivi.population).toBe(before + 20);
    });

    it('REDUCE_TREACHERY 减少逃亡主义15', () => {
      game.earthCivi.treachery = 50;
      game.applyEventEffect(EventEffect.REDUCE_TREACHERY);
      expect(game.earthCivi.treachery).toBe(35);
    });

    it('REDUCE_TREACHERY 不会低于0', () => {
      game.earthCivi.treachery = 5;
      game.applyEventEffect(EventEffect.REDUCE_TREACHERY);
      expect(game.earthCivi.treachery).toBe(0);
    });

    it('MOON_CRISIS 资源足够时消耗500资源', () => {
      game.earthCivi.resource = 600;
      game.applyEventEffect(EventEffect.MOON_CRISIS);
      expect(game.earthCivi.resource).toBe(100);
    });

    it('MOON_CRISIS 资源不足时人口减半', () => {
      game.earthCivi.population = 100;
      game.earthCivi.resource = 100;
      game.applyEventEffect(EventEffect.MOON_CRISIS);
      expect(game.earthCivi.population).toBe(50);
    });

    it('WANDERING_EARTH 有技术时成功启动', () => {
      const node = game.earthCivi.tecTreeManager.trees
        .get(TecTreeType.AEROSPACE)?.getNode('行星发动机Ⅲ型');
      if (node) node.finished = true;
      game.applyEventEffect(EventEffect.WANDERING_EARTH);
      const log = game.historyLogs.find(l => l.includes('流浪地球计划启动'));
      expect(log).toBeDefined();
    });

    it('WANDERING_EARTH 无技术时失败', () => {
      game.applyEventEffect(EventEffect.WANDERING_EARTH);
      const log = game.historyLogs.find(l => l.includes('缺少行星发动机技术'));
      expect(log).toBeDefined();
    });
  });

  describe('applyNewEffects', () => {
    it('resource类型 economy target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'economy', value: 50 }]);
      expect(game.earthCivi.economy).toBe(150);
    });

    it('resource类型 负值不影响为负', () => {
      game.applyNewEffects([{ type: 'resource', target: 'economy', value: -200 }]);
      expect(game.earthCivi.economy).toBe(0);
    });

    it('resource类型 population target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'population', value: 10 }]);
      expect(game.earthCivi.population).toBe(75);
    });

    it('resource类型 culture target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'culture', value: 20 }]);
      expect(game.earthCivi.culture).toBe(20);
    });

    it('resource类型 prestige target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'prestige', value: 30 }]);
      expect(game.earthCivi.deterrenceValue).toBe(30);
    });

    it('resource类型 resource target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'resource', value: 100 }]);
      expect(game.earthCivi.resource).toBe(300);
    });

    it('resource类型 army target', () => {
      game.applyNewEffects([{ type: 'resource', target: 'army', value: 5 }]);
      expect(game.earthCivi.army).toBe(15);
    });

    it('resource类型 treachery target 有上限100', () => {
      game.applyNewEffects([{ type: 'resource', target: 'treachery', value: 200 }]);
      expect(game.earthCivi.treachery).toBe(100);
    });

    it('flag类型 添加flag', () => {
      game.applyNewEffects([{ type: 'flag', target: 'new_flag', value: 1 }]);
      expect(game.hasFlag('new_flag')).toBe(true);
    });

    it('unlock_person类型 解锁人物', () => {
      game.applyNewEffects([{ type: 'unlock_person', target: '罗辑' }]);
      expect(game.personManager.availablePersons.has('罗辑')).toBe(true);
    });

    it('diplomacy类型 调整外交关系', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi) {
        const before = sanTi.friendshipType;
        game.applyNewEffects([{ type: 'diplomacy', target: '三体', value: 1 }]);
        expect(sanTi.friendshipType).toBe(before + 1);
      }
    });

    it('military target 创建舰队', () => {
      const before = game.earthCivi.fleets.length;
      game.applyNewEffects([{ type: 'resource', target: 'military', value: 2 }]);
      expect(game.earthCivi.fleets.length).toBe(before + 2);
    });

    it('空effects不崩', () => {
      expect(() => game.applyNewEffects(null as any)).not.toThrow();
      expect(() => game.applyNewEffects([])).not.toThrow();
    });
  });

  describe('conductDiplomacy', () => {
    it('不存在的文明无法外交', () => {
      const msg = game.conductDiplomacy('不存在的文明', 'negotiate');
      expect(msg).toContain('无法与已灭亡');
    });

    it('negotiate 提升关系', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        const before = sanTi.friendshipType;
        const msg = game.conductDiplomacy('三体', 'negotiate');
        expect(msg).toContain('关系提升');
        expect(sanTi.friendshipType).toBe(before + 1);
      }
    });

    it('trade 需要30经济', () => {
      game.earthCivi.economy = 20;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        const msg = game.conductDiplomacy('三体', 'trade');
        expect(msg).toContain('不足以');
      }
    });

    it('trade 成功交易', () => {
      game.earthCivi.economy = 100;
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        const msg = game.conductDiplomacy('三体', 'trade');
        expect(msg).toContain('贸易交换');
      }
    });

    it('provoke 恶化关系', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        sanTi.friendshipType = FriendshipType.NORMAL;
        game.conductDiplomacy('三体', 'provoke');
        expect(sanTi.friendshipType).toBe(FriendshipType.ANGRY);
      }
    });

    it('外交冷却机制', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        game.conductDiplomacy('三体', 'negotiate');
        expect(sanTi.diplomacyCooldown).toBe(3);
        const msg = game.conductDiplomacy('三体', 'negotiate');
        expect(msg).toContain('冷却');
      }
    });

    it('unknown action 返回未知', () => {
      const sanTi = game.alienCiviManager.aliens.get('三体');
      if (sanTi && !sanTi.isDieOut()) {
        sanTi.starIndices.add(1000);
        const msg = game.conductDiplomacy('三体', 'weird_action');
        expect(msg).toContain('未知的外交行动');
      }
    });
  });

  describe('updateCiviLevel', () => {
    it('culture >= 1000 霸王等级', () => {
      game.earthCivi.culture = 1000;
      game.updateCiviLevel(0);
      expect(game.earthCivi.civiLevel).toBe(4);
    });

    it('culture >= 500 逐鹿等级', () => {
      game.earthCivi.culture = 500;
      game.updateCiviLevel(0);
      expect(game.earthCivi.civiLevel).toBe(3);
    });

    it('culture >= 200 风暴等级', () => {
      game.earthCivi.culture = 200;
      game.updateCiviLevel(0);
      expect(game.earthCivi.civiLevel).toBe(2);
    });

    it('culture >= 70 起源等级', () => {
      game.earthCivi.culture = 70;
      game.updateCiviLevel(0);
      expect(game.earthCivi.civiLevel).toBe(1);
    });

    it('culture < 70 荒蛮等级', () => {
      game.earthCivi.culture = 30;
      game.updateCiviLevel(0);
      expect(game.earthCivi.civiLevel).toBe(0);
    });
  });

  describe('gameOver 条件', () => {
    it('人口<=0 时游戏结束', () => {
      game.earthCivi.population = 0;
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(true);
    });

    it('逃亡主义>=100 时游戏结束', () => {
      game.earthCivi.treachery = 100;
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(true);
    });

    it('year > 350 无逃逸科技触发终局失败', () => {
      game.year = 360;
      game.epoch = EpochType.GALAXY;
      game.loreMode = 'liu_cixin_mixed';
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.gameOverReason).toContain('太阳氦闪');
    });

    it('strict模式 year > 350 无逃逸科技触发二向箔打击', () => {
      game.year = 360;
      game.epoch = EpochType.GALAXY;
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(true);
      expect(game.gameOverReason).toContain('二向箔打击');
    });

    it('有逃逸能力后 year > 350 不触发终局失败', () => {
      game.year = 360;
      game.epoch = EpochType.GALAXY;
      game.addFlag("dimensional_defense");
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(false);
    });

    it('征服胜利 所有异星被征服', () => {
      for (const alien of game.alienCiviManager.aliens.values()) {
        alien.isBund = true;
      }
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(true);
    });

    it('初始状态不触发游戏结束', () => {
      game.checkGameOverConditions();
      expect(game.isGameOver).toBe(false);
    });
  });

  describe('processNextEvent', () => {
    it('eventQueue为空时不设置currentEvent', () => {
      game.currentEvent = null;
      game.eventQueue = [];
      game.processNextEvent();
      expect(game.currentEvent).toBeNull();
    });

    it('eventQueue有事件时弹出并设为currentEvent', () => {
      game.currentEvent = null;
      game.eventQueue = [{ id: 'test', title: '测试', dialogQueue: [] }];
      game.processNextEvent();
      expect(game.currentEvent).not.toBeNull();
      expect(game.currentEvent!.id).toBe('test');
      expect(game.eventQueue.length).toBe(0);
    });

    it('currentEvent非空时不处理队列', () => {
      const existing = { id: 'existing', title: '已有的', dialogQueue: [] };
      game.currentEvent = existing;
      game.eventQueue = [{ id: 'next', title: '下一个', dialogQueue: [] }];
      game.processNextEvent();
      expect(game.currentEvent).toBe(existing);
    });
  });

  describe('isProcessing 锁', () => {
    it('isProcessing为true时runARound被阻止', () => {
      game.isProcessing = true;
      game.runARound();
      expect(game.year).toBe(0);
    });

    it('gameOver时runARound被阻止', () => {
      game.isGameOver = true;
      game.runARound();
      expect(game.year).toBe(0);
    });

    it('有currentEvent时runARound提示处理', () => {
      game.currentEvent = { id: 'test', title: '测试', dialogQueue: [] };
      game.runARound();
      expect(game.year).toBe(0);
      const hasPrompt = game.historyLogs.some(l => l.includes('处理当前的剧情事件'));
      expect(hasPrompt).toBe(true);
    });
  });

  describe('runARound 流程', () => {
    it('正常推进回合 年份+1', () => {
      game.runARound();
      expect(game.year).toBe(1);
    });

    it('回合推进后历史日志增加', () => {
      const before = game.historyLogs.length;
      game.runARound();
      expect(game.historyLogs.length).toBeGreaterThan(before);
    });
  });
});