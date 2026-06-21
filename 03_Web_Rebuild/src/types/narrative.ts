import { EventEffect, EventLane, LoreDomain } from "./enums";
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
  type: 'resource' | 'flag' | 'event_effect' | 'techtree' | 'diplomacy' | 'population';
  target: string;
  value: number;
}

export interface EventChoice {
  label: string;
  action: () => void;
  effect?: EventEffect;
  value?: number;
  effects?: EventEffectDef[];
  flags?: string[];
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
  minEconomy?: number;
  minPopulation?: number;
  minCulture?: number;
  minDeterrence?: number;
  maxTreachery?: number;
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
  check: () => boolean;
}
