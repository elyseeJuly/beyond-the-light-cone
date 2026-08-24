/**
 * GameSerializer — 存档序列化与反序列化系统
 *
 * 从 Game.ts 提取的纯静态方法，负责：
 * - JSON 序列化/反序列化（gameReplacer / reviver）
 * - 存档加载时原型恢复（restorePrototypes）
 * - 存档完整性校验（validateSaveIntegrity）
 * - 时间线回滚（rollbackToFateDivergence）
 *
 * 提取目的：降低 Game.ts 行数（从 1900 → ~1700），
 * 将纯工具性质的静态存档逻辑与游戏核心循环分离。
 */

import { StarManager } from "./StarManager";
import { PersonManager } from "./PersonManager";
import { GameEventManager } from "./GameEventManager";
import { EarthCivilization } from "./EarthCivilization";
import { AlienCiviManager, AlienCivilization } from "./AlienCivilization";
import { TecTreeManager } from "./TecTreeManager";
import { TecTree } from "./TecTree";
import { PlanetEngine } from "./PlanetEngine";
import { DigitalLife } from "./DigitalLife";
import { TagManager } from "./TagManager";
import { EcologyChain } from "./EcologyChain";
import { RelationNetwork } from "./RelationNetwork";
import { AtmosphereEngine } from "./AtmosphereEngine";
import { HistoryGenerator } from "./HistoryGenerator";
import { SliceNarrativeEngine } from "./SliceNarrativeEngine";
import { EventBus } from "./EventBus";
import { SaveManager, SaveDataCorruptedError } from "./SaveManager";
import type { SaveSlotId } from "./SaveManager";
import { FlagManager } from "./FlagManager";
import type { Game } from "./Game";
import { EventEffect } from "../types/enums";
import type { EventEffectDef, GameEventPayload } from "../types/narrative";
import { t } from "../utils/i18n";

/**
 * JSON replacer — 处理 Map/Set 序列化及排除非持久化字段
 */
export function gameReplacer(_key: string, value: any) {
  if (_key === 'isProcessing' || _key === '_rngProvider' || _key === 'turnHistory' ||
      _key === 'eventSystem' || _key === 'economySystem' || _key === 'populationSystem' || _key === 'game' ||
      _key === '_hadRunError' || _key === '_yearJustAdvanced' || _key === 'flagManager') {
    return undefined;
  }
  if (value instanceof Map) {
    return { dataType: 'Map', value: Array.from(value.entries()) };
  } else if (value instanceof Set) {
    return { dataType: 'Set', value: Array.from(value) };
  }
  return value;
}

/**
 * JSON reviver — 恢复 Map/Set 实例
 */
export function reviver(_key: string, value: any) {
  if (typeof value === 'object' && value !== null) {
    if (value.dataType === 'Map') {
      return new Map(value.value);
    }
    if (value.dataType === 'Set') {
      return new Set(value.value);
    }
  }
  return value;
}

/**
 * 恢复所有挂载在 Game 实例上的类的原型链
 * 存档通过 JSON.parse 加载后，Object.assign 会丢失原型，
 * 需要重新建立。
 */
