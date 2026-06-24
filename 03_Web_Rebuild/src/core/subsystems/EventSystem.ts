import type { Game } from '../Game';
import { EventEffect, FriendshipType, TecTreeType } from '../../types/enums';
import { CombatEngine } from '../CombatEngine';
import { createBarback } from '../Barback';

/**
 * EventSystem - 事件与效果子系统
 *
 * 负责：
 * - 剧情事件队列推进 (processNextEvent)
 * - 事件效果应用 (applyEventEffect)
 * - 新效果格式解析与应用 (applyNewEffects)
 */
export class EventSystem {
  constructor(private game: Game) {}

  public processNextEvent(): void {
    if (this.game.eventQueue.length > 0 && !this.game.currentEvent) {
      this.game.currentEvent = this.game.eventQueue.shift() || null;
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
    }
  }

  public applyEventEffect(effect: EventEffect, isInteractive: boolean = true): void {
    switch (effect) {
      case EventEffect.ADDECONEMY: this.game.earthCivi.economy = Math.max(0, this.game.earthCivi.economy + 50); break;
      case EventEffect.ADDCULTURE: this.game.earthCivi.culture = Math.max(0, this.game.earthCivi.culture + 30); break;
      case EventEffect.ADDPOP: this.game.earthCivi.population = Math.max(0, this.game.earthCivi.population + 20); break;
      case EventEffect.REDUCE_TREACHERY: this.game.earthCivi.treachery = Math.max(0, this.game.earthCivi.treachery - 15); break;
      case EventEffect.WAR: {
        const sanTi = this.game.alienCiviManager.aliens.get("三体");
        if (sanTi && !sanTi.isDieOut()) {
          sanTi.friendshipType = FriendshipType.VERYANGRY;
          this.game.addHistory("【战争】与三体文明进入战争状态！");
        }
        break;
      }
      case EventEffect.MOON_CRISIS:
        if (this.game.earthCivi.resource >= 500) {
          this.game.earthCivi.resource -= 500;
          this.game.addHistory("月球坠落危机被成功化解！消耗了500资源。");
        } else {
          this.game.earthCivi.population = Math.floor(this.game.earthCivi.population / 2);
          this.game.addHistory("月球坠入地球，人口减半！");
        }
        break;
      case EventEffect.WANDERING_EARTH:
        if (this.game.earthCivi.tecTreeManager.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型")) {
          this.game.addHistory("流浪地球计划启动！");
        } else {
          this.game.addHistory("缺少行星发动机技术，无法启动流浪地球计划！");
        }
        break;
    }
    this.game.currentEvent = null;
    if (isInteractive) {
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
      this.processNextEvent();
      if (this.game.eventQueue.length === 0 && !this.game.currentEvent && !this.game._yearJustAdvanced) {
        this.game.year++;
        this.game.updateEpoch();
        this.game.checkVictoryConditions();
        this.game.addHistory(`回合推进完成：${this.game.year - 1} -> ${this.game.year} (存活异星文明: ${this.game.alienCiviManager.aliens.size}, 待处理事件: ${this.game.eventQueue.length})`);
        window.dispatchEvent(new CustomEvent('game-turn-complete'));
      }
      this.game._yearJustAdvanced = false;
    }
  }

  /** 效果别名字典：将非规范别名映射为 Civilization 规范属性名 */
  private static readonly EFFECT_TARGET_ALIAS: Record<string, string> = {
    'prestige': 'deterrenceValue',
    'military': 'army',
  };

  private clampEffectValue(target: string, rawValue: number): number {
    const e = this.game.earthCivi;
    if (!e) return rawValue;

    const canonical = EventSystem.EFFECT_TARGET_ALIAS[target] || target;

    if (canonical === 'population') {
      const maxAbsChange = Math.max(10, e.population * 0.3);
      const absVal = Math.min(maxAbsChange, Math.abs(rawValue));
      return rawValue >= 0 ? absVal : -absVal;
    }

    if (['economy', 'culture', 'deterrenceValue', 'resource', 'army'].includes(canonical)) {
      let current = 0;
      if (canonical === 'deterrenceValue') current = e.deterrenceValue || 0;
      else if (canonical === 'army') current = e.army || 0;
      else current = (e as any)[canonical] || 0;

      const maxAbsChange = Math.max(50, current * 0.5);
      const absVal = Math.min(maxAbsChange, Math.abs(rawValue));
      return rawValue >= 0 ? absVal : -absVal;
    }
    return rawValue;
  }

