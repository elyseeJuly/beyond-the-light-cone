import { GameInstance } from '../../core/Game';
import { FLAG } from '../../core/GameFlags';
import { DefeatType, EpochType, NeutralType, VictoryType } from '../../types/enums';
import { scanFlagReachability, type FlagReachabilityReport } from './FlagReachability';
import type { SimulationSuiteSummary } from './SimulationSuite';

export interface ReachabilityReport {
  generatedAt: string;
  runCount: number;
  policyCounts: Record<string, number>;
  terminationCounts: Record<string, number>;
  known: {
    events: string[];
    flags: string[];
    epochs: number[];
    endings: string[];
  };
  observed: {
    events: string[];
    flags: string[];
    epochs: number[];
    endings: string[];
  };
  unobserved: {
    events: string[];
    flags: string[];
    epochs: number[];
    endings: string[];
  };
  unknownObservedEvents: string[];
  flagScan: FlagReachabilityReport;
  failures: Array<{
    seed: number;
    policyId: string;
    terminationReason: string;
    replayCommand: string;
    violations: string[];
  }>;
}

function uniqueSorted(values: Iterable<string>): string[] {
  return [...new Set(values)].sort();
}

function numericEnumValues(enumObject: Record<string, string | number>, count: number): number[] {
  return Object.values(enumObject)
    .filter((value): value is number => typeof value === 'number' && value >= 0 && value < count)
    .sort((a, b) => a - b);
}

function enumNames(enumObject: Record<string, string | number>, countKey = 'COUNT'): string[] {
  return Object.keys(enumObject)
    .filter((key) => Number.isNaN(Number(key)) && key !== countKey)
    .sort();
}

function collectKnownEventIds(): string[] {
  GameInstance.reset();
  const game = GameInstance.get();
  const ids = new Set<string>();
  const register = (event: { id?: string; name?: string; title?: string }): void => {
    const id = event.id || event.name || event.title;
    if (id) ids.add(id);
  };

  game.eventManager.events.forEach(register);
  game.eventManager.randomEvents.forEach(register);
  game.eventManager.filteredEvents.forEach(register);
  for (let epoch = EpochType.GOLDEN; epoch < EpochType.COUNT; epoch++) {
    ids.add(`event_epoch_transition_${epoch}`);
  }
  return [...ids].sort();
}

function difference(known: string[], observed: string[]): string[] {
  const observedSet = new Set(observed);
  return known.filter((value) => !observedSet.has(value));
}

export function buildReachabilityReport(summary: SimulationSuiteSummary): ReachabilityReport {
  const observedEvents = uniqueSorted(summary.results.flatMap((result) => result.coverage.observedEventIds));
  const observedFlags = uniqueSorted(summary.results.flatMap((result) => result.coverage.observedFlags));
  const observedEpochs = [...new Set(summary.results.flatMap((result) => result.coverage.observedEpochs))]
    .sort((a, b) => a - b);
  const observedEndings = uniqueSorted(summary.results.flatMap((result) => result.coverage.observedEndings));

  const knownEvents = collectKnownEventIds();
  const knownFlags = uniqueSorted(Object.values(FLAG));
  const knownEpochs = numericEnumValues(EpochType, EpochType.COUNT);
  const knownEndings = [
    ...enumNames(VictoryType).map((name) => `victory:${name}`),
    ...enumNames(DefeatType, '__none__').map((name) => `defeat:${name}`),
    ...enumNames(NeutralType).map((name) => `neutral:${name}`),
  ].sort();

  const knownEventSet = new Set(knownEvents);
  return {
    generatedAt: new Date().toISOString(),
    runCount: summary.totalRuns,
    policyCounts: summary.policyCounts,
    terminationCounts: summary.terminationCounts,
    known: {
      events: knownEvents,
      flags: knownFlags,
      epochs: knownEpochs,
      endings: knownEndings,
    },
    observed: {
      events: observedEvents,
      flags: observedFlags,
      epochs: observedEpochs,
      endings: observedEndings,
    },
    unobserved: {
      events: difference(knownEvents, observedEvents),
      flags: difference(knownFlags, observedFlags),
      epochs: knownEpochs.filter((epoch) => !observedEpochs.includes(epoch)),
      endings: difference(knownEndings, observedEndings),
    },
    unknownObservedEvents: observedEvents.filter((eventId) => !knownEventSet.has(eventId)),
    flagScan: scanFlagReachability(),
    failures: summary.failures.map((failure) => ({
      seed: failure.seed,
      policyId: failure.policyId,
      terminationReason: failure.terminationReason,
      replayCommand: failure.replayCommand,
      violations: failure.violations.map((violation) => `${violation.id}: ${violation.message}`),
    })),
  };
}

