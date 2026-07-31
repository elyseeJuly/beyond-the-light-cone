import { Fleet } from "./Fleet";
import { Barback, createBarback } from "./Barback";
import { GameInstance } from "./Game";
import { Star } from "./Star";
import { t } from "../utils/i18n";

export interface BattleRound {
  round: number;
  attackerWeapon: string;
  attackerType: 'UNIT' | 'EXPENDABLE' | 'SPY' | 'SUPERBOMB';
  defenderWeapon: string;
  defenderType: 'UNIT' | 'EXPENDABLE' | 'SPY' | 'SUPERBOMB';
  atkDamage: number;
  defDamage: number;
  log: string;
}

export interface BattleReport {
  id: string;
  attackerName: string;
  defenderName: string;
  planetName: string;
  attackerPower: number;
  defenderPower: number;
  rounds: BattleRound[];
  winner: string;
  attackerRemainingHp: number;
  defenderRemainingHp: number;
  outcomeLog: string;
}

export class CombatEngine {

  private static classifyWeapon(name: string): 'UNIT' | 'EXPENDABLE' | 'SPY' | 'SUPERBOMB' {
    const lower = name.toLowerCase();
    if (lower.includes(t("二向箔")) || lower.includes("dimension") || lower.includes(t("氢弹")) || lower.includes("bomb")) {
      return 'SUPERBOMB';
    }
    if (lower.includes(t("智子")) || lower.includes("sophon") || lower.includes(t("干扰")) || lower.includes("spy") || lower.includes(t("信息"))) {
      return 'SPY';
    }
    if (lower.includes(t("探测器")) || lower.includes(t("水滴")) || lower.includes("probe") || lower.includes("waterdrop") || lower.includes(t("导弹")) || lower.includes("missile")) {
      return 'EXPENDABLE';
    }
    return 'UNIT';
  }

