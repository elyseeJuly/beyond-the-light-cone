import { EpochType, EventEffect, FriendshipType, TecTreeType, VictoryType, EventType, DefeatType, LoreMode } from "../types/enums";
import { StarManager } from "./StarManager";
import { PersonManager } from "./PersonManager";
import { WeaponManager } from "./WeaponManager";
import { GameEventManager } from "./GameEventManager";
import { EarthCivilization } from "./EarthCivilization";
import { AlienCiviManager, AlienCivilization } from "./AlienCivilization";
import { TecTreeManager } from "./TecTreeManager";
import { TecTree } from "./TecTree";
import { GameEventPayload, VictoryCondition, FilteredEventPayload } from "../types/narrative";
import { createFleet } from "./Fleet";
import { createGameEvent } from "./GameEvent";
import { EVENT_BUDGET } from "./EventCadence";

export interface RngProvider {
  random(): number;
}

export class Game {
  public year: number = 0;
  public epoch: EpochType = EpochType.CRISIS;
  public historyLogs: string[] = [];
  public playerTimeline: Array<{ year: number; event: string }> = [];
  public tickerMessages: string[] = [];

  public starManager: StarManager;
  public personManager: PersonManager;
  public weaponManager: WeaponManager;
  public eventManager: GameEventManager;

  public earthCivi: EarthCivilization;
  public alienCiviManager: AlienCiviManager;

  public currentEvent: GameEventPayload | null = null;
  public eventQueue: GameEventPayload[] = [];
  public isGameOver: boolean = false;
  public gameOverReason: string = "";
  public victoryType: VictoryType | null = null;
  public defeatType: DefeatType | null = null;
  public isProcessing: boolean = false;

  public flags: Set<string> = new Set();
  public filteredEvents: FilteredEventPayload[] = [];
  public loreMode: LoreMode = 'strict_three_body';

  private _rngProvider: RngProvider | null = null;

  constructor() {
    this.starManager = new StarManager();
    this.personManager = new PersonManager();
    this.weaponManager = new WeaponManager();
    this.eventManager = new GameEventManager();

    this.earthCivi = new EarthCivilization();
    this.alienCiviManager = new AlienCiviManager();
  }

  public setRngProvider(provider: RngProvider): void {
    this._rngProvider = provider;
    this.earthCivi.setRngProvider(provider);
    this.alienCiviManager.setRngProvider(provider);
  }

  public rng(): number {
    return this._rngProvider ? this._rngProvider.random() : Math.random();
  }

  public rngChance(probability: number): boolean {
    return this.rng() < probability;
  }

  public rngInt(min: number, max: number): number {
    return min + Math.floor(this.rng() * (max - min + 1));
  }

  public getYear(): number {
    return this.year;
  }

  public getEpoch(): EpochType {
    return this.epoch;
  }

  public addHistory(log: string): void {
    const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元"];
    const prefix = `${epochNames[this.epoch]} ${this.year} 年 - `;
    this.historyLogs.push(prefix + log);
    console.log("[History]", prefix + log);
  }

  public addFlag(flag: string): void {
    this.flags.add(flag);
    console.log("[Flag] Activated:", flag);
  }

  public hasFlag(flag: string): boolean {
    return this.flags.has(flag);
  }

  public removeFlag(flag: string): void {
    this.flags.delete(flag);
  }

  public isSophonBlocked(): boolean {
    if (this.year < 10) return false;
    const sanTi = this.alienCiviManager.aliens.get("三体");
    if (sanTi && !sanTi.isDieOut() && sanTi.friendshipType < FriendshipType.FRIEND) {
      const tecMgr = this.earthCivi.tecTreeManager;
      if (tecMgr.isTecFinished(TecTreeType.INFORMATION, "550W量子计算机") ||
          tecMgr.isTecFinished(TecTreeType.PHYSICS, "智子工程")) {
        return false;
      }
      return true;
    }
    return false;
  }

