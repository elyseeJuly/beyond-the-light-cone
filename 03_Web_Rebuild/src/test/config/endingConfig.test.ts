import { describe, it, expect } from 'vitest';
import { resolveEndingKey } from '../../config/endingConfig';
import { VictoryType, DefeatType } from '../../types/enums';

describe('Ending Config Resolver', () => {
  it('正确解析所有的胜利结局', () => {
    expect(resolveEndingKey(VictoryType.CONQUEST, null)).toBe('CONQUEST');
    expect(resolveEndingKey(VictoryType.DETERRENCE, null)).toBe('DETERRENCE');
    expect(resolveEndingKey(VictoryType.DARK_DOMAIN, null)).toBe('DARK_DOMAIN');
    expect(resolveEndingKey(VictoryType.WANDERING, null)).toBe('WANDERING');
    expect(resolveEndingKey(VictoryType.DIGITAL, null)).toBe('DIGITAL');
    expect(resolveEndingKey(VictoryType.HIDDEN, null)).toBe('HIDDEN');
  });

  it('正确解析所有的失败结局', () => {
    expect(resolveEndingKey(null, DefeatType.TREACHERY)).toBe('DEFEAT_TREACHERY');
    expect(resolveEndingKey(null, DefeatType.EXTINCTION)).toBe('DEFEAT_EXTINCTION');
    expect(resolveEndingKey(null, DefeatType.HELIUM_FLASH)).toBe('DEFEAT_HELIUM_FLASH');
    expect(resolveEndingKey(null, DefeatType.DIMENSION_STRIKE)).toBe('DEFEAT_DIMENSION_STRIKE');
  });
});
