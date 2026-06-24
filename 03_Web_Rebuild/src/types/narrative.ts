import { EventEffect, EventLane, EpochType, LoreDomain } from "./enums";
import type { EpochQuery } from "../core/GameEvent";

export interface EventCadenceMeta {
  lane: EventLane;
  loreDomain: LoreDomain;
  weight: number;
  probability?: number;
  minGapTurns?: number;
  cooldownYears?: number;
  maxTriggers?: number;
  tags?: string[];
  severity?: 1 | 2 | 3 | 4 | 5;
}

export interface DialogNode {
  speakerName: string;
  speakerTitle?: string;
  avatarUrl?: string;
  content: string;
  isCG?: boolean;
}

export interface EventEffectDef {
  type:
    | 'resource'
    | 'flag'
    | 'event_effect'
    | 'techtree'
    | 'diplomacy'
    | 'population'
    | 'unlock_person'
    | 'spawn_barback'
    | 'lock_ratio'
    | 'rush_tech'
    | 'build_infrastructure';
  target: string;
  value: number;
  // 实体化效果扩展字段
  targetStarIndex?: number;
  duration?: number;
  techAmount?: number;
}

export interface EventChoice {
  label: string;
  action: () => void;
  effect?: EventEffect;
  value?: number;
  effects?: EventEffectDef[];
  flags?: string[];
  apCost?: number;
}

export interface GameEventPayload {
  id: string;
  title: string;
  dialogQueue: DialogNode[];
  choices?: EventChoice[];
}

export interface FilteredEventCondition {
  minYear?: number;
  maxYear?: number;
  epoch?: EpochQuery;
  reqTech?: string;
  reqFlag?: string;
  reqNotFlag?: string;
  reqTag?: string;
  reqNotTag?: string;
  minTagIntensity?: number;
  minEconomy?: number;
  maxEconomy?: number;
  minPopulation?: number;
  maxPopulation?: number;
  minCulture?: number;
  maxCulture?: number;
  minDeterrence?: number;
  maxDeterrence?: number;
  minTreachery?: number;
  maxTreachery?: number;
  minMilitary?: number;
  maxMilitary?: number;
  friendshipReq?: { alienName: string; minLevel: number; };
  probability?: number;
  loreDomain?: LoreDomain;
}

export interface FilteredEventPayload {
  id: string;
  title: string;
  dialogQueue: DialogNode[];
  choices?: {
    label: string;
    effects?: EventEffectDef[];
    flags?: string[];
  }[];
  condition: FilteredEventCondition;
  tip: string;
  cooldownYears?: number;
  lastTriggeredYear?: number;
}

export interface VictoryCondition {
  type: string;
  label: string;
  description: string;
  /** 允许触发的纪元窗口期（为空则不限纪元） */
  allowedEras?: EpochType[];
  /** 允许触发的年份窗口期 */
  minYear?: number;
  maxYear?: number;
  check: () => boolean;
}