  public runARound(): void {
    if (this.isGameOver) return;

    if (this.currentEvent || this.eventQueue.length > 0) {
      this.addHistory("提示：请先处理当前的剧情事件。");
      return;
    }

    if (this.isProcessing) {
      console.warn("Turn blocked by processing lock");
      return;
    }

    this.isProcessing = true;
    this.addHistory(">>> 开始结算当前回合逻辑...");

    try {
      this.addHistory("...正在处理文明资源与人口增长");
      try {
        this.earthCivi.runARound();
      } catch (e: any) {
        this.addHistory(`[警告] 地球模拟出现异常: ${e.message}`);
      }

      this.addHistory("...正在评估异星文明威胁");
      try {
        this.alienCiviManager.runARound();
      } catch (e: any) {
        this.addHistory(`[警告] 异星模拟出现异常: ${e.message}`);
      }

      this.addHistory("...正在更新外交冷却");
      for (const alien of this.alienCiviManager.aliens.values()) {
        if (alien.diplomacyCooldown > 0) alien.diplomacyCooldown--;
      }

      this.addHistory("...正在检索纪元剧情事件");
      const triggeredEvents = this.eventManager.checkEvents(this.year);

      const hasMilestone = triggeredEvents.some(e => e.cadenceMeta?.lane === 'milestone');

      this.addHistory("...正在评估随机叙事事件");
      if (!hasMilestone) {
        if (this.rngChance(0.25)) {
          const randomEvent = this.eventManager.checkRandomEvents();
          if (randomEvent) {
            triggeredEvents.push(randomEvent);
          }
        }
      }

      this.addHistory("...正在检查条件过滤事件");
      const filteredEvts = this.eventManager.getFilteredEventsForTurn();
      for (const fev of filteredEvts) {
        if (!this.rngChance(0.5)) continue;

        const totalEventsThisTurn = triggeredEvents.length;
        if (totalEventsThisTurn >= EVENT_BUDGET.maxEventsPerTurn) break;

        this.addHistory(`触发条件事件: ${fev.title}`);
        this.eventManager.markFilteredEventTriggered(fev.id, this.year);

        const fevGameEvent = createGameEvent(fev.title, EventType.RANDOM, this.year, fev.tip, EventEffect.NONE, fev.dialogQueue, fev.id);
        fevGameEvent.choices = fev.choices?.map(c => ({
          label: c.label,
          effects: c.effects,
          action: () => {
            if (c.effects) this.applyNewEffects(c.effects);
            if (c.flags) c.flags.forEach((f: string) => this.addFlag(f));
          }
        }));
        triggeredEvents.push(fevGameEvent);
      }

      const tickerEvents = triggeredEvents.filter(e => !e.choices || e.choices.length === 0);
      const interactiveEvents = triggeredEvents.filter(e => e.choices && e.choices.length > 0);

      // Process non-blocking scrolling ticker events immediately
      tickerEvents.forEach(e => {
        const text = e.dialogNodes && e.dialogNodes.length > 0 ? e.dialogNodes[0].content : e.tip;
        this.addHistory(`[大事记] ${e.name}: ${text}`);
        this.tickerMessages.push(`${e.name}: ${text}`);
        if (e.effects) this.applyNewEffects(e.effects);
        this.applyEventEffect(e.effect);
      });
      if (tickerEvents.length > 0) {
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      }

      // Process blocking interactive strategy events via popup queue
      interactiveEvents.forEach(e => {
        this.addHistory(`触发抉择事件: ${e.name}`);
        console.log("[Narrative] Triggered Choice:", e.name);

        const payload: GameEventPayload = {
          id: e.id || `event_${this.year}_${e.name}`,
          title: e.name,
          dialogQueue: e.dialogNodes.length > 0 ? e.dialogNodes : [{
            speakerName: "系统",
            content: e.tip
          }],
          choices: e.choices!.map(c => ({
            label: c.label,
            action: () => {
              if (c.effects) this.applyNewEffects(c.effects);
              if ((c as any).flags) (c as any).flags.forEach((f: string) => this.addFlag(f));
              this.applyEventEffect(e.effect);
            }
          }))
        };
        this.eventQueue.push(payload);
      });

      this.year++;

      this.updateEpoch();
      this.checkVictoryConditions();

      this.processNextEvent();
      this.addHistory(`回合推进完成：${this.year - 1} -> ${this.year} (存活异星文明: ${this.alienCiviManager.aliens.size}, 待处理事件: ${this.eventQueue.length})`);
    } catch (err: any) {
      console.error("Critical error in runARound:", err);
      this.addHistory(`【核心崩溃】结算失败! 错误详情: ${err?.message || "未知错误"}`);
      this.addHistory("系统已尝试紧急回滚状态锁，请尝试再次点击或重新开始。");
    } finally {
      this.isProcessing = false;
    }
  }

