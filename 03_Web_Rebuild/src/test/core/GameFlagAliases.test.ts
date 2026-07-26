import { describe, expect, it } from 'vitest';
import { FlagManager } from '../../core/FlagManager';
import { FLAG } from '../../core/GameFlags';

describe('Game flag legacy equivalence', () => {
  it('canonical dark-domain flag unlocks historical archive aliases', () => {
    const manager = new FlagManager(new Set([FLAG.DARK_DOMAIN_DECISION]));

    expect(manager.isSet(FLAG.DARK_DOMAIN_DECISION)).toBe(true);
    expect(manager.isSet(FLAG.BLACK_DOMAIN_DECISION)).toBe(true);
    expect(manager.isSet(FLAG.BLACK_DOMAIN_COMPLETED)).toBe(true);
    expect(manager.isSet(FLAG.SAFETY_DECLARATION)).toBe(true);
  });

  it('legacy dark-domain saves satisfy current victory checks', () => {
    const historicalFlags = [
      FLAG.BLACK_DOMAIN_DECISION,
      FLAG.BLACK_DOMAIN_COMPLETED,
      FLAG.SAFETY_DECLARATION,
    ];

    for (const legacyFlag of historicalFlags) {
      const manager = new FlagManager(new Set([legacyFlag]));
      expect(manager.isSet(FLAG.DARK_DOMAIN_DECISION)).toBe(true);
    }
  });

  it('stardust declaration aliases remain bidirectional across save versions', () => {
    const current = new FlagManager(new Set([FLAG.STARDUST_ERA_DECLARED]));
    expect(current.isSet(FLAG.STARDUST_ERA_SEEN)).toBe(true);

    const historical = new FlagManager(new Set([FLAG.STARDUST_ERA_SEEN]));
    expect(historical.isSet(FLAG.STARDUST_ERA_DECLARED)).toBe(true);
  });

  it('writing a canonical flag does not duplicate aliases in the save snapshot', () => {
    const manager = new FlagManager();
    manager.set(FLAG.DARK_DOMAIN_DECISION);

    expect(manager.getSnapshot()).toEqual([FLAG.DARK_DOMAIN_DECISION]);
  });
});
