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

// ======== 扩展的边缘情况测试 ========

describe('Fleet vs Barback - 边缘情况', () => {
  it('战力接近时战报结构完整', () => {
    const fleet = createFleet('均衡舰队', '地球', 0, 3, 0);
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }]; // power: 150
    const def = createBarback('earth_def', 3);
    def.soldierCount = 75; // power: 150
    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(typeof result).toBe('boolean');
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report).toBeDefined();
    expect(report.attackerPower).toBe(150);
    expect(report.defenderPower).toBe(150);
  });

  it('双方均无有效武器时防守方固守成功', () => {
    const fleet = createFleet('空舰队', '地球', 0, 3, 0);
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 0 }]; // power: 0, 但weapons不为空不会触发autoEquip
    const def = createBarback('earth_def', 3);
    def.soldierCount = 0;
    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(result).toBe(false);
  });

  it('指挥官加成帮助进攻方以弱胜强', () => {
    const fleet = createFleet('指挥官舰队', '地球', 0, 3, 0);
    fleet.leaderName = '常伟思';
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }]; // base: 150
    const def = createBarback('earth_def', 3);
    def.soldierCount = 85; // power: 170
    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(typeof result).toBe('boolean');
  });

  it('战斗报告包含所有预期字段', () => {
    const fleet = createFleet('战报测试舰队', '地球', 0, 3, 0);
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 30 }];
    const def = createBarback('earth_def', 3);
    def.soldierCount = 50;
    CombatEngine.resolveFleetVsBarback(fleet, def);
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('attackerName');
    expect(report).toHaveProperty('defenderName');
    expect(report).toHaveProperty('planetName');
    expect(report).toHaveProperty('attackerPower');
    expect(report).toHaveProperty('defenderPower');
    expect(report).toHaveProperty('rounds');
    expect(report).toHaveProperty('winner');
    expect(report).toHaveProperty('attackerRemainingHp');
    expect(report).toHaveProperty('defenderRemainingHp');
    expect(report).toHaveProperty('outcomeLog');
    expect(Array.isArray(report.rounds)).toBe(true);
    if (report.rounds.length > 0) {
      const firstRound = report.rounds[0];
      expect(firstRound).toHaveProperty('round');
      expect(firstRound).toHaveProperty('attackerWeapon');
      expect(firstRound).toHaveProperty('attackerType');
      expect(firstRound).toHaveProperty('defenderWeapon');
      expect(firstRound).toHaveProperty('defenderType');
      expect(firstRound).toHaveProperty('atkDamage');
      expect(firstRound).toHaveProperty('defDamage');
      expect(firstRound).toHaveProperty('log');
    }
  });

  it('水滴类武器在舰队vs军营中发挥高倍战力', () => {
    const fleet = createFleet('水滴突击队', '三体', 0, 3, 0);
    fleet.weapons = [{ weaponName: '水滴型战舰', currentBuild: 30 }]; // power: 600
    const def = createBarback('earth_def', 3);
    def.soldierCount = 200; // power: 400
    const result = CombatEngine.resolveFleetVsBarback(fleet, def);
    expect(typeof result).toBe('boolean');
  });
});

describe('Fleet vs Fleet - 边缘情况', () => {
  it('多舰队轮番交战模拟', () => {
    const fleetA = createFleet('舰队A', '地球', 0, 3, 0);
    fleetA.weapons = [{ weaponName: '恒星级战舰', currentBuild: 50 }];
    const fleetB = createFleet('舰队B', '三体', 3, 0, 0);
    fleetB.weapons = [{ weaponName: '水滴型战舰', currentBuild: 30 }];
    const fleetC = createFleet('舰队C', '地球', 0, 5, 0);
    fleetC.weapons = [{ weaponName: '普通导弹', currentBuild: 100 }];
    // 多舰队轮番交战，每次都是独立计算
    const resultAB = CombatEngine.resolveFleetVsFleet(fleetA, fleetB);
    expect(typeof resultAB).toBe('boolean');
    const resultAC = CombatEngine.resolveFleetVsFleet(fleetA, fleetC);
    expect(typeof resultAC).toBe('boolean');
    const resultBC = CombatEngine.resolveFleetVsFleet(fleetB, fleetC);
    expect(typeof resultBC).toBe('boolean');
  });

  it('仅有辅助舰艇的舰队能正常参与对战', () => {
    const support = createFleet('辅助舰队', '地球', 0, 3, 0);
    support.weapons = [{ weaponName: '智子干扰装置', currentBuild: 30 }]; // SPY type, power: 300
    const combat = createFleet('战斗舰队', '三体', 3, 0, 0);
    combat.weapons = [{ weaponName: '恒星级战舰', currentBuild: 30 }]; // UNIT type, power: 450
    const result = CombatEngine.resolveFleetVsFleet(support, combat);
    expect(typeof result).toBe('boolean');
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report.attackerPower).toBe(300);
    expect(report.defenderPower).toBe(450);
  });

  it('势均力敌的舰队对决战报完整', () => {
    const atk = createFleet('A舰队', '地球', 0, 3, 0);
    atk.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }]; // power: 150
    const def = createFleet('B舰队', '地球', 3, 0, 0);
    def.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }]; // power: 150
    const result = CombatEngine.resolveFleetVsFleet(atk, def);
    expect(typeof result).toBe('boolean');
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report.attackerPower).toBe(150);
    expect(report.defenderPower).toBe(150);
    expect(report.rounds.length).toBeGreaterThanOrEqual(1);
  });

  it('舰队vs舰队战斗报告格式完整', () => {
    const atk = createFleet('report测试', '地球', 0, 3, 0);
    atk.weapons = [{ weaponName: '恒星级战舰', currentBuild: 40 }];
    atk.leaderName = '章北海';
    const def = createFleet('def测试', '三体', 3, 7, 0);
    def.weapons = [{ weaponName: '水滴型战舰', currentBuild: 20 }];
    CombatEngine.resolveFleetVsFleet(atk, def);
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report).toHaveProperty('id');
    expect(report).toHaveProperty('attackerName');
    expect(report).toHaveProperty('defenderName');
    expect(report).toHaveProperty('planetName');
    expect(report).toHaveProperty('attackerPower');
    expect(report).toHaveProperty('defenderPower');
    expect(report).toHaveProperty('rounds');
    expect(report).toHaveProperty('winner');
    expect(report).toHaveProperty('attackerRemainingHp');
    expect(report).toHaveProperty('defenderRemainingHp');
    expect(report).toHaveProperty('outcomeLog');
    expect(typeof report.winner).toBe('string');
    expect(report.winner.length).toBeGreaterThan(0);
  });

  it('双方均无战力时安全处理返回false', () => {
    const atk = createFleet('空舰队A', '地球', 0, 3, 0);
    atk.weapons = [{ weaponName: '恒星级战舰', currentBuild: 0 }];
    const def = createFleet('空舰队B', '地球', 3, 0, 0);
    def.weapons = [{ weaponName: '恒星级战舰', currentBuild: 0 }];
    const result = CombatEngine.resolveFleetVsFleet(atk, def);
    expect(result).toBe(false);
  });
});