  public updateEpoch(): void {
    const prevEpoch = this.epoch;

    if (this.year >= 1 && this.year <= 200) {
      this.epoch = EpochType.CRISIS;
    } else if (this.year >= 201 && this.year <= 260) {
      this.epoch = EpochType.DETERRENCE;
    } else if (this.year >= 261 && this.year <= 300) {
      this.epoch = EpochType.BROADCAST;
    } else if (this.year >= 301 && this.year <= 350) {
      this.epoch = EpochType.BUNKER;
    } else if (this.year >= 351) {
      this.epoch = EpochType.GALAXY;
    }

    if (prevEpoch !== this.epoch) {
      const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元"];
      this.addHistory(`【纪元更替】进入${epochNames[this.epoch]}！`);
      this.playerTimeline.push({ year: this.year, event: `【纪元更替】人类正式进入${epochNames[this.epoch]}` });
      window.dispatchEvent(new CustomEvent('epoch-changed'));
    }
  }

  public checkVictoryConditions(): void {
    const conditions: VictoryCondition[] = [
      {
        type: "HIDDEN",
        label: "死神永生 · 小宇宙",
        description: "归零者的讯息抵达，人类选择将小宇宙的质量归还大宇宙，文明化为永恒的生态球",
        check: () => {
          if (this.year < 350 || this.epoch < EpochType.GALAXY) return false;
          if (this.earthCivi.culture < 800) return false;
          if (!this.hasFlag("galaxy_exodus_seen")) return false;
          if (!this.hasFlag("alien_alliance")) return false;
          if (this.earthCivi.population <= 0) return false;
          if (this.earthCivi.deterrenceValue < 30) return false;
          const tm = this.earthCivi.tecTreeManager;
          return tm.isTecFinishedAnywhere("黑域生成") || tm.isTecFinishedAnywhere("数字方舟");
        }
      },
      {
        type: "WANDERING",
        label: "流浪胜利",
        description: "完成行星发动机Ⅲ型与新家园选址，带领地球踏上星辰大海",
        check: () => {
          const tm = this.earthCivi.tecTreeManager;
          return tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型") &&
                 tm.isTecFinished(TecTreeType.INTERSTELLAR, "新家园选址");
        }
      },
      {
        type: "DIGITAL",
        label: "数字永生胜利",
        description: "完成数字方舟，将人类意识上传至虚拟世界",
        check: () => {
          return this.earthCivi.tecTreeManager.isTecFinished(TecTreeType.INFORMATION, "数字方舟");
        }
      },
      {
        type: "DETERRENCE",
        label: "威慑胜利",
        description: "在威慑纪元中拥有执剑人，维持威慑平衡",
        check: () => {
          return this.epoch >= EpochType.DETERRENCE &&
                 this.earthCivi.swordholder !== null &&
                 this.earthCivi.population > 0 &&
                 this.earthCivi.deterrenceValue >= 80;
        }
      },
      {
        type: "CONQUEST",
        label: "征服胜利",
        description: "消灭所有异星文明或使其臣服",
        check: () => {
          return this.alienCiviManager.isAllCiviConquered();
        }
      },
      {
        type: "DARK_DOMAIN",
        label: "黑域胜利",
        description: "完成黑域生成技术，发布宇宙安全声明",
        check: () => {
          return this.earthCivi.tecTreeManager.isTecFinishedAnywhere("黑域生成");
        }
      },
    ];

    for (const cond of conditions) {
      if (cond.check()) {
        this.isGameOver = true;
        this.gameOverReason = `${cond.label}: ${cond.description}`;
        this.victoryType = VictoryType[cond.type as keyof typeof VictoryType];
        this.playerTimeline.push({ year: this.year, event: `【大结局】达成 ${cond.label}` });
        window.dispatchEvent(new CustomEvent('game-over'));
        return;
      }
    }

    if (this.earthCivi.treachery >= 100) {
      this.isGameOver = true;
      this.defeatType = DefeatType.TREACHERY;
      this.gameOverReason = "逃亡主义失控：人类放弃了最后的希望，文明在内耗中走向崩溃。";
      this.playerTimeline.push({ year: this.year, event: '【终结】逃亡主义吞噬了文明最后的秩序' });
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if (this.earthCivi.population <= 0) {
      this.isGameOver = true;
      this.defeatType = DefeatType.EXTINCTION;
      this.gameOverReason = "文明灭绝：地球已成为一颗死寂的星球。";
      this.playerTimeline.push({ year: this.year, event: '【终结】最后的人类在沉默中消逝' });
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if (this.year > 350 && !this.earthCivi.tecTreeManager.isTecFinishedAnywhere("黑域生成") && !this.earthCivi.tecTreeManager.isTecFinishedAnywhere("数字方舟") && !this.hasFlag("dimensional_defense") && !this.hasFlag("wandering_chosen")) {
      this.isGameOver = true;
      this.defeatType = DefeatType.HELIUM_FLASH;
      this.gameOverReason = this.loreMode === 'strict_three_body'
        ? "二向箔打击：黑暗森林打击降临，太阳系从三维空间跌入二维。文明未能逃逸。"
        : "太阳氦闪：漫长的等待终结于刺眼的白光，地球未能逃离。";
      this.playerTimeline.push({ year: this.year, event: this.loreMode === 'strict_three_body' ? '【终结】二向箔降维打击抹去了整个太阳系' : '【终结】太阳的死亡终结了一切' });
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }
  }

  public checkGameOverConditions(): void {
    this.checkVictoryConditions();
  }

  public processNextEvent(): void {
    if (this.eventQueue.length > 0 && !this.currentEvent) {
      this.currentEvent = this.eventQueue.shift() || null;
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
    }
  }

  public applyEventEffect(effect: EventEffect): void {
    switch (effect) {
      case EventEffect.ADDECONEMY: this.earthCivi.economy = Math.max(0, this.earthCivi.economy + 50); break;
      case EventEffect.ADDCULTURE: this.earthCivi.culture = Math.max(0, this.earthCivi.culture + 30); break;
      case EventEffect.ADDPOP: this.earthCivi.population = Math.max(0, this.earthCivi.population + 20); break;
      case EventEffect.REDUCE_TREACHERY: this.earthCivi.treachery = Math.max(0, this.earthCivi.treachery - 15); break;
      case EventEffect.WAR:
        const sanTi = this.alienCiviManager.aliens.get("三体");
        if (sanTi && !sanTi.isDieOut()) {
          sanTi.friendshipType = FriendshipType.VERYANGRY;
          this.addHistory("【战争】与三体文明进入战争状态！");
        }
        break;
      case EventEffect.MOON_CRISIS:
        if (this.earthCivi.resource >= 500) {
          this.earthCivi.resource -= 500;
          this.addHistory("月球坠落危机被成功化解！消耗了500资源。");
        } else {
          this.earthCivi.population = Math.floor(this.earthCivi.population / 2);
          this.addHistory("月球坠入地球，人口减半！");
        }
        break;
      case EventEffect.WANDERING_EARTH:
        if (this.earthCivi.tecTreeManager.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型")) {
          this.addHistory("流浪地球计划启动！");
        } else {
          this.addHistory("缺少行星发动机技术，无法启动流浪地球计划！");
        }
        break;
    }
    this.currentEvent = null;
    window.dispatchEvent(new CustomEvent('game-event-triggered'));
    this.processNextEvent();
    window.dispatchEvent(new CustomEvent('game-turn-complete'));
  }

  public applyNewEffects(effects: any[]): void {
    if (!effects) return;
    effects.forEach(eff => {
      if (eff.type === 'resource') {
        const val = Number(eff.value);
        if (val < 0) {
          switch (eff.target) {
            case 'military':
              this.earthCivi.army -= Math.min(this.earthCivi.army * 0.5, Math.abs(val));
              break;
            case 'economy': this.earthCivi.economy -= Math.min(this.earthCivi.economy * 0.5, Math.abs(val)); break;
            case 'population': this.earthCivi.population -= Math.min(this.earthCivi.population * 0.5, Math.abs(val)); break;
            case 'culture': this.earthCivi.culture -= Math.min(this.earthCivi.culture * 0.5, Math.abs(val)); break;
            case 'prestige': this.earthCivi.deterrenceValue -= Math.min(this.earthCivi.deterrenceValue * 0.5, Math.abs(val)); break;
            case 'treachery': this.earthCivi.treachery = Math.max(0, this.earthCivi.treachery - Math.abs(val)); break;
            case 'resource': this.earthCivi.resource -= Math.min(this.earthCivi.resource * 0.5, Math.abs(val)); break;
            case 'army': this.earthCivi.army -= Math.min(this.earthCivi.army * 0.5, Math.abs(val)); break;
          }
        } else {
          switch (eff.target) {
            case 'military': 
              this.earthCivi.army += val; 
              break;
            case 'economy': this.earthCivi.economy += val; break;
            case 'population': this.earthCivi.population += val; break;
            case 'culture': this.earthCivi.culture += val; break;
            case 'prestige': this.earthCivi.deterrenceValue += val; break;
            case 'treachery': this.earthCivi.treachery = Math.min(100, this.earthCivi.treachery + val); break;
            case 'resource': this.earthCivi.resource += val; break;
            case 'army': this.earthCivi.army += val; break;
          }
        }
      } else if (eff.type === 'flag') {
        this.addFlag(eff.target);
        this.addHistory(`[因果标记] 已激活: ${eff.target}`);
      } else if (eff.type === 'unlock_person') {
        this.personManager.unlockPerson(eff.target);
        this.addHistory(`【人员加入】${eff.target} 加入了您的阵营！`);
        this.playerTimeline.push({ year: this.year, event: `重要历史人物 ${eff.target} 正式登场` });
        
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
          "维德": { role: "PIA首任局长", content: "终身践行“前进！前进！不择手段地前进”的冷酷钢铁人物。" },
          "艾AA": { role: "星空企业家", content: "活泼聪颖的商业天才，在世界末日中维系人类生的希望。" },
          "云天明": { role: "大脑流浪者", content: "被三体捕获重构，以三个童话故事破译并传递最后的宇宙生路。" },
          "智子": { role: "三体文明代言人", content: "优雅日本女性形态，美丽之下操控超维计算，宣判人类流放。" },
          "关一帆": { role: "星舰探索员", content: "深空探索先驱，于宇宙二维化的宏大边缘守望最后的余晖。" }
        };
        const intro = introData[eff.target];
        const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元"];
        const epName = epochNames[this.epoch] || "未知纪元";
        if (intro) {
          this.tickerMessages.push(`👥 [战略人事公报] ${epName} ${this.year} 年 - 【重要人物正式入列】${eff.target} (${intro.role})。“${intro.content}”`);
        } else {
          this.tickerMessages.push(`👥 [战略人事公报] ${epName} ${this.year} 年 - 【人员加入】重要人物 ${eff.target} 正式加入统帅部。`);
        }
        
        // Auto-assign wallfacers to the Wallfacer Project when they are unlocked
        if (["罗辑", "泰勒", "雷迪亚兹", "希恩斯"].includes(eff.target)) {
          this.earthCivi.wallfacers.add(eff.target);
          this.addHistory(`【系统提醒】面壁者 ${eff.target} 已自动列入宇宙社会学-面壁计划执行名单。`);
        }
        
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      } else if (eff.type === 'event_effect') {
        this.applyEventEffect(eff.value as EventEffect);
      } else if (eff.type === 'diplomacy') {
        const alien = this.alienCiviManager.aliens.get(eff.target);
        if (alien) {
          const newFt = Math.min(FriendshipType.VERYFRIEND, Math.max(FriendshipType.VERYANGRY, alien.friendshipType + eff.value));
          alien.friendshipType = newFt;
          if (newFt >= FriendshipType.VERYFRIEND) {
            alien.isBund = true;
            this.addHistory(`【外交】与${eff.target}结成同盟！`);
          }
        }
      }
    });
  }

  public conductDiplomacy(alienName: string, actionType: string): string {
    const alien = this.alienCiviManager.aliens.get(alienName);
    if (!alien || alien.isDieOut()) return `无法与已灭亡的文明 ${alienName} 进行外交。`;
    if (alien.diplomacyCooldown > 0) return `外交冷却中，还需等待 ${alien.diplomacyCooldown} 回合。`;

    const game = this;
    const e = game.earthCivi;

    alien.diplomacyCooldown = 3;

    switch (actionType) {
      case 'negotiate':
        alien.friendshipType = Math.min(FriendshipType.VERYFRIEND, alien.friendshipType + 1);
        return `与 ${alienName} 的外交谈判取得进展，关系提升。`;
      case 'trade':
        if (e.economy >= 30) {
          e.economy -= 30;
          e.resource += 50;
          return `与 ${alienName} 完成贸易交换：-30经济，+50资源。`;
        }
        return `经济不足以进行贸易（需要30）。`;
      case 'provoke':
        alien.friendshipType = Math.max(FriendshipType.VERYANGRY, alien.friendshipType - 1);
        return `对 ${alienName} 发出战争挑衅，关系恶化。`;
      case 'alliance':
        if (alien.friendshipType >= FriendshipType.FRIEND) {
          alien.isBund = true;
          alien.friendshipType = Math.min(FriendshipType.VERYFRIEND, alien.friendshipType + 1);
          return `与 ${alienName} 正式结成战略同盟！`;
        }
        return `${alienName} 拒绝了同盟提议，关系不足。`;
      default:
        return `未知的外交行动：${actionType}`;
    }
  }

  public updateCiviLevel(oldCulture: number): void {
    const c = this.earthCivi.culture;
    this.earthCivi.civiLevel =
      c >= 1000 ? 4 :
      c >= 500 ? 3 :
      c >= 200 ? 2 :
      c >= 70 ? 1 : 0;

    if (this.earthCivi.civiLevel > 0 && oldCulture < this.getLevelThreshold(this.earthCivi.civiLevel)) {
      this.addHistory(`【文明升级】人类文明达到「${this.earthCivi.getCiviLevelLabel()}」等级！军队战斗力获得强化。`);
      this.earthCivi.army += 20;
    }
  }

  private getLevelThreshold(level: number): number {
    return [0, 70, 200, 500, 1000][level] || 0;
  }


}

// 全局单例管理器
export class GameInstance {
  private static instance: Game | null = null;

