import { beforeEach, describe, expect, it } from 'vitest';
import { Game, GameInstance } from '../../core/Game';
import { createGameEvent } from '../../core/GameEvent';
import { FLAG } from '../../core/GameFlags';
import { gameReplacer } from '../../core/GameSerializer';
import { EpochType, EventEffect, EventType, TecTreeType } from '../../types/enums';
import type { GameEventPayload } from '../../types/narrative';

describe('AUDIT-REMEDIATION: 核心因果链回归', () => {
  beforeEach(() => {
    localStorage.clear();
    GameInstance.reset();
  });

  it('新局可以通过智子事件解锁罗辑并完成危机→威慑跃迁', () => {
    const game = new Game();
    game.earthCivi.culture = 250;
    game.year = 10;

    const sophonEvent = game.eventManager.checkEvents(10).find(event => event.inYear === 10 && event.effects?.some(effect => effect.type === 'unlock_person' && effect.target === '罗辑'));
    expect(sophonEvent).toBeDefined();
    expect(game.personManager.availablePersons.has('罗辑')).toBe(false);

    game.applyNewEffects(sophonEvent!.effects || []);
    expect(game.personManager.availablePersons.has('罗辑')).toBe(true);

    game.addFlag('teardrop_arrived');
    game.year = 200;
    const doomsdayEvent = game.eventManager.checkEvents(200).find(event => event.inYear === 200 && event.effects?.some(effect => effect.target === 'doomsday_battle_lost'));
    expect(doomsdayEvent).toBeDefined();
    game.applyNewEffects(doomsdayEvent!.effects || []);

    game.year = 202;
    const deterrenceEvent = game.eventManager.checkEvents(202).find(event => event.inYear === 202 && event.grantsFlags?.includes(FLAG.DETERRENCE_ESTABLISHED));
    expect(deterrenceEvent).toBeDefined();
    expect(deterrenceEvent!.grantsFlags).toContain(FLAG.DETERRENCE_ESTABLISHED);

    game.applyNewEffects(deterrenceEvent!.effects || []);
    expect(game.hasFlag(FLAG.DETERRENCE_ESTABLISHED)).toBe(true);
    expect(game.epoch).toBe(EpochType.DETERRENCE);
  });

  it('真实回合循环在丁仪主线事件后同步更新状态栏纪元', () => {
    const game = new Game();
    game.year = 199;
    game.earthCivi.culture = 300;
    game.earthCivi.isAiBrainEnabled = true;
    game.personManager.unlockPerson('罗辑');
    game.eventManager.events = game.eventManager.events.filter(event => [199, 200, 202].includes(event.inYear));
    game.eventManager.randomEvents = [];
    game.eventManager.filteredEvents = [];
    game.setRngProvider({ random: () => 0 });

    for (let attempt = 0; attempt < 12 && !game.hasFlag(FLAG.DETERRENCE_ESTABLISHED); attempt++) {
      game.runARound();
    }

    expect(game.hasFlag('teardrop_arrived')).toBe(true);
    expect(game.hasFlag('doomsday_battle_lost')).toBe(true);
    expect(game.hasFlag(FLAG.DETERRENCE_ESTABLISHED)).toBe(true);
    expect(game.epoch).toBe(EpochType.DETERRENCE);
  });

  it('丁仪死亡后，带有丁仪人物资格的随机事件不再进入事件池', () => {
    const game = new Game();
    const event = game.eventManager.randomEvents.find(item => item.id === 'dilemma_suicide_of_lead_scientist');
    expect(event).toBeDefined();

    game.eventManager.randomEvents = [event!];
    game.year = 10;
    game.setRngProvider({ random: () => 0 });
    expect(game.eventManager.checkRandomEvents()).toBe(event);

    game.eventManager.randomEventTriggerCounts.clear();
    game.eventManager.lastLaneTriggeredYear.clear();
    game.eventManager.lastAnyEventYear = 0;
    game.applyNewEffects([{ type: 'kill_person', target: '丁仪', value: 0 }]);

    expect(game.personManager.getPerson('丁仪')?.isAlive).toBe(false);
    expect(game.hasFlag('dingyi_dead')).toBe(true);
    expect(game.eventManager.checkRandomEvents()).toBeNull();
  });

  it('待处理选择在保存/读取后仍可执行且只结算一次', () => {
    const game = GameInstance.get();
    const pendingEvent: GameEventPayload = {
      id: 'audit_pending_choice',
      title: '待处理审计事件',
      dialogQueue: [{ speakerName: '系统', content: '请在保存后继续选择。' }],
      choices: [{
        label: '确认',
        effects: [{ type: 'flag', target: 'audit_pending_resolved', value: 1 }],
        action: () => undefined,
      }],
      continuation: { eventEffect: EventEffect.NONE },
    };
    game.currentEvent = pendingEvent;

    GameInstance.saveGame();
    const savedPackage = JSON.parse(localStorage.getItem('Beyond-the-Light-Cone_Save_autosave')!);
    expect(JSON.parse(savedPackage.data).currentEvent.id).toBe('audit_pending_choice');

    expect(GameInstance.loadGame()).toBe(true);
    const loaded = GameInstance.get();
    expect(loaded.currentEvent?.id).toBe('audit_pending_choice');
    expect(typeof loaded.currentEvent?.choices?.[0].action).toBe('function');

    loaded.currentEvent!.choices![0].action();
    expect(loaded.hasFlag('audit_pending_resolved')).toBe(true);
    expect(loaded.currentEvent).toBeNull();
  });

  it('真实剧情选择的 effects 在弹窗存档后仍能恢复', () => {
    const game = GameInstance.get();
    const realChoiceEvent = createGameEvent(
      'audit_real_choice',
      EventType.RANDOM,
      0,
      '保存前停在真实剧情选择。',
      EventEffect.NONE,
      [{ speakerName: '系统', content: '请选择。' }],
      'audit_real_choice',
      undefined,
      [{
        label: '写入 Flag',
        effects: [{ type: 'flag', target: 'audit_real_choice_resolved', value: 1 }],
      }]
    );
    game.eventManager.events = [realChoiceEvent];
    game.eventManager.randomEvents = [];
    game.eventManager.filteredEvents = [];
    game.earthCivi.isAiBrainEnabled = true;

    game.runARound();
    expect(game.currentEvent?.id).toBe('audit_real_choice');
    expect(game.currentEvent?.choices?.[0].effects).toHaveLength(1);

    GameInstance.saveGame();
    expect(GameInstance.loadGame()).toBe(true);
    const loaded = GameInstance.get();
    loaded.currentEvent?.choices?.[0].action();

    expect(loaded.hasFlag('audit_real_choice_resolved')).toBe(true);
    expect(loaded.currentEvent).toBeNull();
  });

  it('读取后私有 Game 引用、Tag 与活动生态链均可继续使用', () => {
    const game = GameInstance.get();
    game.tagManager.applyWorldTag('civil_unrest', 40, 'audit', 0);
    game.ecologyChain.activeChains.push({
      chainId: 'famine_to_population',
      stepId: 'famine_to_population',
      triggeredYear: 0,
      remainingDelay: 2,
      conditionEventId: 'random_famine_event',
      resultEventId: 'random_population_collapse',
    });

    GameInstance.saveGame();
    expect(GameInstance.loadGame()).toBe(true);
    const loaded = GameInstance.get();

    expect(loaded.tagManager.hasTag('civil_unrest')).toBe(true);
    expect(loaded.ecologyChain.getActiveChains()).toHaveLength(1);
    expect(() => loaded.eventManager.checkEvents(loaded.year)).not.toThrow();
    expect(() => loaded.earthCivi.runARound()).not.toThrow();
  });

  it('Game 主循环会把生态链结果按 resultEventId 放入玩家事件队列', () => {
    const game = new Game();
    game.eventManager.events = [];
    game.eventManager.randomEvents = [];
    game.eventManager.filteredEvents = [];
    game.earthCivi.isAiBrainEnabled = true;
    game.setRngProvider({ random: () => 0 });
    game.ecologyChain.activeChains.push({
      chainId: 'famine_to_population',
      stepId: 'famine_to_population',
      triggeredYear: 0,
      remainingDelay: 1,
      conditionEventId: 'random_famine_event',
      resultEventId: 'random_population_collapse',
    });

    game.runARound();

    expect(game.tagManager.hasTag('population_crisis')).toBe(true);
    expect(game.currentEvent?.id).toBe('random_population_collapse');
    expect(game.historyLogs.some(log => log.includes('random_population_collapse'))).toBe(true);
  });

  it('结局预报不会在互斥条件未满足时显示 100%', () => {
    const game = new Game();
    game.year = 260;
    game.epoch = EpochType.BUNKER;
    game.earthCivi.population = 0;
    const aero = game.earthCivi.tecTreeManager.trees.get(TecTreeType.AEROSPACE);
    const interstellar = game.earthCivi.tecTreeManager.trees.get(TecTreeType.INTERSTELLAR);
    aero?.nodes.get('行星发动机Ⅲ型') && (aero.nodes.get('行星发动机Ⅲ型')!.finished = true);
    interstellar?.nodes.get('新家园选址') && (interstellar.nodes.get('新家园选址')!.finished = true);
    game.addFlag(FLAG.WANDERING_COMPLETED);

    const condition = (game as any).getVictoryConditions().find((item: any) => item.type === 'WANDERING');
    expect(condition.check()).toBe(false);
    expect(condition.progress()).toBeLessThan(100);
  });

  it('多槽位 API 可以保存并恢复不同于 autosave 的玩家存档', () => {
    const game = GameInstance.get();
    game.year = 77;
    GameInstance.saveGameToSlot('slot2');
    game.year = 3;

    expect(GameInstance.loadGameFromSlot('slot2')).toBe(true);
    expect(GameInstance.get().year).toBe(77);
  });

  it('黑域固定事件必须同时满足科技且尚未解决', () => {
    const game = new Game();
    game.year = 290;
    game.epoch = EpochType.BUNKER;
    const darkEvent = game.eventManager.events.find(event => event.inYear === 290 && event.triggerCondition?.reqTech === '黑域生成');
    expect(darkEvent?.choices).toHaveLength(2);
    expect(darkEvent?.triggerCondition?.reqTech).toBe('黑域生成');
    expect(darkEvent?.triggerCondition?.reqNotFlag).toBe('dark_domain_resolved');
  });

  it('待处理事件的序列化路径不再排除 currentEvent 与 eventQueue', () => {
    const game = new Game();
    game.currentEvent = { id: 'current', title: 'current', dialogQueue: [] };
    game.eventQueue = [{ id: 'queued', title: 'queued', dialogQueue: [] }];
    const parsed = JSON.parse(JSON.stringify(game, gameReplacer));
    expect(parsed.currentEvent.id).toBe('current');
    expect(parsed.eventQueue[0].id).toBe('queued');
  });
});
