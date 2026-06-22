import type { Game } from '../Game';

/**
 * EconomySystem - 经济与文化子系统
 *
 * 负责：
 * - 文明等级评估与升级 (updateCiviLevel)
 * - 经济/文化相关数值变化的统一入口
 */
export class EconomySystem {
  constructor(private game: Game) {}

  public updateCiviLevel(oldCulture: number): void {
    const c = this.game.earthCivi.culture;
    this.game.earthCivi.civiLevel =
      c >= 1000 ? 4 :
      c >= 500 ? 3 :
      c >= 200 ? 2 :
      c >= 70 ? 1 : 0;

    if (this.game.earthCivi.civiLevel > 0 && oldCulture < this.getLevelThreshold(this.game.earthCivi.civiLevel)) {
      this.game.addHistory(`【文明升级】人类文明达到「${this.game.earthCivi.getCiviLevelLabel()}」等级！军队战斗力获得强化。`);
      this.game.earthCivi.army += 20;
    }
  }

  private getLevelThreshold(level: number): number {
    return [0, 70, 200, 500, 1000][level] || 0;
  }
}
