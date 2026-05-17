import { EpochType, EventEffect, FriendshipType, TecTreeType, VictoryType, EventType } from "../types/enums";
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

export class Game {
  public year: number = 0;
  public epoch: EpochType = EpochType.CRISIS;
  public historyLogs: string[] = [];

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
  public isProcessing: boolean = false;

  public flags: Set<string> = new Set();
  public filteredEvents: FilteredEventPayload[] = [];

  constructor() {
    this.starManager = new StarManager();
    this.personManager = new PersonManager();
    this.weaponManager = new WeaponManager();
    this.eventManager = new GameEventManager();

    this.earthCivi = new EarthCivilization();
    this.alienCiviManager = new AlienCiviManager();
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

      this.addHistory("...正在评估随机叙事事件");
      const randomEvent = this.eventManager.checkRandomEvents();
      if (randomEvent) {
        triggeredEvents.push(randomEvent);
      }

      this.addHistory("...正在检查条件过滤事件");
      const filteredEvts = this.eventManager.getFilteredEventsForTurn();
      for (const fev of filteredEvts) {
        if (Math.random() > 0.5) continue;
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

      triggeredEvents.forEach(e => {
        this.addHistory(`触发事件: ${e.name}`);
        console.log("[Narrative] Triggered:", e.name);

        const payload: GameEventPayload = {
          id: e.id || `event_${this.year}_${e.name}`,
          title: e.name,
          dialogQueue: e.dialogNodes.length > 0 ? e.dialogNodes : [{
            speakerName: "系统",
            content: e.tip
          }],
          choices: e.choices && e.choices.length > 0 ? e.choices.map(c => ({
            label: c.label,
            action: () => {
              if (c.effects) this.applyNewEffects(c.effects);
              this.applyEventEffect(e.effect);
            }
          })) : [
            {
              label: "确认",
              action: () => this.applyEventEffect(e.effect)
            }
          ]
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
    } else if (this.year >= 261 && this.year <= 268) {
      this.epoch = EpochType.BROADCAST;
    } else if (this.year >= 269 && this.year <= 330) {
      this.epoch = EpochType.BUNKER;
    } else if (this.year >= 331) {
      this.epoch = EpochType.GALAXY;
    }

    if (prevEpoch !== this.epoch) {
      const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元"];
      this.addHistory(`【纪元更替】进入${epochNames[this.epoch]}！`);
      window.dispatchEvent(new CustomEvent('epoch-changed'));
    }
  }

  public checkVictoryConditions(): void {
    const conditions: VictoryCondition[] = [
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
                 this.earthCivi.population > 0;
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
          return this.earthCivi.tecTreeManager.isTecFinished(TecTreeType.PHYSICS, "黑域生成");
        }
      },
    ];

    for (const cond of conditions) {
      if (cond.check()) {
        this.isGameOver = true;
        this.gameOverReason = `${cond.label}: ${cond.description}`;
        this.victoryType = VictoryType[cond.type as keyof typeof VictoryType];
        window.dispatchEvent(new CustomEvent('game-over'));
        return;
      }
    }

    if (this.earthCivi.treachery >= 100) {
      this.isGameOver = true;
      this.gameOverReason = "逃亡主义失控：人类放弃了最后的希望，文明在内耗中走向崩溃。";
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if (this.earthCivi.population <= 0) {
      this.isGameOver = true;
      this.gameOverReason = "文明灭绝：地球已成为一颗死寂的星球。";
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if (this.year > 400 && this.epoch < EpochType.GALAXY) {
      this.isGameOver = true;
      this.gameOverReason = "太阳氦闪：漫长的等待终结于刺眼的白光，地球未能逃离。";
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
      case EventEffect.ADDTREACHERY: this.earthCivi.treachery = Math.max(0, this.earthCivi.treachery - 15); break;
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
        switch (eff.target) {
          case 'military':
            const fleetsToAdd = Math.max(0, val);
            for (let i = 0; i < fleetsToAdd; i++) {
              this.earthCivi.fleets.push(createFleet(`第${this.earthCivi.fleets.length + 1}舰队`, "地球", 4, 4, 0));
            }
            break;
          case 'economy': this.earthCivi.economy = Math.max(0, this.earthCivi.economy + val); break;
          case 'population': this.earthCivi.population = Math.max(0, this.earthCivi.population + val); break;
          case 'culture': this.earthCivi.culture = Math.max(0, this.earthCivi.culture + val); break;
          case 'prestige': this.earthCivi.deterrenceValue = Math.max(0, this.earthCivi.deterrenceValue + val); break;
          case 'treachery': this.earthCivi.treachery = Math.min(100, Math.max(0, this.earthCivi.treachery + val)); break;
          case 'resource': this.earthCivi.resource = Math.max(0, this.earthCivi.resource + val); break;
          case 'army': this.earthCivi.army = Math.max(0, this.earthCivi.army + val); break;
        }
      } else if (eff.type === 'flag') {
        this.addFlag(eff.target);
        this.addHistory(`[因果标记] 已激活: ${eff.target}`);
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
          alien.friendshipType = FriendshipType.VERYFRIEND;
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
  }

  public static saveGame(): void {
    if (!this.instance) return;
    this.instance.addHistory("游戏已保存到本地存储。");
    const data = JSON.stringify(this.instance, this.replacer);
    localStorage.setItem("LegendOfUni_Save", data);
  }

  public static loadGame(): boolean {
    const dataStr = localStorage.getItem("LegendOfUni_Save");
    if (!dataStr) return false;

    try {
      const parsedData = JSON.parse(dataStr, this.reviver);
      this.instance = new Game();
      
      // Deep assign properties
      Object.assign(this.instance, parsedData);
      
      // Patch critical prototypes that have methods called on them
      Object.setPrototypeOf(this.instance.earthCivi, EarthCivilization.prototype);
      Object.setPrototypeOf(this.instance.alienCiviManager, AlienCiviManager.prototype);
      
      if (this.instance.alienCiviManager && this.instance.alienCiviManager.aliens) {
        for (const alien of this.instance.alienCiviManager.aliens.values()) {
           Object.setPrototypeOf(alien, AlienCivilization.prototype);
        }
      }

      // BUG-08 Fix: Restore nested prototypes
      Object.setPrototypeOf(this.instance.earthCivi.tecTreeManager, TecTreeManager.prototype);
      for (const tree of this.instance.earthCivi.tecTreeManager.trees.values()) {
        Object.setPrototypeOf(tree, TecTree.prototype);
      }
      Object.setPrototypeOf(this.instance.starManager, StarManager.prototype);
      Object.setPrototypeOf(this.instance.personManager, PersonManager.prototype);
      Object.setPrototypeOf(this.instance.eventManager, GameEventManager.prototype);
      this.instance.eventManager.init();

      // 强制清理运行时状态，确保加载后可以点击下一回合
      this.instance.currentEvent = null;
      this.instance.eventQueue = [];
      this.instance.isProcessing = false;
      
      this.instance.addHistory("【系统】游戏读取成功。");
      
      window.dispatchEvent(new CustomEvent('game-loaded'));
      return true;
    } catch (e) {
      console.error("Failed to load game:", e);
      return false;
    }
  }

  private static replacer(_key: string, value: any) {
    // 排除运行时状态，防止存档死锁
    if (_key === 'currentEvent' || _key === 'eventQueue' || _key === 'isProcessing') {
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
