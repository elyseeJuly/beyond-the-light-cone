import { EventLane, LoreDomain, LoreMode } from "../types/enums";
import { EventCadenceMeta } from "../types/narrative";
import type { GameEvent } from "./GameEvent";

export const DEFAULT_AMBIENT_META: EventCadenceMeta = {
  lane: 'ambient',
  loreDomain: 'three_body_canon',
  weight: 1,
  probability: 0.02,
  maxTriggers: 1,
  cooldownYears: 4
};

export const EVENT_LANE_WEIGHTS: Record<EventLane, number> = {
  milestone: 999,
  crisis: 100,
  major: 50,
  character: 30,
  ambient: 1
};

export const EVENT_BUDGET = {
  maxEventsPerTurn: 1,
  minGapAfterAnyEvent: 2,
  minGapAfterMajorEvent: 5,
  ambientGlobalCooldown: 4,
  majorGlobalCooldown: 12
} as const;

export function normalizeEventMeta(event: GameEvent): GameEvent {
  if (!event.cadenceMeta) {
    if (event.triggerCondition) {
      event.cadenceMeta = {
        lane: (event.triggerCondition as any).lane || 'ambient',
        loreDomain: (event.triggerCondition as any).loreDomain || 'three_body_canon',
        weight: (event.triggerCondition as any).weight || 1,
        probability: event.triggerCondition.probability,
        cooldownYears: (event.triggerCondition as any).cooldownYears,
        maxTriggers: (event.triggerCondition as any).maxTriggers,
        tags: (event.triggerCondition as any).tags,
        severity: (event.triggerCondition as any).severity
      };
    } else {
      event.cadenceMeta = { ...DEFAULT_AMBIENT_META };
    }
  }

  if (event.cadenceMeta.lane === 'milestone' && event.inYear && event.inYear > 0) {
    event.cadenceMeta.probability = 1.0;
  }

  return event;
}

export function isEventEligible(
  event: GameEvent,
  game: any,
  laneCooldowns: Map<EventLane, number>,
  triggerCounts: Map<string, number>,
  lastAnyEventYear: number
): boolean {
  const meta = event.cadenceMeta || normalizeEventMeta(event).cadenceMeta!;

  if (meta.maxTriggers !== undefined) {
    const count = triggerCounts.get(event.id || event.name) || 0;
    if (count >= meta.maxTriggers) return false;
  }

  if (meta.lane && laneCooldowns.has(meta.lane)) {
    const lastYear = laneCooldowns.get(meta.lane)!;
    const gap = game.year - lastYear;
    if (meta.cooldownYears && gap < meta.cooldownYears) return false;
  }

  if (lastAnyEventYear > 0 && EVENT_BUDGET.minGapAfterAnyEvent > 0) {
    if (game.year - lastAnyEventYear < EVENT_BUDGET.minGapAfterAnyEvent) return false;
  }

  if (game.loreMode === 'strict_three_body' && meta.loreDomain && meta.loreDomain !== 'three_body_canon') {
    return false;
  }

  return true;
}

export function scoreEvent(
  event: GameEvent,
  _game: any,
  _state: any
): number {
  const meta = event.cadenceMeta;
  if (!meta) return 1;

  const laneWeight = EVENT_LANE_WEIGHTS[meta.lane] || 1;
  const eventWeight = meta.weight || 1;
  const severity = meta.severity || 1;

  return laneWeight * eventWeight * severity;
}

export function pickWeightedEvent(
  candidates: GameEvent[],
  rng: () => number
): GameEvent | null {
  if (candidates.length === 0) return null;

  candidates.sort((a, b) => (b.cadenceMeta?.weight || 1) - (a.cadenceMeta?.weight || 1));

  let totalWeight = 0;
  const weights = candidates.map(c => {
    const w = (c.cadenceMeta?.weight || 1) * (c.cadenceMeta?.probability ?? 0.02);
    totalWeight += w;
    return w;
  });

  if (totalWeight <= 0) return null;

  let roll = rng() * totalWeight;
  for (let i = 0; i < candidates.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return candidates[i];
  }

  return candidates[candidates.length - 1];
}

export function shouldTriggerInLoreMode(loreDomain: LoreDomain, loreMode: LoreMode): boolean {
  if (loreMode === 'sandbox') return true;
  if (loreMode === 'strict_three_body') return loreDomain === 'three_body_canon';
  return true;
}