  public applyNewEffects(effects: any[]): void {
    if (!effects) return;
    effects.forEach(eff => {
      if (eff.type === 'resource') {
        const canonicalTarget = EventSystem.EFFECT_TARGET_ALIAS[eff.target] || eff.target;
        const val = this.clampEffectValue(canonicalTarget, Number(eff.value));
        if (val < 0) {
          const absVal = Math.abs(val);
          switch (canonicalTarget) {
            case 'army': this.game.earthCivi.army -= absVal; break;
            case 'economy': this.game.earthCivi.economy -= absVal; break;
            case 'population': this.game.earthCivi.population -= absVal; break;
            case 'culture': this.game.earthCivi.culture -= absVal; break;
            case 'deterrenceValue': this.game.earthCivi.deterrenceValue -= absVal; break;
            case 'treachery': this.game.earthCivi.treachery = Math.max(0, this.game.earthCivi.treachery - absVal); break;
            case 'resource': this.game.earthCivi.resource -= absVal; break;
          }
        } else {
          switch (canonicalTarget) {
            case 'army': this.game.earthCivi.army += val; break;
            case 'economy': this.game.earthCivi.economy += val; break;
            case 'population': this.game.earthCivi.population += val; break;
            case 'culture': this.game.earthCivi.culture += val; break;
            case 'deterrenceValue': this.game.earthCivi.deterrenceValue += val; break;
            case 'treachery': this.game.earthCivi.treachery = Math.min(100, this.game.earthCivi.treachery + val); break;
            case 'resource': this.game.earthCivi.resource += val; break;
          }
        }
      } else if (eff.type === 'flag') {
        this.game.addFlag(eff.target);
        this.game.addHistory(`[因果标记] 已激活: ${eff.target}`);
      } else if (eff.type === 'unlock_person') {
        this.applyUnlockPerson(eff.target);
      } else if (eff.type === 'event_effect') {
        this.applyEventEffect(eff.value as EventEffect, false);
      } else if (eff.type === 'diplomacy') {
        const alien = this.game.alienCiviManager.aliens.get(eff.target);
        if (alien) {
          const newFt = Math.min(FriendshipType.VERYFRIEND, Math.max(FriendshipType.VERYANGRY, alien.friendshipType + eff.value));
          alien.friendshipType = newFt;
          if (newFt >= FriendshipType.VERYFRIEND) {
            alien.isBund = true;
            this.game.addHistory(`【外交】与${eff.target}结成同盟！`);
          }
        }
      } else if (eff.type === 'spawn_barback') {
        const starIdx = eff.targetStarIndex ?? 0;
        const targetStar = this.game.starManager.getStar(starIdx);
        if (targetStar) {
          const rebel = createBarback(`rebel_${starIdx}_${Date.now()}`, starIdx);
          rebel.soldierCount = eff.value ?? 50;

          const defender = this.game.starManager.getStarDefenseForce(targetStar);
          let rebelWins = false;
          if (defender && rebel.soldierCount > defender.soldierCount) {
            rebelWins = true;
            this.game.addHistory(`【紧急军情】${targetStar.name} 爆发大规模叛乱，星系已沦陷！`);
          } else {
            rebelWins = CombatEngine.resolveBarbackRaid(targetStar, rebel);
            this.game.addHistory(`【军情】${targetStar.name} 爆发叛乱，驻军正在镇压中。`);
          }

          if (rebelWins) {
            const oldOwner = targetStar.belongToCivi;
            targetStar.belongToCivi = '';
            if (oldOwner && oldOwner !== '地球' && oldOwner !== '') {
              this.game.alienCiviManager.loseStar(oldOwner, starIdx);
            }
            this.game.earthCivi.starIndices.delete(starIdx);
          }

          this.game.starManager.markStarStatus(targetStar, 'rebellion');
        }
      } else if (eff.type === 'lock_ratio') {
        if (eff.target && eff.duration) {
          this.game.earthCivi.ratioLocks.push({
            type: eff.target as 'mining' | 'factory' | 'culture',
            max: eff.value ?? 50,
            duration: eff.duration,
          });
          this.game.addHistory(`【政策】${eff.target} 工种比例被强制限制在 ${eff.value ?? 50}% 以内，持续 ${eff.duration} 回合。`);
        }
      } else if (eff.type === 'rush_tech') {
        const treeType = this.parseTecTreeType(eff.target);
        if (treeType !== null) {
          const amount = eff.techAmount ?? eff.value ?? 100;
          const currentResearch = this.game.earthCivi.getResearchTarget(treeType);
          if (currentResearch) {
            const finished = this.game.earthCivi.tecTreeManager.addProgress(treeType, currentResearch, amount);
            this.game.addHistory(`【科技】${eff.target} 研究取得突破性进展，进度 +${amount}。`);
            if (finished) {
              this.game.addHistory(`【科技】${currentResearch} 研究完成！`);
            }
          }
        }
      } else if (eff.type === 'build_infrastructure') {
        const starIdx = eff.targetStarIndex ?? 0;
        const targetStar = this.game.starManager.getStar(starIdx);
        if (targetStar) {
          const infraType = eff.target;
          const success = this.game.starManager.buildInfrastructure(targetStar, infraType, eff.value ?? 10);
          if (success) {
            this.game.addHistory(`【建设】${targetStar.name} 新建了 ${infraType} 设施。`);
            this.game.starManager.markStarStatus(targetStar, 'building');
          }
        }
      } else if (eff.type === 'spend_ap') {
        const cost = eff.value ?? 10;
        this.game.earthCivi.spendAP(cost);
      }
    });
  }