export function restorePrototypes(inst: Game): void {
  const safeSP = (obj: any, proto: any) => { if (obj) Object.setPrototypeOf(obj, proto); };
  const revive = <T>(value: any, Class: new (...args: any[]) => T, factory: () => T): T => {
    if (value instanceof Class) return value;
    const restored = factory();
    if (value && typeof value === 'object') Object.assign(restored as any, value);
    return restored;
  };

  // Object.setPrototypeOf 不能创建 ECMAScript private field。对带 #game 的类必须
  // 先用真实构造函数创建实例，再拷贝持久化字段，否则 setGame() 会抛出
  // “private member #game”异常。
  inst.earthCivi = revive(inst.earthCivi, EarthCivilization, () => new EarthCivilization());
  inst.eventManager = revive(inst.eventManager, GameEventManager, () => new GameEventManager());
  inst.alienCiviManager = revive(inst.alienCiviManager, AlienCiviManager, () => new AlienCiviManager());

  // FlagManager 迁移：确保与 flags Set 共享引用
  if (!(inst.flagManager instanceof FlagManager) || inst.flagManager.getInternalSet() !== inst.flags) {
    inst.flagManager = new FlagManager(inst.flags);
  }

  safeSP(inst.earthCivi, EarthCivilization.prototype);
  safeSP(inst.alienCiviManager, AlienCiviManager.prototype);
  safeSP(inst.earthCivi.tecTreeManager, TecTreeManager.prototype);
  safeSP(inst.starManager, StarManager.prototype);
  safeSP(inst.personManager, PersonManager.prototype);

  // 旧存档只有 availablePersons：其中一部分人物可能已经被部门/舰队占用，
  // 但他们仍然是本局已解锁的剧情人物。恢复时把这些占用者并入叙事资格集合，
  // 同时保留 availablePersons 的“当前空闲”语义。
  const personManager = inst.personManager as any;
  if (!(personManager.unlockedPersons instanceof Set)) {
    personManager.unlockedPersons = new Set(personManager.availablePersons instanceof Set
      ? personManager.availablePersons
      : []);
    if (inst.earthCivi?.swordholder) {
      personManager.unlockedPersons.add(inst.earthCivi.swordholder);
    }
    if (inst.earthCivi?.wallfacers instanceof Set) {
      for (const name of inst.earthCivi.wallfacers) personManager.unlockedPersons.add(name);
    }
    if (personManager.persons instanceof Map) {
      for (const [name, person] of personManager.persons.entries()) {
        if (person?.departmentId) personManager.unlockedPersons.add(name);
      }
    }
  }
  safeSP(inst.eventManager, GameEventManager.prototype);
  safeSP(inst.planetEngine, PlanetEngine.prototype);
  safeSP(inst.digitalLife, DigitalLife.prototype);

  if (inst.alienCiviManager?.aliens instanceof Map) {
    for (const [name, rawAlien] of inst.alienCiviManager.aliens.entries()) {
      if (!(rawAlien instanceof AlienCivilization)) {
        const alien = rawAlien as any;
        const restoredAlien = new AlienCivilization(
          alien?.name || name,
          alien?.typeIndex ?? 0,
          alien?.personality ?? 0,
          alien?.starsys ?? 1
        );
        Object.assign(restoredAlien, alien);
        inst.alienCiviManager.aliens.set(name, restoredAlien);
      }
    }
  }

  // 这些 UEE 模块定义了自己的持久化格式。仅设置原型会留下普通数组/对象，
  // 下一回合调用 Map/Set 方法时才暴露错误，因此必须通过 fromJSON 重建实例。
  if (inst.tagManager && !(inst.tagManager instanceof TagManager)) inst.tagManager = TagManager.fromJSON(inst.tagManager);
  if (inst.ecologyChain && !(inst.ecologyChain instanceof EcologyChain)) inst.ecologyChain = EcologyChain.fromJSON(inst.ecologyChain);
  if (inst.relationNetwork && !(inst.relationNetwork instanceof RelationNetwork)) inst.relationNetwork = RelationNetwork.fromJSON(inst.relationNetwork);
  if (inst.atmosphereEngine && !(inst.atmosphereEngine instanceof AtmosphereEngine)) inst.atmosphereEngine = AtmosphereEngine.fromJSON(inst.atmosphereEngine);
  if (inst.historyGenerator && !(inst.historyGenerator instanceof HistoryGenerator)) inst.historyGenerator = HistoryGenerator.fromJSON(inst.historyGenerator);
  if (inst.sliceNarrativeEngine && !(inst.sliceNarrativeEngine instanceof SliceNarrativeEngine)) inst.sliceNarrativeEngine = SliceNarrativeEngine.fromJSON(inst.sliceNarrativeEngine);
  // EventBus 的监听器属于运行时 UI，不可序列化；加载后重新建立空总线。
  inst.eventBus = new EventBus();

  safeSP(inst.tagManager, TagManager.prototype);
  safeSP(inst.ecologyChain, EcologyChain.prototype);
  safeSP(inst.relationNetwork, RelationNetwork.prototype);
  safeSP(inst.atmosphereEngine, AtmosphereEngine.prototype);
  safeSP(inst.historyGenerator, HistoryGenerator.prototype);
  safeSP(inst.sliceNarrativeEngine, SliceNarrativeEngine.prototype);

  // 构造函数注入的私有 Game 引用不会出现在 JSON 中，必须在恢复原型后重新注入。
  inst.earthCivi?.setGame(inst);
  inst.eventManager?.setGame(inst);
  inst.alienCiviManager?.setGame(inst);

  if (inst.digitalLife) {
    if (inst.digitalLife.resurrectedPersons && !(inst.digitalLife.resurrectedPersons instanceof Set)) {
      inst.digitalLife.resurrectedPersons = new Set(inst.digitalLife.resurrectedPersons);
    }
  }

  if (inst.eventManager && (!inst.eventManager.events || inst.eventManager.events.length === 0)) {
    const savedCounts = inst.eventManager.randomEventTriggerCounts;
    const savedFilteredIds = inst.eventManager.triggeredFilteredIds;
    const savedLaneYears = inst.eventManager.lastLaneTriggeredYear;
    const savedTagYears = inst.eventManager.lastTagTriggeredYear;
    const savedAnyYear = inst.eventManager.lastAnyEventYear;
    inst.eventManager.init();
    if (savedCounts) inst.eventManager.randomEventTriggerCounts = savedCounts;
    if (savedFilteredIds) inst.eventManager.triggeredFilteredIds = savedFilteredIds;
    if (savedLaneYears) inst.eventManager.lastLaneTriggeredYear = savedLaneYears;
    if (savedTagYears) inst.eventManager.lastTagTriggeredYear = savedTagYears;
    if (savedAnyYear !== undefined) inst.eventManager.lastAnyEventYear = savedAnyYear;
  }
  if (inst.eventManager) {
    if (!(inst.eventManager.lastLaneTriggeredYear instanceof Map)) {
      inst.eventManager.lastLaneTriggeredYear = new Map(Object.entries(inst.eventManager.lastLaneTriggeredYear || {})) as Map<import('../types/enums').EventLane, number>;
    }
    if (!(inst.eventManager.randomEventTriggerCounts instanceof Map)) {
      inst.eventManager.randomEventTriggerCounts = new Map(Object.entries(inst.eventManager.randomEventTriggerCounts || {}));
    }
    if (!(inst.eventManager.lastTagTriggeredYear instanceof Map)) {
      inst.eventManager.lastTagTriggeredYear = new Map(Object.entries(inst.eventManager.lastTagTriggeredYear || {}));
    }
    if (inst.eventManager.triggeredFilteredIds && !(inst.eventManager.triggeredFilteredIds instanceof Set)) {
      inst.eventManager.triggeredFilteredIds = new Set(inst.eventManager.triggeredFilteredIds);
    }
  }

  if (inst.earthCivi?.tecTreeManager?.trees) {
    for (const tree of inst.earthCivi.tecTreeManager.trees.values()) {
      safeSP(tree, TecTree.prototype);
    }
  }

  if (inst.alienCiviManager?.aliens) {
    for (const alien of inst.alienCiviManager.aliens.values()) {
      safeSP(alien, AlienCivilization.prototype);
    }
  }

  if (inst.starManager?.stars) {
    for (const star of inst.starManager.stars.values()) {
      if (star && !(star as any).buildingProgress) {
        (star as any).buildingProgress = null;
      }
    }
  }

  if (inst.earthCivi?.fleets) {
    for (const fleet of inst.earthCivi.fleets) {
      if (fleet && !fleet.weapons) {
        fleet.weapons = [];
      }
    }
  }
}

