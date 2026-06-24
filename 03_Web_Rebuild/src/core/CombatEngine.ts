import { Fleet } from "./Fleet";
import { Barback, createBarback } from "./Barback";
import { GameInstance } from "./Game";
import { Star } from "./Star";

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
    if (lower.includes("二向箔") || lower.includes("dimension") || lower.includes("氢弹") || lower.includes("bomb")) {
      return 'SUPERBOMB';
    }
    if (lower.includes("智子") || lower.includes("sophon") || lower.includes("干扰") || lower.includes("spy") || lower.includes("信息")) {
      return 'SPY';
    }
    if (lower.includes("探测器") || lower.includes("水滴") || lower.includes("probe") || lower.includes("waterdrop") || lower.includes("导弹") || lower.includes("missile")) {
      return 'EXPENDABLE';
    }
    return 'UNIT';
  }

  public static resolveFleetVsBarback(atkFleet: Fleet, defBarback: Barback): boolean {
    const game = GameInstance.get();
    const star = game.starManager.getStar(defBarback.planetIndex);
    const defCiviName = star ? (star.belongToCivi || "防御军") : "防御军";

    const atkPower = this.calculateFleetPower(atkFleet);
    const defPower = this.calculateBarbackPower(defBarback);

    game.addHistory(`战斗爆发！星系[${defBarback.planetIndex}] 遭到【${atkFleet.belongToCivi}】舰队袭击！`);
    game.addHistory(`>> 攻击方战力评级: ${atkPower}`);
    game.addHistory(`>> 防守方战力评级: ${defPower}`);

    if (atkPower === 0 && defPower === 0) {
      game.addHistory(`【战报】双方均无战力，防守方固守成功！`);
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
      const atkItem = atkWeapons[round - 1] || { name: "恒星级护卫舰队", type: "UNIT" as const, count: 1 };
      const defItem = defWeapons[round - 1] || { name: "星面防御卫戍军", type: "UNIT" as const, count: 1 };

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

      let logMsg = `[攻方] ${atkItem.name} (${atkItem.type}) 实施精确打击，对 [守方] ${defItem.name} 造成了 ${roundAtkDamage} 点结构损伤。`;
      if (defHp > 0) {
        logMsg += ` [守方] 组织强力反击，造成了 ${roundDefDamage} 点反击伤害。`;
      } else {
        logMsg += ` [守方] 防线崩溃，未能在本轮组织有效反击。`;
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

      game.addHistory(`>> 第${round}轮: 攻防对决，守方剩余 HP: ${Math.max(0, defHp)}，攻方剩余 HP: ${Math.max(0, atkHp)}`);
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
      outcomeLog = `【战报结论】经过 ${round} 轮的惨烈激战，攻方 ${atkFleet.belongToCivi} 凭借压倒性的战术火力和精妙的兵种相克打穿了防御体系！星系防线失守，防守方卫戍军全军覆没！`;
      game.addHistory(`【战报】守军全军覆没，星系易主！`);
    } else {
      outcomeLog = `【战报结论】历经 ${round} 轮的高强度交火，防守方凭借坚固的掩体星面要塞以及深空雷场，固守击退了攻方 ${atkFleet.belongToCivi} 的波次突袭！攻方残余星舰已折返！`;
      game.addHistory(`【战报】攻防双方僵持不下，防守方固守成功！`);
    }

    // Save report to the Game instance
    const report: BattleReport = {
      id: `battle_${Date.now()}`,
      attackerName: `${atkFleet.belongToCivi} ${atkFleet.name} (指挥官: ${atkFleet.leaderName || "自动AI"})`,
      defenderName: `星面卫戍军 (指挥官: ${defBarback.departmentLeaderName || "要塞AI"})`,
      planetName: `星系 [${defBarback.planetIndex}]`,
      attackerPower: atkPower,
      defenderPower: defPower,
      rounds: battleRounds,
      winner,
      attackerRemainingHp: Math.max(0, atkHp),
      defenderRemainingHp: Math.max(0, defHp),
      outcomeLog
    };

    (game as any).lastBattleReport = report;
    window.dispatchEvent(new CustomEvent('battle-triggered'));

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
          (targetStar.belongToCivi === '地球' ? Math.floor(game.earthCivi.army * 0.1) : 0)
      );
      defender.departmentLeaderName = targetStar.departmentName;
    }

    if (!defender) {
      game.addHistory(`【军情】${targetStar.name} 无驻军，叛乱不战而胜。`);
      return true;
    }

    const atkPower = this.calculateBarbackPower(rebel);
    const defPower = this.calculateBarbackPower(defender);

    game.addHistory(`【平叛战斗】${targetStar.name} 爆发叛乱，叛军战力 ${atkPower} vs 守军战力 ${defPower}。`);

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
      game.addHistory(`>> 第${round}轮: 叛军剩余 ${Math.max(0, atkHp)}，守军剩余 ${Math.max(0, defHp)}。`);
    }

    const rebelWins = defHp <= 0 || (atkHp > 0 && atkHp > defHp);
    if (rebelWins) {
      game.addHistory(`【战报】${targetStar.name} 守军被叛军击溃，星系陷入混乱！`);
    } else {
      game.addHistory(`【战报】${targetStar.name} 守军成功镇压叛乱。`);
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
      const atkItem = atkWeapons[round - 1] || { name: "恒星级突击舰", type: "UNIT" as const, count: 1 };
      const defItem = defWeapons[round - 1] || { name: "防守重装护卫舰", type: "UNIT" as const, count: 1 };

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
        log: `[攻方] ${atkItem.name} 射出宏电子束流，造成 ${roundAtkDamage} 伤害；[守方] ${defItem.name} 使用超导电磁炮反击，造成 ${roundDefDamage} 伤害。`
      });
    }

    const win = defHp <= 0 && atkHp > 0;
    const winner = win ? atkFleet.belongToCivi : defFleet.belongToCivi;
    const outcomeLog = win 
      ? `【空战总结】两支深空舰队决战终结！攻方 ${atkFleet.belongToCivi} 的超视距战术编队成功击毁了防守方的全部作战单元，获得绝对空天控制权！`
      : `【空战总结】决战以攻方折戟告终！守方 ${defFleet.belongToCivi} 的高能拦截阵列将入侵机群悉数歼灭！`;

    const report: BattleReport = {
      id: `battle_${Date.now()}`,
      attackerName: `${atkFleet.belongToCivi} ${atkFleet.name} (指挥官: ${atkFleet.leaderName || "自动AI"})`,
      defenderName: `${defFleet.belongToCivi} ${defFleet.name} (指挥官: ${defFleet.leaderName || "防守AI"})`,
      planetName: "深空要道",
      attackerPower: atkPower,
      defenderPower: defPower,
      rounds: battleRounds,
      winner,
      attackerRemainingHp: Math.max(0, atkHp),
      defenderRemainingHp: Math.max(0, defHp),
      outcomeLog
    };

    (game as any).lastBattleReport = report;
    window.dispatchEvent(new CustomEvent('battle-triggered'));

    return win;
  }

  private static calculateFleetPower(fleet: Fleet): number {
    if (!fleet.weapons || fleet.weapons.length === 0) {
      return 0;
    }

    let base = 0;
    fleet.weapons.forEach(w => {
      if (w.weaponName.includes("水滴") || w.weaponName.includes("探测器")) {
        base += w.currentBuild * 20;
      } else if (w.weaponName.includes("战舰") || w.weaponName.includes("恒星级")) {
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