  public static get(): Game {
    if (!this.instance) {
      this.instance = new Game();
    }
    return this.instance;
  }

  public static reset(): void {
    localStorage.removeItem("LegendOfUni_Save");
    this.instance = new Game();
    setTimeout(() => window.dispatchEvent(new CustomEvent('open-tutorial')), 500);
  }

  public static saveGame(): void {
    if (!this.instance) return;
    this.instance.addHistory("游戏已保存到本地存储。");
    const saveData = { version: 3, timestamp: Date.now(), data: JSON.stringify(this.instance, this.replacer) };
    localStorage.setItem("LegendOfUni_Save", JSON.stringify(saveData));
  }

  public static loadGame(): boolean {
    try {
      const rawStr = localStorage.getItem("LegendOfUni_Save");
      if (!rawStr) return false;

      let dataStr: string;
      try {
        const wrapper = JSON.parse(rawStr);
        if (wrapper && typeof wrapper === 'object' && wrapper.data) {
          dataStr = wrapper.data;
        } else {
          dataStr = rawStr;
        }
      } catch {
        dataStr = rawStr;
      }

      const parsedData = JSON.parse(dataStr, this.reviver);
      this.instance = new Game();

      Object.assign(this.instance, parsedData);

      this.restorePrototypes();

      this.instance.currentEvent = null;
      this.instance.eventQueue = [];
      this.instance.isProcessing = false;

      if (!this.validateSaveIntegrity()) {
        console.error("Save data integrity check failed, resetting game.");
        this.reset();
        return false;
      }

      this.instance.addHistory("【系统】游戏读取成功。");
      window.dispatchEvent(new CustomEvent('game-loaded'));
      return true;
    } catch (e) {
      console.error("Failed to load game:", e);
      return false;
    }
  }