  public static resolveFleetVsBarback(atkFleet: Fleet, defBarback: Barback): boolean {
    const game = GameInstance.get();
    const star = game.starManager.getStar(defBarback.planetIndex);
    const defCiviName = star ? (star.belongToCivi || t("防御军")) : t("防御军");

    const atkPower = this.calculateFleetPower(atkFleet);
    const defPower = this.calculateBarbackPower(defBarback);

    game.addHistory(t("战斗爆发！星系[{param0}] 遭到【{param1}】舰队袭击！", { param0: defBarback.planetIndex, param1: atkFleet.belongToCivi }));
    game.addHistory(t(">> 攻击方战力评级: {param0}", { param0: atkPower }));
    game.addHistory(t(">> 防守方战力评级: {param0}", { param0: defPower }));

    if (atkPower === 0 && defPower === 0) {
      game.addHistory(t("【战报】双方均无战力，防守方固守成功！"));
      return false;
    }

    let atkHp = atkPower;
    let defHp = defPower;
    let round = 0;
    const maxRounds = 5;
    const battleRounds: BattleRound[] = [];

    // Collect weapons for round-by-round dueling details
    const atkWeapons = atkFleet.weapons.map(w => ({
      name: w.weaponName,
      type: this.classifyWeapon(w.weaponName),
      count: w.currentBuild
    })).filter(w => w.count > 0);

    const defWeapons = defBarback.weapons.map(w => ({
      name: w.weaponName,
      type: this.classifyWeapon(w.weaponName),
      count: w.currentBuild
    })).filter(w => w.count > 0);

    while (atkHp > 0 && defHp > 0 && round < maxRounds) {
      round++;

      // Pick weapon elements for this round or fallback to standard unit
      const atkItem = atkWeapons[round - 1] || { name: t("恒星级护卫舰队"), type: "UNIT" as const, count: 1 };
      const defItem = defWeapons[round - 1] || { name: t("星面防御卫戍军"), type: "UNIT" as const, count: 1 };

      const atkDice = 0.8 + game.rng() * 0.4;
      const defDice = 0.85 + game.rng() * 0.5;

      // Weapon combat matchup logic multipliers
      let atkMult = 1.0;
      let defMult = 1.0;

      // SPY overrides EXPENDABLE
      if (atkItem.type === 'SPY' && defItem.type === 'EXPENDABLE') atkMult = 1.4;
      if (defItem.type === 'SPY' && atkItem.type === 'EXPENDABLE') defMult = 1.4;

      // SUPERBOMB decimates UNIT
      if (atkItem.type === 'SUPERBOMB' && defItem.type === 'UNIT') atkMult = 1.8;
      if (defItem.type === 'SUPERBOMB' && atkItem.type === 'UNIT') defMult = 1.8;

      const atkDamage = Math.floor(atkHp * 0.2 * atkDice * atkMult) + 5;
      const defDamage = Math.floor(defHp * 0.25 * defDice * defMult) + 5;

      const roundAtkDamage = Math.min(defHp, atkDamage);
      const roundDefDamage = Math.min(atkHp, defDamage);

      defHp -= roundAtkDamage;
      atkHp -= roundDefDamage;

      let logMsg = t("[攻方] {param0} ({param1}) 实施精确打击，对 [守方] {param2} 造成了 {param3} 点结构损伤。", { param0: atkItem.name, param1: atkItem.type, param2: defItem.name, param3: roundAtkDamage });
      if (defHp > 0) {
        logMsg += t(" [守方] 组织强力反击，造成了 {param0} 点反击伤害。", { param0: roundDefDamage });
      } else {
        logMsg += t(" [守方] 防线崩溃，未能在本轮组织有效反击。");
      }

      battleRounds.push({
        round,
        attackerWeapon: atkItem.name,
        attackerType: atkItem.type,
        defenderWeapon: defItem.name,
        defenderType: defItem.type,
        atkDamage: roundAtkDamage,
        defDamage: defHp > 0 ? roundDefDamage : 0,
        log: logMsg
      });

      game.addHistory(t(">> 第{param0}轮: 攻防对决，守方剩余 HP: {param1}，攻方剩余 HP: {param2}", { param0: round, param1: Math.max(0, defHp), param2: Math.max(0, atkHp) }));
    }

    let winner = defHp <= 0 ? atkFleet.belongToCivi : defCiviName;
    let win = defHp <= 0;

    if (atkHp <= 0 && defHp > 0) {
      win = false;
      winner = defCiviName;
    } else if (atkHp > 0 && defHp > 0) {
      const finalRatio = atkHp / defHp;
      if (finalRatio > 1.3) {
        win = true;
        winner = atkFleet.belongToCivi;
      } else {
        win = false;
        winner = defCiviName;
      }
    }

    let outcomeLog = "";
    if (win) {
      outcomeLog = t("【战报结论】经过 {param0} 轮的惨烈激战，攻方 {param1} 凭借压倒性的战术火力和精妙的兵种相克打穿了防御体系！星系防线失守，防守方卫戍军全军覆没！", { param0: round, param1: atkFleet.belongToCivi });
      game.addHistory(t("【战报】守军全军覆没，星系易主！"));
    } else {
      outcomeLog = t("【战报结论】历经 {param0} 轮的高强度交火，防守方凭借坚固的掩体星面要塞以及深空雷场，固守击退了攻方 {param1} 的波次突袭！攻方残余星舰已折返！", { param0: round, param1: atkFleet.belongToCivi });
      game.addHistory(t("【战报】攻防双方僵持不下，防守方固守成功！"));
    }

    // Save report to the Game instance
    const report: BattleReport = {
      id: `battle_${Date.now()}`,
      attackerName: t("{param0} {param1} (指挥官: {param2})", { param0: atkFleet.belongToCivi, param1: atkFleet.name, param2: atkFleet.leaderName || t("自动AI") }),
      defenderName: t("星面卫戍军 (指挥官: {param0})", { param0: defBarback.departmentLeaderName || t("要塞AI") }),
      planetName: t("星系 [{param0}]", { param0: defBarback.planetIndex }),
      attackerPower: atkPower,
      defenderPower: defPower,
      rounds: battleRounds,
      winner,
      attackerRemainingHp: Math.max(0, atkHp),
      defenderRemainingHp: Math.max(0, defHp),
      outcomeLog
    };

    (game as any).lastBattleReport = report;
    GameInstance.get().eventBus.emitLegacy('battle-triggered');

    return win;
  }

