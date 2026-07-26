import { DigitalLife } from '../../core/DigitalLife';
import { EarthCivilization } from '../../core/EarthCivilization';
import { Game } from '../../core/Game';
import { GameEventManager } from '../../core/GameEventManager';
import { FLAG } from '../../core/GameFlags';
import { PlanetEngine } from '../../core/PlanetEngine';
import { EventSystem } from '../../core/subsystems/EventSystem';
import eventsData from '../../data/events.json';
import randomEventsData from '../../data/randomevents.json';

export type FlagEvidenceRole = 'producer' | 'consumer' | 'remover' | 'reference';
export type FlagLinkStatus = 'linked' | 'producer-only' | 'consumer-only' | 'orphan';

export interface FlagEvidence {
  role: FlagEvidenceRole;
  source: string;
  detail: string;
}

export interface FlagReachabilityEntry {
  key: string;
  value: string;
  status: FlagLinkStatus;
  producers: FlagEvidence[];
  consumers: FlagEvidence[];
  removers: FlagEvidence[];
  references: FlagEvidence[];
}

export interface FlagReachabilityReport {
  generatedAt: string;
  totalFlags: number;
  linkedCount: number;
  producerOnlyCount: number;
  consumerOnlyCount: number;
  orphanCount: number;
  entries: FlagReachabilityEntry[];
}

interface ScanTarget {
  label: string;
  ctor: { prototype: object };
}

const SCAN_TARGETS: ScanTarget[] = [
  { label: 'Game', ctor: Game },
  { label: 'GameEventManager', ctor: GameEventManager },
  { label: 'EventSystem', ctor: EventSystem },
  { label: 'EarthCivilization', ctor: EarthCivilization },
  { label: 'PlanetEngine', ctor: PlanetEngine },
  { label: 'DigitalLife', ctor: DigitalLife },
];

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function addEvidence(
  bucket: FlagEvidence[],
  role: FlagEvidenceRole,
  source: string,
  detail: string,
): void {
  if (bucket.some((item) => item.source === source && item.detail === detail)) return;
  bucket.push({ role, source, detail });
}

function tokenPattern(key: string, value: string): string {
  return `(?:FLAG\\.${escapeRegExp(key)}|['"\`]${escapeRegExp(value)}['"\`])`;
}

function scanFunctionSource(entry: FlagReachabilityEntry, sourceName: string, source: string): void {
  const token = tokenPattern(entry.key, entry.value);
  const producer = new RegExp(`(?:addFlag|flagManager\\.set|setAll)\\s*\\([^)]*${token}`, 's');
  const consumer = new RegExp(`(?:hasFlag|flagManager\\.isSet)\\s*\\([^)]*${token}`, 's');
  const remover = new RegExp(`(?:removeFlag|flagManager\\.unset|clearTransientFlags)\\s*\\([^)]*${token}`, 's');
  const anyReference = new RegExp(token);

  if (producer.test(source)) {
    addEvidence(entry.producers, 'producer', sourceName, 'sets or grants the flag');
  }
  if (consumer.test(source)) {
    addEvidence(entry.consumers, 'consumer', sourceName, 'reads the flag as a condition');
  }
  if (remover.test(source)) {
    addEvidence(entry.removers, 'remover', sourceName, 'removes or clears the flag');
  }
  if (anyReference.test(source) && !producer.test(source) && !consumer.test(source) && !remover.test(source)) {
    addEvidence(entry.references, 'reference', sourceName, 'references the flag without a classified read/write call');
  }
}

function scanPrototype(entry: FlagReachabilityEntry, target: ScanTarget): void {
  for (const name of Object.getOwnPropertyNames(target.ctor.prototype)) {
    if (name === 'constructor') continue;
    const descriptor = Object.getOwnPropertyDescriptor(target.ctor.prototype, name);
    const fn = descriptor?.value;
    if (typeof fn !== 'function') continue;
    scanFunctionSource(entry, `${target.label}.${name}`, Function.prototype.toString.call(fn));
  }
}

function classifyDataRole(parentKey: string): FlagEvidenceRole {
  const normalized = parentKey.toLowerCase();
  if (/req|required|condition|unless|forbid|exclude|block|consume/.test(normalized)) {
    return 'consumer';
  }
  if (/remove|unset|clear/.test(normalized)) return 'remover';
  if (/grant|flag|effect|result|target|produce|set/.test(normalized)) return 'producer';
  return 'reference';
}

function scanDataNode(
  entry: FlagReachabilityEntry,
  node: unknown,
  path: string,
  parentKey = '',
): void {
  if (typeof node === 'string') {
    if (node !== entry.value) return;
    const role = classifyDataRole(parentKey);
    const evidence: FlagEvidence = {
      role,
      source: path,
      detail: `data field ${parentKey || '(root)'} contains ${entry.value}`,
    };
    if (role === 'producer') addEvidence(entry.producers, role, evidence.source, evidence.detail);
    else if (role === 'consumer') addEvidence(entry.consumers, role, evidence.source, evidence.detail);
    else if (role === 'remover') addEvidence(entry.removers, role, evidence.source, evidence.detail);
    else addEvidence(entry.references, role, evidence.source, evidence.detail);
    return;
  }

  if (Array.isArray(node)) {
    node.forEach((value, index) => scanDataNode(entry, value, `${path}[${index}]`, parentKey));
    return;
  }

  if (node && typeof node === 'object') {
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      scanDataNode(entry, value, `${path}.${key}`, key);
    }
  }
}

function getStatus(entry: FlagReachabilityEntry): FlagLinkStatus {
  if (entry.producers.length > 0 && entry.consumers.length > 0) return 'linked';
  if (entry.producers.length > 0) return 'producer-only';
  if (entry.consumers.length > 0) return 'consumer-only';
  return 'orphan';
}

export function scanFlagReachability(): FlagReachabilityReport {
  const filteredEvents = new GameEventManager().filteredEvents;
  const entries: FlagReachabilityEntry[] = Object.entries(FLAG).map(([key, value]) => ({
    key,
    value,
    status: 'orphan',
    producers: [],
    consumers: [],
    removers: [],
    references: [],
  }));

  for (const entry of entries) {
    for (const target of SCAN_TARGETS) scanPrototype(entry, target);
    scanDataNode(entry, eventsData, 'events.json');
    scanDataNode(entry, randomEventsData, 'randomevents.json');
    scanDataNode(entry, filteredEvents, 'GameEventManager.filteredEvents');
    entry.status = getStatus(entry);
  }

  entries.sort((a, b) => a.value.localeCompare(b.value));
  return {
    generatedAt: new Date().toISOString(),
    totalFlags: entries.length,
    linkedCount: entries.filter((entry) => entry.status === 'linked').length,
    producerOnlyCount: entries.filter((entry) => entry.status === 'producer-only').length,
    consumerOnlyCount: entries.filter((entry) => entry.status === 'consumer-only').length,
    orphanCount: entries.filter((entry) => entry.status === 'orphan').length,
    entries,
  };
}
