import type { Game } from '../../core/Game';
import type {
  InvariantViolation,
  SimulationInvariant,
  SimulationSnapshot,
} from './types';

const NON_NEGATIVE_FIELDS: Array<keyof Pick<
  SimulationSnapshot,
  | 'population'
  | 'economy'
  | 'culture'
  | 'resource'
  | 'army'
  | 'treachery'
  | 'deterrence'
  | 'actionPoints'
  | 'eventQueueLength'
  | 'flagCount'
  | 'finishedTechCount'
>> = [
  'population',
  'economy',
  'culture',
  'resource',
  'army',
  'treachery',
  'deterrence',
  'actionPoints',
  'eventQueueLength',
  'flagCount',
  'finishedTechCount',
];

function violation(
  id: string,
  message: string,
  snapshot: SimulationSnapshot,
): InvariantViolation {
  return {
    id,
    message,
    year: snapshot.year,
    epoch: snapshot.epoch,
  };
}

export const finiteAndNonNegativeInvariant: SimulationInvariant = (
  _game,
  _previous,
  current,
) => {
  const violations: InvariantViolation[] = [];
  for (const field of NON_NEGATIVE_FIELDS) {
    const value = current[field];
    if (!Number.isFinite(value)) {
      violations.push(violation('INV-NUM-FINITE', `${field} is not finite: ${value}`, current));
    } else if (value < 0) {
      violations.push(violation('INV-NUM-NONNEGATIVE', `${field} is negative: ${value}`, current));
    }
  }
  return violations;
};

export const monotonicYearInvariant: SimulationInvariant = (
  _game,
  previous,
  current,
) => {
  if (previous && current.year < previous.year) {
    return [
      violation(
        'INV-YEAR-MONOTONIC',
        `year moved backwards: ${previous.year} -> ${current.year}`,
        current,
      ),
    ];
  }
  return [];
};

export const warningFreeInvariant: SimulationInvariant = (
  game: Game,
  _previous,
  current,
) => {
  const warnings = game.historyLogs.filter(
    (entry) => entry.includes('[警告]') || entry.includes('[UEE警告]'),
  );
  return warnings.length > 0
    ? [
        violation(
          'INV-NO-SUBSYSTEM-WARNINGS',
          `subsystem warnings detected: ${warnings.slice(-3).join(' | ')}`,
          current,
        ),
      ]
    : [];
};

export const defaultSimulationInvariants: SimulationInvariant[] = [
  finiteAndNonNegativeInvariant,
  monotonicYearInvariant,
  warningFreeInvariant,
];