  /** 处理星系叛乱：叛军 Barback 与星系守军进行简化战斗，返回叛军是否胜利 */
  public static resolveBarbackRaid(targetStar: Star, rebel: Barback): boolean {
    const game = GameInstance.get();

    let defender: Barback | null = null;
    if (targetStar.barbackId) {
      defender = game.starManager.barbacks.get(targetStar.barbackId) || null;
    }
    if (!defender && targetStar.belongToCivi) {
      defender = createBarback(`garrison_${targetStar.index}`, targetStar.index);
      defender.soldierCount = Math.max(
        30,
        Math.floor(targetStar.currentPopulation * 0.3) +
          (targetStar.belongToCivi === t("地球") ? Math.floor(game.earthCivi.army * 0.1) : 0)
      );
      defender.departmentLeaderName = targetStar.departmentName;
    }

    if (!defender) {
      game.addHistory(t("【军情】{param0} 无驻军，叛乱不战而胜。", { param0: targetStar.name }));
      return true;
    }

    const atkPower = this.calculateBarbackPower(rebel);
    const defPower = this.calculateBarbackPower(defender);

    game.addHistory(t("【平叛战斗】{param0} 爆发叛乱，叛军战力 {param1} vs 守军战力 {param2}。", { param0: targetStar.name, param1: atkPower, param2: defPower }));

    let atkHp = atkPower;
    let defHp = defPower;
    let round = 0;
    const maxRounds = 3;

    while (atkHp > 0 && defHp > 0 && round < maxRounds) {
      round++;
      const atkDice = 0.8 + game.rng() * 0.4;
      const defDice = 0.85 + game.rng() * 0.5;
      const atkDamage = Math.floor(atkHp * 0.25 * atkDice) + 5;
      const defDamage = Math.floor(defHp * 0.25 * defDice) + 5;
      defHp -= Math.min(defHp, atkDamage);
      atkHp -= Math.min(atkHp, defDamage);
      game.addHistory(t(">> 第{param0}轮: 叛军剩余 {param1}，守军剩余 {param2}。", { param0: round, param1: Math.max(0, atkHp), param2: Math.max(0, defHp) }));
    }

    const rebelWins = defHp <= 0 || (atkHp > 0 && atkHp > defHp);
    if (rebelWins) {
      game.addHistory(t("【战报】{param0} 守军被叛军击溃，星系陷入混乱！", { param0: targetStar.name }));
    } else {
      game.addHistory(t("【战报】{param0} 守军成功镇压叛乱。", { param0: targetStar.name }));
    }

    return rebelWins;
  }

