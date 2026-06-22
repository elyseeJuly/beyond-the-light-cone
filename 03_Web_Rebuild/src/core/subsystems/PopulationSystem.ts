import type { Game } from '../Game';
import type { Star } from '../Star';

/**
 * PopulationSystem - 人口与殖民地子系统
 *
 * 负责：
 * - 全文明人口容量计算
 * - 殖民地人口上限与增长约束
 * - 人口分布与迁移相关计算
 */
export class PopulationSystem {
  constructor(private game: Game) {}

  /** 计算所有已占领星球提供的额外人口上限 */
  public getColonyPopulationCapacity(): number {
    let capacity = 0;
    for (const star of this.game.starManager.getAllStars()) {
      if (star.belongToCivi === '地球' && star.hasCity) {
        capacity += star.populationLimit * 3;
      }
    }
    return capacity;
  }

  /** 获取地球本体人口上限（基础容量） */
  public getEarthPopulationCapacity(): number {
    return 300;
  }

  /** 计算文明总人口上限 */
  public getTotalPopulationCapacity(): number {
    return this.getEarthPopulationCapacity() + this.getColonyPopulationCapacity();
  }

  /** 检查是否超过总人口上限，并返回建议上限值 */
  public clampPopulation(value: number): number {
    const cap = this.getTotalPopulationCapacity();
    return Math.min(value, cap);
  }

  /** 获取已殖民星球列表 */
  public getColonizedStars(): Star[] {
    return this.game.starManager.getAllStars().filter(
      star => star.belongToCivi === '地球' && star.hasCity
    );
  }
}
