import { EventEffect, EventType, EpochType } from "../types/enums";
import { DialogNode, EventCadenceMeta } from "../types/narrative";

export interface GameEventChoice {
  label: string;
  effects?: any[];
  flags?: string[];
  action?: () => void;
}

export type EpochQuery = string | EpochType;

export interface TriggerCondition {
  epoch?: EpochQuery;
  probability?: number;
  reqTech?: string | null;
  reqFlag?: string;
  reqNotFlag?: string;
  reqNotFlags?: string[];
  lane?: string;
  loreDomain?: string;
  weight?: number;
  cooldownYears?: number;
  maxTriggers?: number;
  tags?: string[];
  severity?: number;
  reqStar?: string;
}

export interface GameEvent {
  id?: string;
  name: string;
  type: EventType;
  inYear: number;
  tip: string;
  effect: EventEffect;
  hasTriggered: boolean;
  dialogNodes: DialogNode[];
  triggerCondition?: TriggerCondition;
  choices?: GameEventChoice[];
  effects?: any[];
  cadenceMeta?: EventCadenceMeta;
  /** 事件触发时自动授予的 flag 列表（替代文案字符串匹配） */
  grantsFlags?: string[];
  /** 事件叙事涉及的当前人物；用于死亡后的事件资格过滤，避免只依赖发言人文本。 */
  characters?: string[];
}

export function createGameEvent(
  name: string,
  type: EventType,
  inYear: number,
  tip: string,
  effect: EventEffect,
  dialogNodes: DialogNode[] = [],
  id?: string,
  triggerCondition?: TriggerCondition,
  choices?: GameEventChoice[],
  effects?: any[],
  grantsFlags?: string[]
): GameEvent {
  return {
    id,
    name,
    type,
    inYear,
    tip,
    effect,
    hasTriggered: false,
    dialogNodes,
    triggerCondition,
    choices,
    effects,
    grantsFlags
  };
}