  public static resolveFleetVsFleet(atkFleet: Fleet, defFleet: Fleet): boolean {
    const game = GameInstance.get();
    const atkPower = this.calculateFleetPower(atkFleet);
    const defPower = this.calculateFleetPower(defFleet);

    if (atkPower === 0 && defPower === 0) return false;

    let atkHp = atkPower;
    let defHp = defPower;
    let round = 0;
    const maxRounds = 3;
    const battleRounds: BattleRound[] = [];

    const atkWeapons = atkFleet.weapons.map(w => ({
      name: w.weaponName,
      type: this.classifyWeapon(w.weaponName),
      count: w.currentBuild
    })).filter(w => w.count > 0);

    const defWeapons = defFleet.weapons.map(w => ({
      name: w.weaponName,
      type: this.classifyWeapon(w.weaponName),
      count: w.currentBuild
    })).filter(w => w.count > 0);

    while (atkHp > 0 && defHp > 0 && round < maxRounds) {
      round++;
      const atkItem = atkWeapons[round - 1] || { name: t("恒星级突击舰"), type: "UNIT" as const, count: 1 };
      const defItem = defWeapons[round - 1] || { name: t("防守重装护卫舰"), type: "UNIT" as const, count: 1 };

      const atkDice = 0.9 + game.rng() * 0.2;
      const defDice = 0.9 + game.rng() * 0.2;

      let atkMult = 1.0;
      let defMult = 1.0;

      if (atkItem.type === 'SPY' && defItem.type === 'EXPENDABLE') atkMult = 1.3;
      if (defItem.type === 'SPY' && atkItem.type === 'EXPENDABLE') defMult = 1.3;

      const atkDamage = Math.floor(atkHp * 0.3 * atkDice * atkMult) + 5;
      const defDamage = Math.floor(defHp * 0.3 * defDice * defMult) + 5;

      const roundAtkDamage = Math.min(defHp, atkDamage);
      const roundDefDamage = Math.min(atkHp, defDamage);

      defHp -= roundAtkDamage;
      atkHp -= roundDefDamage;

      battleRounds.push({
        round,
        attackerWeapon: atkItem.name,
        attackerType: atkItem.type,
        defenderWeapon: defItem.name,
        defenderType: defItem.type,
        atkDamage: roundAtkDamage,
        defDamage: roundDefDamage,
        log: t("[攻方] {param0} 射出宏电子束流，造成 {param1} 伤害；[守方] {param2} 使用超导电磁炮反击，造成 {param3} 伤害。", { param0: atkItem.name, param1: roundAtkDamage, param2: defItem.name, param3: roundDefDamage })
      });
    }

    const win = defHp <= 0 && atkHp > 0;
    const winner = win ? atkFleet.belongToCivi : defFleet.belongToCivi;
    const outcomeLog = win 
      ? t("【空战总结】两支深空舰队决战终结！攻方 {param0} 的超视距战术编队成功击毁了防守方的全部作战单元，获得绝对空天控制权！", { param0: atkFleet.belongToCivi })
      : t("【空战总结】决战以攻方折戟告终！守方 {param0} 的高能拦截阵列将入侵机群悉数歼灭！", { param0: defFleet.belongToCivi });

    const report: BattleReport = {
      id: `battle_${Date.now()}`,
      attackerName: t("{param0} {param1} (指挥官: {param2})", { param0: atkFleet.belongToCivi, param1: atkFleet.name, param2: atkFleet.leaderName || t("自动AI") }),
      defenderName: t("{param0} {param1} (指挥官: {param2})", { param0: defFleet.belongToCivi, param1: defFleet.name, param2: defFleet.leaderName || t("防守AI") }),
      planetName: t("深空要道"),
      attackerPower: atkPower,
      defenderPower: defPower,
      rounds: battleRounds,
      winner,
      attackerRemainingHp: Math.max(0, atkHp),
      defenderRemainingHp: Math.max(0, defHp),
      outcomeLog
    };

    (game as any).lastBattleReport = report;
    GameInstance.get().eventBus.emitLegacy('battle-triggered');

    return win;
  }

  private static calculateFleetPower(fleet: Fleet): number {
    if (!fleet.weapons || fleet.weapons.length === 0) {
      return 0;
    }

    let base = 0;
    fleet.weapons.forEach(w => {
      if (w.weaponName.includes(t("水滴")) || w.weaponName.includes(t("探测器"))) {
        base += w.currentBuild * 20;
      } else if (w.weaponName.includes(t("战舰")) || w.weaponName.includes(t("恒星级"))) {
        base += w.currentBuild * 15;
      } else {
        base += w.currentBuild * 10;
      }
    });

    if (fleet.leaderName) {
      const game = GameInstance.get();
      const leader = game.personManager.getPerson(fleet.leaderName);
      if (leader) {
        base *= (1 + leader.army * 0.1 + leader.leadership * 0.05);
      }
    }
    return Math.floor(base);
  }

  private static calculateBarbackPower(barback: Barback): number {
    let base = barback.soldierCount * 2;
    barback.weapons.forEach(w => {
      base += w.currentBuild * 10;
    });

    if (barback.departmentLeaderName) {
      const game = GameInstance.get();
      const leader = game.personManager.getPerson(barback.departmentLeaderName);
      if (leader) {
        base *= (1 + leader.army * 0.15);
      }
    }

    return Math.floor(base);
  }
}
