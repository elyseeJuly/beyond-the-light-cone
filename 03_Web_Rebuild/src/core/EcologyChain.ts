import { t } from "../utils/i18n";

/**
 * EcologyChain - 生态链涟漪效应系统 (UEE Layer 3-5)
 *
 * 实现事件之间的链式反应：一个事件触发后，经过若干回合延迟，
 * 可能衍生出后续事件，形成"涟漪效应"。
 *
 * 核心规则：
 * - 每个链式步骤有触发概率和延迟回合数
 * - 链式反应可以产生新的 Tag，影响后续事件权重
 * - 禁止跨越式触发（数值下降直接导致危机）
 */

export interface ChainStep {
  id: string;
  name: string;
  conditionEventId: string;     // 前序事件ID
  triggerDelay: number;          // 延迟回合数
  resultEventId: string;         // 结果事件ID
  producedTags: string[];        // 产生的 Tag
  consumedTags: string[];        // 消耗的 Tag（从世界中移除）
  probability: number;           // 触发概率 0-1
  suppressIfTagMissing: string[];// 缺少这些 Tag 时不触发
}

export interface ActiveChain {
  chainId: string;
  stepId: string;
  triggeredYear: number;
  remainingDelay: number;
  conditionEventId: string;
  resultEventId: string;
}

export class EcologyChain {
  public chains: ChainStep[] = [];
  public activeChains: ActiveChain[] = [];

  constructor() {
    this.initChains();
  }

  private initChains(): void {
    this.chains = [
      // === 经济危机链 ===
      {
        id: 'ration_to_riot',
        name: t("配给减少引发的社会动荡链"),
        conditionEventId: 'random_resource_rationing',
        triggerDelay: 3,
        resultEventId: 'random_underground_riot',
        producedTags: ['civil_unrest', 'underground_gangs'],
        consumedTags: [],
        probability: 0.6,
        suppressIfTagMissing: [],
      },
      {
        id: 'riot_to_crisis',
        name: t("地下骚乱升级为殖民危机"),
        conditionEventId: 'random_underground_riot',
        triggerDelay: 5,
        resultEventId: 'random_colony_crisis',
        producedTags: ['social_split'],
        consumedTags: ['underground_gangs'],
        probability: 0.4,
        suppressIfTagMissing: ['civil_unrest'],
      },

      // === 社会动荡链 ===
      {
        id: 'eto_to_social_unrest',
        name: t("ETO 活动引发社会动荡"),
        conditionEventId: 'random_eto_activity',
        triggerDelay: 2,
        resultEventId: 'random_civil_protest',
        producedTags: ['civil_unrest'],
        consumedTags: [],
        probability: 0.5,
        suppressIfTagMissing: ['eto_remnant'],
      },
      {
        id: 'protest_to_exile',
        name: t("抗议升级为逃亡主义"),
        conditionEventId: 'random_civil_protest',
        triggerDelay: 4,
        resultEventId: 'random_exile_movement',
        producedTags: ['exile_sentiment'],
        consumedTags: [],
        probability: 0.3,
        suppressIfTagMissing: ['civil_unrest', 'population_crisis'],
      },

      // === 科技危机链 ===
      {
        id: 'experiment_accident',
        name: t("实验事故引发连锁反应"),
        conditionEventId: 'random_experiment_failure',
        triggerDelay: 2,
        resultEventId: 'random_tech_disaster',
        producedTags: ['civil_unrest'],
        consumedTags: ['tech_boom'],
        probability: 0.35,
        suppressIfTagMissing: [],
      },

      // === 军事链 ===
      {
        id: 'fleet_loss_to_unrest',
        name: t("舰队损失引发民心不稳"),
        conditionEventId: 'random_fleet_ambush',
        triggerDelay: 2,
        resultEventId: 'random_military_setback_aftermath',
        producedTags: ['civil_unrest', 'deterrence_unstable'],
        consumedTags: ['deterrence_steady'],
        probability: 0.5,
        suppressIfTagMissing: [],
      },

      // === 威慑危机链 ===
      {
        id: 'deterrence_drop_to_crisis',
        name: t("威慑度下降引发危机"),
        conditionEventId: 'random_deterrence_incident',
        triggerDelay: 3,
        resultEventId: 'random_foil_warning',
        producedTags: ['deterrence_unstable'],
        consumedTags: ['deterrence_steady'],
        probability: 0.6,
        suppressIfTagMissing: [],
      },

      // === 生存链 ===
      {
        id: 'famine_to_population',
        name: t("饥荒引发人口危机"),
        conditionEventId: 'random_famine_event',
        triggerDelay: 4,
        resultEventId: 'random_population_collapse',
        producedTags: ['population_crisis', 'civil_unrest'],
        consumedTags: [],
        probability: 0.45,
        suppressIfTagMissing: [],
      },
    ];
  }

  /**
   * 检查链式反应，返回激活的链式步骤
   */
  checkChainReactions(
    recentlyTriggeredEventId: string,
    tagManager: any,
    currentYear: number,
    rng: () => number = Math.random
  ): ChainStep[] {
    // 清理已完成的链
    this.activeChains = this.activeChains.filter(c => c.remainingDelay > 0);

    const triggered: ChainStep[] = [];

    for (const chain of this.chains) {
      if (chain.conditionEventId !== recentlyTriggeredEventId) continue;

      // 检查抑制条件
      if (chain.suppressIfTagMissing.length > 0) {
        const allMissing = chain.suppressIfTagMissing.every(
          (tagId: string) => !tagManager.hasTag(tagId)
        );
        if (allMissing) continue;
      }

      // 概率判定
      if (rng() >= chain.probability) continue;

      // 添加活动的链式步骤
      this.activeChains.push({
        chainId: chain.id,
        stepId: chain.id,
        triggeredYear: currentYear,
        remainingDelay: chain.triggerDelay,
        conditionEventId: chain.conditionEventId,
        resultEventId: chain.resultEventId,
      });

      triggered.push(chain);
    }

    return triggered;
  }

  /**
   * 每回合推进，返回当前回合应该触发的事件ID列表
   */
  advanceTurn(tagManager: any, currentYear: number): string[] {
    const readyEvents: string[] = [];

    for (let i = this.activeChains.length - 1; i >= 0; i--) {
      this.activeChains[i].remainingDelay--;

      if (this.activeChains[i].remainingDelay <= 0) {
        const chain = this.activeChains[i];
        readyEvents.push(chain.resultEventId);

        // 应用产生的 Tag
        const chainDef = this.chains.find(c => c.id === chain.chainId);
        if (chainDef) {
          for (const tagId of chainDef.producedTags) {
            tagManager.applyWorldTag(tagId, 20, `ecology:${chainDef.id}`, currentYear);
          }
          for (const tagId of chainDef.consumedTags) {
            tagManager.removeWorldTag(tagId);
          }
        }

        this.activeChains.splice(i, 1);
      }
    }

    return readyEvents;
  }

  /** 获取活动的链式步骤（用于UI显示） */
  getActiveChains(): ActiveChain[] {
    return this.activeChains.filter(c => c.remainingDelay > 0);
  }

  // ===== 序列化 =====

  toJSON(): object {
    return {
      activeChains: this.activeChains,
    };
  }

  static fromJSON(data: any): EcologyChain {
    const ec = new EcologyChain();
    if (data?.activeChains) {
      ec.activeChains = data.activeChains;
    }
    return ec;
  }

  reset(): void {
    this.activeChains = [];
  }
}
