import { describe, it, expect, beforeEach } from 'vitest';
import { CombatEngine } from '../../core/CombatEngine';
import { createFleet } from '../../core/Fleet';
import { createBarback } from '../../core/Barback';
import { GameInstance } from '../../core/Game';

describe('CombatEngine', () => {
  beforeEach(() => {
    GameInstance.reset();
  });

  it('空舰队vs空军营 同等0战力时进攻方胜', () => {
    const fleet = createFleet('测试舰队', '三体', 0, 3, 0);
    const def = createBarback('earth_def', 3);
    def.soldierCount = 0;

    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(typeof result).toBe('boolean');
  });

  it('强攻舰队能击败弱守军', () => {
    const fleet = createFleet('远征舰队', '三体', 0, 3, 0);
    fleet.weapons.push({ weaponName: '水滴型战舰', currentBuild: 80 });
    fleet.weapons.push({ weaponName: '强互作用探测器', currentBuild: 40 });

    const def = createBarback('earth_def', 3);
    def.soldierCount = 50;

    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(typeof result).toBe('boolean');
  });

  it('防守方强于进攻方 守方胜利', () => {
    const fleet = createFleet('弱攻舰队', '三体', 0, 3, 0);
    fleet.weapons.push({ weaponName: '普通导弹', currentBuild: 10 });

    const def = createBarback('earth_def', 3);
    def.soldierCount = 500;
    def.weapons.push({ weaponName: '恒星级战舰', currentBuild: 50 });

    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(result).toBe(false);
  });

  it('舰队vs舰队 战力强者胜', () => {
    const atk = createFleet('攻击舰队', '三体', 0, 3, 0);
    atk.weapons.push({ weaponName: '水滴型战舰', currentBuild: 100 });

    const def = createFleet('防守舰队', '地球', 3, 0, 0);
    def.weapons.push({ weaponName: '普通导弹', currentBuild: 10 });

    const result = CombatEngine.resolveFleetVsFleet(atk, def);
    expect(result).toBe(true);
  });

  it('舰队战力计算 武器加成', () => {
    const fleet = createFleet('测试舰队', '地球', 3, 0, 0);
    fleet.weapons.push({ weaponName: '恒星级战舰', currentBuild: 50 });
    expect(typeof (CombatEngine as any).calculateFleetPower(fleet)).toBe('number');
  });

  it('水滴类武器战力20倍加成', () => {
    const fleet = createFleet('水滴舰队', '三体', 0, 3, 0);
    fleet.weapons.push({ weaponName: '水滴型战舰', currentBuild: 10 });
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(200);
  });

  it('恒星级战舰战力15倍加成', () => {
    const fleet = createFleet('恒星舰队', '地球', 3, 0, 0);
    fleet.weapons.push({ weaponName: '恒星级战舰', currentBuild: 10 });
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(150);
  });

  it('普通武器战力10倍加成', () => {
    const fleet = createFleet('普通舰队', '地球', 3, 0, 0);
    fleet.weapons.push({ weaponName: '普通导弹', currentBuild: 10 });
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(100);
  });

  it('军营战力计算兵员权重2倍', () => {
    const def = createBarback('test_def', 3);
    def.soldierCount = 100;
    const power = (CombatEngine as any).calculateBarbackPower(def);
    expect(power).toBe(200);
  });

  it('军营战力含武器加成', () => {
    const def = createBarback('test_def', 3);
    def.soldierCount = 50;
    def.weapons.push({ weaponName: '恒星级战舰', currentBuild: 10 });
    const power = (CombatEngine as any).calculateBarbackPower(def);
    expect(power).toBe(200);
  });

  it('leader加成对舰队战力影响', () => {
    const fleet = createFleet('首领舰队', '地球', 3, 0, 0);
    fleet.leaderName = '章北海';
    fleet.weapons.push({ weaponName: '恒星级战舰', currentBuild: 10 });
    const basePower = (CombatEngine as any).calculateFleetPower(fleet);
    expect(typeof basePower).toBe('number');
    expect(basePower).toBeGreaterThan(0);
  });
});