  /** 将科技树类型名称解析为枚举值 */
  private parseTecTreeType(raw: string): TecTreeType | null {
    const map: Record<string, TecTreeType> = {
      physics: TecTreeType.PHYSICS,
      aerospace: TecTreeType.AEROSPACE,
      military: TecTreeType.MILITARY,
      information: TecTreeType.INFORMATION,
      interstellar: TecTreeType.INTERSTELLAR,
      物理: TecTreeType.PHYSICS,
      工程: TecTreeType.AEROSPACE,
      航天: TecTreeType.AEROSPACE,
      军事: TecTreeType.MILITARY,
      信息: TecTreeType.INFORMATION,
      星际: TecTreeType.INTERSTELLAR,
    };
    return map[raw] ?? null;
  }

  private applyUnlockPerson(target: string): void {
    this.game.personManager.unlockPerson(target);
    this.game.addHistory(`【人员加入】${target} 加入了您的阵营！`);
    this.game.playerTimeline.push({ year: this.game.year, event: `重要历史人物 ${target} 正式登场` });

    const introData: Record<string, { role: string; content: string }> = {
      "伊文斯": { role: "降临派领袖", content: "建造审判日号，与三体文明建立深海直接联系。" },
      "林云": { role: "天才武器科学家", content: "对球状闪电和宏原子武器具有执着的研究。" },
      "罗辑": { role: "第四位面壁者", content: "人类唯一的破壁人，宇宙黑暗森林法则的悟道者。" },
      "泰勒": { role: "第一位面壁者", content: "筹备量子化舰队，试图以死去的幽灵抵抗侵略。" },
      "雷迪亚兹": { role: "第二位面壁者", content: "筹划水星核爆，拟用与太阳系同归于尽的方式实施威慑。" },
      "希恩斯": { role: "第三位面壁者", content: "脑科学家，暗中打下思想钢印，开启逃亡计划。" },
      "章北海": { role: "太空军政委", content: "增援未来实施者，谋划百年逃亡，自然选择号逆天启航。" },
      "庄颜": { role: "画中人", content: "罗辑的挚爱，面壁计划中最温柔的人性火种与背景图景。" },
      "程心": { role: "第二代执剑人", content: "爱的圣母，在冷酷宇宙博弈中让地球错失两次生存良机。" },
      "维德": { role: "PIA首任局长", content: "终身践行「前进！前进！不择手段地前进」的冷酷钢铁人物。" },
      "艾AA": { role: "星空企业家", content: "活泼聪颖的商业天才，在世界末日中维系人类生的希望。" },
      "云天明": { role: "大脑流浪者", content: "被三体捕获重构，以三个童话故事破译并传递最后的宇宙生路。" },
      "智子": { role: "三体文明代言人", content: "优雅日本女性形态，美丽之下操控超维计算，宣判人类流放。" },
      "关一帆": { role: "星舰探索员", content: "深空探索先驱，于宇宙二维化的宏大边缘守望最后的余晖。" }
    };
    const intro = introData[target];
    const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
    const epName = epochNames[this.game.epoch] || "未知纪元";
    if (intro) {
      this.game.tickerMessages.push(`👥 [战略人事公报] ${epName} ${this.game.year} 年 - 【重要人物正式入列】${target} (${intro.role})。"${intro.content}"`);
    } else {
      this.game.tickerMessages.push(`👥 [战略人事公报] ${epName} ${this.game.year} 年 - 【人员加入】重要人物 ${target} 正式加入统帅部。`);
    }

    if (["罗辑", "泰勒", "雷迪亚兹", "希恩斯"].includes(target)) {
      this.game.earthCivi.wallfacers.add(target);
      this.game.addHistory(`【系统提醒】面壁者 ${target} 已自动列入宇宙社会学-面壁计划执行名单。`);
    }

    window.dispatchEvent(new CustomEvent('ticker-message-added'));
  }
}