  private static restorePrototypes(): void {
    const inst = this.instance!;
    const safeSP = (obj: any, proto: any) => { if (obj) Object.setPrototypeOf(obj, proto); };

    safeSP(inst.earthCivi, EarthCivilization.prototype);
    safeSP(inst.alienCiviManager, AlienCiviManager.prototype);
    safeSP(inst.earthCivi?.tecTreeManager, TecTreeManager.prototype);
    safeSP(inst.starManager, StarManager.prototype);
    safeSP(inst.personManager, PersonManager.prototype);
    safeSP(inst.eventManager, GameEventManager.prototype);
    if (inst.eventManager && (!inst.eventManager.events || inst.eventManager.events.length === 0)) {
      inst.eventManager.init();
    }
    if (inst.eventManager) {
      if (!(inst.eventManager.lastLaneTriggeredYear instanceof Map)) {
        inst.eventManager.lastLaneTriggeredYear = new Map(Object.entries(inst.eventManager.lastLaneTriggeredYear || {})) as Map<import('../types/enums').EventLane, number>;
      }
      if (!(inst.eventManager.randomEventTriggerCounts instanceof Map)) {
        inst.eventManager.randomEventTriggerCounts = new Map(Object.entries(inst.eventManager.randomEventTriggerCounts || {}));
      }
      if (!(inst.eventManager.lastTagTriggeredYear instanceof Map)) {
        inst.eventManager.lastTagTriggeredYear = new Map(Object.entries(inst.eventManager.lastTagTriggeredYear || {}));
      }
      if (inst.eventManager.triggeredFilteredIds && !(inst.eventManager.triggeredFilteredIds instanceof Set)) {
        inst.eventManager.triggeredFilteredIds = new Set(inst.eventManager.triggeredFilteredIds);
      }
    }

    if (inst.earthCivi?.tecTreeManager?.trees) {
      for (const tree of inst.earthCivi.tecTreeManager.trees.values()) {
        safeSP(tree, TecTree.prototype);
      }
    }

    if (inst.alienCiviManager?.aliens) {
      for (const alien of inst.alienCiviManager.aliens.values()) {
        safeSP(alien, AlienCivilization.prototype);
      }
    }

    if (inst.earthCivi?.departments) {
      const deptProto = Object.getPrototypeOf(new Map());
      for (const dept of inst.earthCivi.departments.values()) {
        if (typeof dept === 'object' && dept !== null) {
          safeSP(dept, deptProto);
        }
      }
    }

    if (inst.starManager?.stars) {
      for (const star of inst.starManager.stars.values()) {
        if (star && !(star as any).buildingProgress) {
          (star as any).buildingProgress = null;
        }
      }
    }

    if (inst.earthCivi?.fleets) {
      for (const fleet of inst.earthCivi.fleets) {
        if (fleet && !fleet.weapons) {
          fleet.weapons = [];
        }
      }
    }
  }

  private static validateSaveIntegrity(): boolean {
    const inst = this.instance!;
    if (!inst.earthCivi || typeof inst.earthCivi.population !== 'number') return false;
    if (!inst.starManager || !inst.starManager.stars) return false;
    if (!inst.personManager) return false;
    return true;
  }

  private static replacer(_key: string, value: any) {
    if (_key === 'currentEvent' || _key === 'eventQueue' || _key === 'isProcessing' || _key === '_rngProvider') {
      return undefined;
    }

    if (value instanceof Map) {
      return { dataType: 'Map', value: Array.from(value.entries()) };
    } else if (value instanceof Set) {
      return { dataType: 'Set', value: Array.from(value) };
    }
    return value;
  }

  private static reviver(_key: string, value: any) {
    if (typeof value === 'object' && value !== null) {
      if (value.dataType === 'Map') {
        return new Map(value.value);
      }
      if (value.dataType === 'Set') {
        return new Set(value.value);
      }
    }
    return value;
  }
}