/**
 * 从纯数据重建待处理事件。action 闭包不能序列化，但事件效果和 Flag 已由
 * GameEventPayload.continuation / choice.effects 保存，因此可以恢复一个只依赖
 * 当前 Game 实例的可执行 action。
 */
function restoreEventPayload(inst: Game, raw: any): GameEventPayload | null {
  if (!raw || typeof raw !== 'object' || typeof raw.id !== 'string') return null;

  const continuation = raw.continuation && typeof raw.continuation === 'object'
    ? {
        eventEffect: raw.continuation.eventEffect ?? EventEffect.NONE,
        effects: Array.isArray(raw.continuation.effects) ? raw.continuation.effects as EventEffectDef[] : undefined,
        grantsFlags: Array.isArray(raw.continuation.grantsFlags) ? raw.continuation.grantsFlags as string[] : undefined,
        ecologyEventId: typeof raw.continuation.ecologyEventId === 'string' ? raw.continuation.ecologyEventId : undefined,
      }
    : undefined;

  const choices = Array.isArray(raw.choices)
    ? raw.choices.map((choice: any) => ({
        label: String(choice.label ?? t("确认")),
        effects: Array.isArray(choice.effects) ? choice.effects as EventEffectDef[] : undefined,
        flags: Array.isArray(choice.flags) ? choice.flags as string[] : undefined,
        action: () => {
          if (choice.effects) inst.applyNewEffects(choice.effects);
          if (choice.flags) choice.flags.forEach((flag: string) => inst.addFlag(flag));
          if (continuation?.grantsFlags) continuation.grantsFlags.forEach((flag: string) => inst.addFlag(flag));
          if (continuation?.effects) inst.applyNewEffects(continuation.effects);
          inst.syncSwordholderState();
          inst.processEcologyEvent(continuation?.ecologyEventId || raw.id);
          inst.applyEventEffect(continuation?.eventEffect ?? EventEffect.NONE);
        },
      }))
    : undefined;

  return {
    id: raw.id,
    title: String(raw.title ?? ""),
    dialogQueue: Array.isArray(raw.dialogQueue) ? raw.dialogQueue : [],
    choices,
    continuation,
  };
}

