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
import { FlagManager } from "./FlagManager";
import { GameInstance } from "./Game";
import type { Game } from "./Game";
import { t } from "../utils/i18n";

/**
 * JSON replacer — 处理 Map/Set 序列化及排除非持久化字段
 */
export function gameReplacer(_key: string, value: any) {
  if (_key === 'currentEvent' || _key === 'eventQueue' || _key === 'isProcessing' || _key === '_rngProvider' || _key === 'turnHistory' ||
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

  // FlagManager 迁移：确保与 flags Set 共享引用
  if (!(inst.flagManager instanceof FlagManager) || inst.flagManager.getInternalSet() !== inst.flags) {
    inst.flagManager = new FlagManager(inst.flags);
  }

  safeSP(inst.earthCivi, EarthCivilization.prototype);
  safeSP(inst.alienCiviManager, AlienCiviManager.prototype);
  safeSP(inst.earthCivi.tecTreeManager, TecTreeManager.prototype);
  safeSP(inst.starManager, StarManager.prototype);
  safeSP(inst.personManager, PersonManager.prototype);
  safeSP(inst.eventManager, GameEventManager.prototype);
  safeSP(inst.planetEngine, PlanetEngine.prototype);
  safeSP(inst.digitalLife, DigitalLife.prototype);

  safeSP(inst.tagManager, TagManager.prototype);
  safeSP(inst.ecologyChain, EcologyChain.prototype);
  safeSP(inst.relationNetwork, RelationNetwork.prototype);
  safeSP(inst.atmosphereEngine, AtmosphereEngine.prototype);
  safeSP(inst.historyGenerator, HistoryGenerator.prototype);
  safeSP(inst.sliceNarrativeEngine, SliceNarrativeEngine.prototype);
  safeSP(inst.eventBus, EventBus.prototype);

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
export function serializeAndSave(inst: Game): void {
  if (inst.historyGenerator) {
    inst.historyGenerator.prune(500);
  }
  inst.addHistory(t("游戏已保存到本地存储。"));
  SaveManager.save(() => JSON.stringify(inst, gameReplacer));
}

/**
 * 加载游戏
 */
export function loadAndDeserialize(
  GameConstructor: new () => Game,
  onSuccess?: () => void,
  onError?: (e: Error) => void
): Game | null {
  try {
    const dataStr = SaveManager.load();
    if (!dataStr) return null;

    const parsedData = JSON.parse(dataStr, reviver);
    const inst = new GameConstructor();

    Object.assign(inst, parsedData);
    restorePrototypes(inst);

    inst.currentEvent = null;
    inst.eventQueue = [];
    inst.isProcessing = false;

    if (!validateSaveIntegrity(inst)) {
      console.error("Save data integrity check failed, resetting game.");
      return null;
    }

    inst.addHistory(t("【系统】游戏读取成功。"));
    if (typeof window !== 'undefined') {
      GameInstance.get().eventBus.emitLegacy('game-loaded');
      GameInstance.get().eventBus.emitLegacy('ticker-message-added');
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

    inst.turnHistory = carryOverHistory;
    inst.isGameOver = false;
    inst.victoryType = null;
    inst.defeatType = null;
    inst.gameOverReason = "";
    inst.isProcessing = false;
    inst.currentEvent = null;
    inst.eventQueue = [];
    inst.isObserverMode = false;

    inst.addHistory(t("【系统】时间线已回溯至分歧点（约 10 回合前）。"));
    if (typeof window !== 'undefined') {
      GameInstance.get().eventBus.emitLegacy('game-loaded');
      GameInstance.get().eventBus.emitLegacy('ticker-message-added');
    }
    return inst;
  } catch (e) {
    console.error("Failed to rollback to fate divergence:", e);
    return null;
  }
}