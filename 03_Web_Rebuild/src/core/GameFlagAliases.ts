import { FLAG, type GameFlag } from './GameFlags';

/**
 * Flags that represented the same state in different historical revisions.
 * Reads are intentionally bidirectional so old saves and current code agree.
 * New production code should always write the first (canonical) member.
 */
export const FLAG_EQUIVALENCE_GROUPS: readonly (readonly GameFlag[])[] = [
  [
    FLAG.DARK_DOMAIN_DECISION,
    FLAG.BLACK_DOMAIN_DECISION,
    FLAG.BLACK_DOMAIN_COMPLETED,
    FLAG.SAFETY_DECLARATION,
  ],
  [
    FLAG.STARDUST_ERA_DECLARED,
    FLAG.STARDUST_ERA_SEEN,
  ],
] as const;

export function getEquivalentFlags(flag: string): readonly string[] {
  return FLAG_EQUIVALENCE_GROUPS.find((group) => group.includes(flag as GameFlag)) ?? [flag];
}

export function getCanonicalFlag(flag: string): string {
  return getEquivalentFlags(flag)[0] ?? flag;
}