function restorePendingEvents(inst: Game): void {
  inst.currentEvent = restoreEventPayload(inst, inst.currentEvent);
  inst.eventQueue = Array.isArray(inst.eventQueue)
    ? inst.eventQueue.map(event => restoreEventPayload(inst, event)).filter((event): event is GameEventPayload => event !== null)
    : [];
}

/**
 * 存档完整性校验
 */
export function validateSaveIntegrity(inst: Game): boolean {
  if (!inst.earthCivi || typeof inst.earthCivi.population !== 'number') return false;
  if (!inst.starManager || !inst.starManager.stars) return false;
  if (!inst.personManager) return false;
  return true;
}

/**
 * 保存游戏
 */
export function serializeAndSave(inst: Game, slotId: SaveSlotId = 'autosave'): void {
  if (inst.historyGenerator) {
    inst.historyGenerator.prune(500);
  }
  inst.addHistory(t("游戏已保存到本地存储。"));
  SaveManager.saveToSlot(slotId, () => JSON.stringify(inst, gameReplacer));
}

/**
 * 加载游戏
 */
export function loadAndDeserialize(
  GameConstructor: new () => Game,
  onSuccess?: () => void,
  onError?: (e: Error) => void,
  slotId: SaveSlotId = 'autosave'
): Game | null {
  try {
    const dataStr = SaveManager.loadFromSlot(slotId);
    if (!dataStr) return null;

    const parsedData = JSON.parse(dataStr, reviver);
    const inst = new GameConstructor();

    Object.assign(inst, parsedData);
    restorePrototypes(inst);
    restorePendingEvents(inst);
    inst.isProcessing = false;

    if (!validateSaveIntegrity(inst)) {
      console.error("Save data integrity check failed, resetting game.");
      return null;
    }

    inst.addHistory(t("【系统】游戏读取成功。"));
    if (typeof window !== 'undefined') {
      inst.eventBus.emitLegacy('game-loaded');
      inst.eventBus.emitLegacy('ticker-message-added');
    }
    onSuccess?.();
    return inst;
  } catch (e) {
    if (e instanceof SaveDataCorruptedError) {
      if (e.message.includes(t("无效的 JSON 格式"))) {
        console.error("Save load failed with invalid JSON format:", e.message);
        return null;
      }
      console.error("Save corruption detected:", e.message);
      throw e;
    }
    console.error("Failed to load game:", e);
    onError?.(e instanceof Error ? e : new Error(String(e)));
    return null;
  }
}

/**
 * 时间线回滚到分歧点（约 10 回合前）
 * 从 turnHistory 快照数据中恢复游戏状态
 */
export function rollbackToFateDivergence(
  GameConstructor: new () => Game,
  turnHistory: string[]
): Game | null {
  if (!turnHistory || turnHistory.length === 0) return null;
  try {
    const dataStr = turnHistory[0];
    const parsedData = JSON.parse(dataStr, reviver);

    const carryOverHistory = [...turnHistory];
    carryOverHistory.shift();

    const inst = new GameConstructor();
    Object.assign(inst, parsedData);
    restorePrototypes(inst);
    restorePendingEvents(inst);

    inst.turnHistory = carryOverHistory;
    inst.isGameOver = false;
    inst.victoryType = null;
    inst.defeatType = null;
    inst.gameOverReason = "";
    inst.isProcessing = false;
    inst.isObserverMode = false;

    inst.addHistory(t("【系统】时间线已回溯至分歧点（约 10 回合前）。"));
    if (typeof window !== 'undefined') {
      inst.eventBus.emitLegacy('game-loaded');
      inst.eventBus.emitLegacy('ticker-message-added');
    }
    return inst;
  } catch (e) {
    console.error("Failed to rollback to fate divergence:", e);
    return null;
  }
}