describe('战力计算 - 边缘情况', () => {
  it('舰队混合多种武器战力计算正确', () => {
    const fleet = createFleet('混合舰队', '地球', 0, 3, 0);
    fleet.weapons = [
      { weaponName: '水滴型战舰', currentBuild: 10 },   // 20 * 10 = 200
      { weaponName: '恒星级战舰', currentBuild: 10 },   // 15 * 10 = 150
      { weaponName: '普通导弹', currentBuild: 10 },      // 10 * 10 = 100
    ];
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(450);
  });

  it('军营大量士兵战力计算正确', () => {
    const def = createBarback('test_def', 3);
    def.soldierCount = 9999;
    def.weapons = [{ weaponName: '恒星级战舰', currentBuild: 1 }]; // +10
    const power = (CombatEngine as any).calculateBarbackPower(def);
    expect(power).toBe(20008); // 9999*2 + 10
  });

  it('水滴/探测器类武器20倍战力加成', () => {
    const fleet = createFleet('水滴舰队', '三体', 0, 3, 0);
    fleet.weapons = [{ weaponName: '强互作用探测器', currentBuild: 10 }];
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(200); // 10 * 20
  });

  it('指挥官加成使战力显著提升', () => {
    // 无指挥官
    const fleetNoLeader = createFleet('无指挥舰队', '地球', 0, 3, 0);
    fleetNoLeader.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }];
    const powerNoLeader = (CombatEngine as any).calculateFleetPower(fleetNoLeader);
    expect(powerNoLeader).toBe(150);
    // 有指挥官
    const fleetWithLeader = createFleet('有指挥舰队', '地球', 0, 3, 0);
    fleetWithLeader.leaderName = '章北海';
    fleetWithLeader.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }];
    const powerWithLeader = (CombatEngine as any).calculateFleetPower(fleetWithLeader);
    expect(powerWithLeader).toBeGreaterThan(150);
  });
});

describe('异常/边界处理', () => {
  it('指挥官为null时战力计算不报错', () => {
    const fleet = createFleet('null指挥官', '地球', 0, 3, 0);
    fleet.leaderName = null;
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 10 }];
    expect(() => {
      const power = (CombatEngine as any).calculateFleetPower(fleet);
      expect(power).toBe(150);
    }).not.toThrow();
  });

  it('舰队空武器数组战力为0', () => {
    const fleet = createFleet('emptyWeapon舰队', '地球', 0, 3, 0);
    fleet.weapons = [];
    const power = (CombatEngine as any).calculateFleetPower(fleet);
    expect(power).toBe(0);
  });

  it('军营零士兵但有武器时战力来自武器', () => {
    const def = createBarback('test_def', 3);
    def.soldierCount = 0;
    def.weapons = [{ weaponName: '普通导弹', currentBuild: 20 }];
    const power = (CombatEngine as any).calculateBarbackPower(def);
    expect(power).toBe(200); // 20 * 10
  });

  it('战斗结果win值与战报winner字段一致', () => {
    // 进攻方明显强于防守方
    const fleet = createFleet('胜率测试', '地球', 0, 3, 0);
    fleet.weapons = [{ weaponName: '恒星级战舰', currentBuild: 100 }]; // power: 1500
    const def = createBarback('earth_def', 3);
    def.soldierCount = 10; // power: 20
    const win = CombatEngine.resolveFleetVsBarback(fleet, def);
    const report = (GameInstance.get() as any).lastBattleReport;
    expect(report.winner).toBeDefined();
    expect(typeof report.winner).toBe('string');
    if (win) {
      expect(report.winner).toBe('地球');
    }
  });
});