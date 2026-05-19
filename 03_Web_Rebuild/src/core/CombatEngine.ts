import { Fleet } from "./Fleet";
import { Barback } from "./Barback";
import { GameInstance } from "./Game";

export class CombatEngine {

  public static resolveFleetVsBarback(atkFleet: Fleet, defBarback: Barback): boolean {
    const game = GameInstance.get();

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

    while (atkHp > 0 && defHp > 0 && round < maxRounds) {
      round++;

      const atkDice = 0.8 + game.rng() * 0.4;
      const defDice = 0.85 + game.rng() * 0.5;

      const atkDamage = Math.floor(atkPower * atkDice);
      const defDamage = Math.floor(defPower * defDice);

      defHp -= atkDamage;
      game.addHistory(`>> 第${round}轮: 进攻方造成 ${atkDamage} 伤害，防守方剩余 HP: ${Math.max(0, defHp)}`);

      if (defHp <= 0) break;

      atkHp -= defDamage;
      game.addHistory(`>> 第${round}轮: 防守方造成 ${defDamage} 伤害，进攻方剩余 HP: ${Math.max(0, atkHp)}`);
    }

    if (defHp <= 0) {
      game.addHistory(`【战报】守军全军覆没，星系易主！`);
      return true;
    }

    if (atkHp <= 0) {
      game.addHistory(`【战报】进攻舰队被击溃，守军获得胜利！`);
      return false;
    }

    const finalRatio = atkHp / defHp;
    if (finalRatio > 1.3) {
      game.addHistory(`【战报】苦战后进攻方占据优势，星系易主！`);
      return true;
    }
    game.addHistory(`【战报】攻防双方僵持不下，防守方固守成功！`);
    return false;
  }

  public static resolveFleetVsFleet(atkFleet: Fleet, defFleet: Fleet): boolean {
    const game = GameInstance.get();
    const atkPower = this.calculateFleetPower(atkFleet);
    const defPower = this.calculateFleetPower(defFleet);

    let atkHp = atkPower;
    let defHp = defPower;
    let round = 0;

    while (atkHp > 0 && defHp > 0 && round < 3) {
      round++;
      const atkDice = 0.9 + game.rng() * 0.2;
      const defDice = 0.9 + game.rng() * 0.2;
      defHp -= Math.floor(atkPower * atkDice);
      atkHp -= Math.floor(defPower * defDice);
    }

    return defHp <= 0;
  }

  private static calculateFleetPower(fleet: Fleet): number {
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
