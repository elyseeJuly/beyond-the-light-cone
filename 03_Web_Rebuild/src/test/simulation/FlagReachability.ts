import { FLAG } from '../../core/GameFlags';

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
  scannedFileCount: number;
  linkedCount: number;
  producerOnlyCount: number;
  consumerOnlyCount: number;
  orphanCount: number;
  entries: FlagReachabilityEntry[];
}

const RAW_SOURCE_MODULES = import.meta.glob(
  ['../../**/*.{ts,tsx,json}', '!../../test/**/*'],
  { eager: true, query: '?raw', import: 'default' },
) as Record<string, string>;

const SOURCE_MODULES = Object.entries(RAW_SOURCE_MODULES)
  .filter(([path]) => !path.endsWith('/GameFlags.ts'))
  .sort(([left], [right]) => left.localeCompare(right));

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

function lineNumberAt(source: string, index: number): number {
  let line = 1;
  for (let cursor = 0; cursor < index; cursor++) {
    if (source.charCodeAt(cursor) === 10) line++;
  }
  return line;
}

function classifyOccurrence(prefix: string): FlagEvidenceRole[] {
  const roles: FlagEvidenceRole[] = [];

  const producerCall = /(?:addFlag|flagManager\.set|setAll)\s*\([^)]*$/s;
  const producerArray = /(?:grantsFlags|flags)\s*:\s*\[[^\]]*$/s;
  const producerEffect = /(?:type\s*:\s*['"]flag['"]|['"]type['"]\s*:\s*['"]flag['"])[^}\]]*(?:target\s*:|['"]target['"]\s*:)\s*$/s;
  if (producerCall.test(prefix) || producerArray.test(prefix) || producerEffect.test(prefix)) {
    roles.push('producer');
  }

  const consumerCall = /(?:hasFlag|flagManager\.isSet)\s*\([^)]*$/s;
  const consumerField = /(?:reqFlag|reqNotFlag|requiredFlag|requiredFlags|forbiddenFlag|forbiddenFlags|conditionFlag|conditionFlags|unlessFlag|blockFlag)\s*:\s*(?:\[[^\]]*)?$/s;
  const consumerJsonField = /['"](?:reqFlag|reqNotFlag|requiredFlag|requiredFlags|forbiddenFlag|forbiddenFlags|conditionFlag|conditionFlags|unlessFlag|blockFlag)['"]\s*:\s*(?:\[[^\]]*)?$/s;
  if (consumerCall.test(prefix) || consumerField.test(prefix) || consumerJsonField.test(prefix)) {
    roles.push('consumer');
  }

  const removerCall = /(?:removeFlag|flagManager\.unset|clearTransientFlags)\s*\([^)]*$/s;
  const removerField = /(?:removeFlags|unsetFlags|clearFlags)\s*:\s*\[[^\]]*$/s;
  if (removerCall.test(prefix) || removerField.test(prefix)) {
    roles.push('remover');
  }

  return roles.length > 0 ? roles : ['reference'];
}

function scanSource(entry: FlagReachabilityEntry, path: string, source: string): void {
  const matcher = new RegExp(tokenPattern(entry.key, entry.value), 'g');
  let match: RegExpExecArray | null;

  while ((match = matcher.exec(source)) !== null) {
    const prefixStart = Math.max(0, match.index - 260);
    const prefix = source.slice(prefixStart, match.index);
    const line = lineNumberAt(source, match.index);
    const normalizedPath = path.replace(/^\.\.\/\.\.\//, 'src/');
    const detail = `line ${line}: ${match[0]}`;
    const roles = classifyOccurrence(prefix);

    for (const role of roles) {
      if (role === 'producer') addEvidence(entry.producers, role, normalizedPath, detail);
      else if (role === 'consumer') addEvidence(entry.consumers, role, normalizedPath, detail);
      else if (role === 'remover') addEvidence(entry.removers, role, normalizedPath, detail);
      else addEvidence(entry.references, role, normalizedPath, detail);
    }

    if (match[0].length === 0) matcher.lastIndex++;
  }
}

function getStatus(entry: FlagReachabilityEntry): FlagLinkStatus {
  if (entry.producers.length > 0 && entry.consumers.length > 0) return 'linked';
  if (entry.producers.length > 0) return 'producer-only';
  if (entry.consumers.length > 0) return 'consumer-only';
  return 'orphan';
}

export function scanFlagReachability(): FlagReachabilityReport {
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
    for (const [path, source] of SOURCE_MODULES) {
      scanSource(entry, path, source);
    }
    entry.status = getStatus(entry);
  }

  entries.sort((a, b) => a.value.localeCompare(b.value));
  return {
    generatedAt: new Date().toISOString(),
    totalFlags: entries.length,
    scannedFileCount: SOURCE_MODULES.length,
    linkedCount: entries.filter((entry) => entry.status === 'linked').length,
    producerOnlyCount: entries.filter((entry) => entry.status === 'producer-only').length,
    consumerOnlyCount: entries.filter((entry) => entry.status === 'consumer-only').length,
    orphanCount: entries.filter((entry) => entry.status === 'orphan').length,
    entries,
  };
}