function markdownList(values: Array<string | number>, empty = '无'): string {
  return values.length > 0 ? values.map((value) => `- \`${value}\``).join('\n') : `- ${empty}`;
}

export function renderReachabilityMarkdown(report: ReachabilityReport): string {
  const coverageRow = (label: string, observed: number, known: number): string => {
    const ratio = known > 0 ? `${((observed / known) * 100).toFixed(1)}%` : 'n/a';
    return `| ${label} | ${observed} | ${known} | ${ratio} |`;
  };

  const flagIssues = report.flagScan.entries
    .filter((entry) => entry.status !== 'linked')
    .map((entry) => `| \`${entry.value}\` | ${entry.status} | ${entry.producers.length} | ${entry.consumers.length} |`)
    .join('\n') || '| — | 无 | 0 | 0 |';

  return `# Headless Simulation Reachability Report

> Generated: ${report.generatedAt}  
> Runs: ${report.runCount}

## Coverage summary

| Domain | Observed | Known | Ratio |
|---|---:|---:|---:|
${coverageRow('Events', report.observed.events.length, report.known.events.length)}
${coverageRow('Flags', report.observed.flags.length, report.known.flags.length)}
${coverageRow('Epochs', report.observed.epochs.length, report.known.epochs.length)}
${coverageRow('Endings', report.observed.endings.length, report.known.endings.length)}

## Termination distribution

\`\`\`json
${JSON.stringify(report.terminationCounts, null, 2)}
\`\`\`

## Unobserved endings

${markdownList(report.unobserved.endings)}

## Unobserved epochs

${markdownList(report.unobserved.epochs)}

## Flag producer/consumer findings

| Flag | Status | Producers | Consumers |
|---|---|---:|---:|
${flagIssues}

## Failed seeds

${report.failures.length > 0
    ? report.failures.map((failure) => `- seed=${failure.seed}, policy=${failure.policyId}, reason=${failure.terminationReason}\n  - replay: \`${failure.replayCommand}\``).join('\n')
    : '- 无'}

## Interpretation boundary

“未观测到”只表示当前 seed × policy × turn matrix 没有到达该节点，不自动等同于代码不可达。Flag 扫描中的 consumer-only、producer-only 与 orphan 项需要结合设计文档和具体因果链复核。
`;
}

export async function writeReachabilityReport(
  report: ReachabilityReport,
  fileStem = 'reachability',
): Promise<{ jsonPath: string; markdownPath: string }> {
  // @ts-expect-error Node built-in types are intentionally not part of the browser production tsconfig.
  const fs = await import('node:fs/promises');
  const runtimeProcess = (globalThis as typeof globalThis & {
    process?: { cwd?: () => string };
  }).process;
  const cwd = runtimeProcess?.cwd?.() ?? '.';
  const outputDir = `${cwd}/reports/simulation`;
  await fs.mkdir(outputDir, { recursive: true });
  const jsonPath = `${outputDir}/${fileStem}.json`;
  const markdownPath = `${outputDir}/${fileStem}.md`;
  await fs.writeFile(jsonPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  await fs.writeFile(markdownPath, renderReachabilityMarkdown(report), 'utf8');
  return { jsonPath, markdownPath };
}
