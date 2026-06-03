import { EventEffect, EventType, EpochType } from "../types/enums";
import { DialogNode, EventCadenceMeta } from "../types/narrative";

export interface GameEventChoice {
  label: string;
  effects?: any[];
  action?: () => void;
}

export interface TriggerCondition {
  epoch?: string | EpochType;
  probability?: number;
  reqTech?: string | null;
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
  effects?: any[]
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
    effects
  };
}


