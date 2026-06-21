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
import { createGameEvent } from "./GameEvent";
import epochsData from "../data/epochs.json";
import { EVENT_BUDGET } from "./EventCadence";
import { PlanetEngine } from "./PlanetEngine";
import { DigitalLife } from "./DigitalLife";
import { TagManager } from "./TagManager";
import { EcologyChain } from "./EcologyChain";
import { RelationNetwork } from "./RelationNetwork";
import { AtmosphereEngine } from "./AtmosphereEngine";
import { HistoryGenerator } from "./HistoryGenerator";
import { SliceNarrativeEngine } from "./SliceNarrativeEngine";
import { EventBus } from "./EventBus";
import { SaveManager, SaveDataCorruptedError } from "./SaveManager";
import { AudioManager } from "./AudioManager";
import { StatisticsManager } from "./StatisticsManager";

export interface RngProvider {
  random(): number;
}

/**
 * Game JSON replacer - handles Map/Set serialization for saves
 */
function gameReplacer(_key: string, value: any) {
  if (_key === 'currentEvent' || _key === 'eventQueue' || _key === 'isProcessing' || _key === '_rngProvider' || _key === 'turnHistory') {
    return undefined;
  }
  if (value instanceof Map) {
    return { dataType: 'Map', value: Array.from(value.entries()) };
  } else if (value instanceof Set) {
    return { dataType: 'Set', value: Array.from(value) };
  }
  return value;
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
  public planetEngine: PlanetEngine;
  public digitalLife: DigitalLife;
  public audioManager: AudioManager;

  // UEE 新模块
  public tagManager: TagManager;
  public ecologyChain: EcologyChain;
  public relationNetwork: RelationNetwork;
  public atmosphereEngine: AtmosphereEngine;
  public historyGenerator: HistoryGenerator;
  public sliceNarrativeEngine: SliceNarrativeEngine;
  public eventBus: EventBus;

  public earthCivi: EarthCivilization;
  public alienCiviManager: AlienCiviManager;

  public currentEvent: GameEventPayload | null = null;
  public eventQueue: GameEventPayload[] = [];
  public isGameOver: boolean = false;
  public gameOverReason: string = "";
  public victoryType: VictoryType | null = null;
  public defeatType: DefeatType | null = null;
  public isProcessing: boolean = false;

  // 新增状态字段，用于结局重写与高级扩展
  public deterrenceEnduranceRounds: number = 0;
  public dimensionStrikeTriggered: boolean = false;
  public dimensionStrikeYear: number = 0;
  public broadcastTriggered: boolean = false;
  public broadcastSurvives: boolean = false;
  public isObserverMode: boolean = false;
  public turnHistory: string[] = [];

  public flags: Set<string> = new Set();
  public filteredEvents: FilteredEventPayload[] = [];
  public loreMode: LoreMode = 'strict_three_body';

  private _rngProvider: RngProvider | null = null;

  constructor() {
    this.starManager = new StarManager();
    this.personManager = new PersonManager();
    this.weaponManager = new WeaponManager();
    this.eventManager = new GameEventManager();
    this.planetEngine = new PlanetEngine();
    this.digitalLife = new DigitalLife();
    this.audioManager = new AudioManager();

    // UEE 新模块初始化
    this.tagManager = new TagManager();
    this.ecologyChain = new EcologyChain();
    this.relationNetwork = new RelationNetwork();
    this.relationNetwork.initCanonicalRelations(0);
    this.atmosphereEngine = new AtmosphereEngine();
    this.historyGenerator = new HistoryGenerator();
    this.sliceNarrativeEngine = new SliceNarrativeEngine();
    this.eventBus = new EventBus();

    this.earthCivi = new EarthCivilization();
    this.alienCiviManager = new AlienCiviManager();

    // 注入 game 引用以消除子系统对 GameInstance 单例的强依赖
    this.earthCivi.setGame(this);
    this.eventManager.setGame(this);
    this.alienCiviManager.setGame(this);
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

  public addHistory(log: string, overrideYear?: number, overrideEpoch?: EpochType): void {
    const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
    const targetEpoch = overrideEpoch !== undefined ? overrideEpoch : this.epoch;
    const targetYear = overrideYear !== undefined ? overrideYear : this.year;
    const prefix = `${epochNames[targetEpoch]} ${targetYear} 年 - `;
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
    if (this.isGameOver && !this.isObserverMode) return;

    // 录入当前回合的存档快照，用于命运分歧点回溯
    if (!this.turnHistory) this.turnHistory = [];
    this.turnHistory.push(JSON.stringify(this, (key, val) => {
      if (key === 'currentEvent' || key === 'eventQueue' || key === 'isProcessing' || key === '_rngProvider' || key === 'turnHistory') {
        return undefined;
      }
      if (val instanceof Map) {
        return { dataType: 'Map', value: Array.from(val.entries()) };
      } else if (val instanceof Set) {
        return { dataType: 'Set', value: Array.from(val) };
      }
      return val;
    }));
    if (this.turnHistory.length > 10) {
      this.turnHistory.shift();
    }

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

      this.addHistory("...正在推进发动机与数字生命结算");
      try {
        this.planetEngine.processTurn();
        this.digitalLife.processTurn();
      } catch (e: any) {
        this.addHistory(`[警告] 推进引擎子系统异常: ${e.message}`);
      }

      this.addHistory("...正在评估异星文明威胁");
      try {
        this.alienCiviManager.runARound();
      } catch (e: any) {
        this.addHistory(`[警告] 异星模拟出现异常: ${e.message}`);
      }
      if (this.earthCivi) {
        this.earthCivi.swordholderHandoverTurn = false;
      }

      this.addHistory("...正在更新外交冷却与通信信道");
      for (const alien of this.alienCiviManager.aliens.values()) {
        if (alien.diplomacyCooldown > 0) alien.diplomacyCooldown--;
      }
      this.updateDiplomacyUnlocks();

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
            if ((c as any).flags) (c as any).flags.forEach((f: string) => this.addFlag(f));
            
            // H2 Bugfix: Force swordholder appointment on specific deterrence event
            if (c.effects && c.effects.some((eff: any) => eff.target === "swordholder_appointed")) {
              const luoji = this.personManager.getPerson("罗辑");
              if (luoji && luoji.isAlive) {
                this.earthCivi.swordholder = "罗辑";
              } else {
                // Fallback to first available person if Luoji is dead
                const alivePerson = this.personManager.getAllPersons().find(p => p.isAlive && this.personManager.availablePersons.has(p.name));
                if (alivePerson) this.earthCivi.swordholder = alivePerson.name;
              }
            }
          }
        }));
        triggeredEvents.push(fevGameEvent);
      }
      
      // Scan triggered events for civilization mentions to unlock contacts
      triggeredEvents.forEach(evt => {
        const title = evt.name || "";
        const tip = evt.tip || "";
        let fullText = title + " " + tip;
        if (evt.dialogNodes) {
          evt.dialogNodes.forEach(node => {
            fullText += " " + (node.speakerName || "") + " " + (node.content || "");
          });
        }
        
        if (fullText.includes("歌者") || fullText.includes("光粒")) {
          this.addFlag("singer_contact");
        }
        if (fullText.includes("魔戒") || fullText.includes("四维碎块") || fullText.includes("四维空间碎块")) {
          this.addFlag("ring_contact");
        }
        if (fullText.includes("边缘世界") || fullText.includes("高维生命")) {
          this.addFlag("fringe_contact");
        }
        if (fullText.includes("归零者")) {
          this.addFlag("zeroers_contact");
        }
        
        // Record event trigger in telemetry
        if (evt.id || evt.name) {
          StatisticsManager.recordEventTrigger(evt.id || evt.name);
        }
      });

      const tickerEvents = triggeredEvents.filter(e => (!e.choices || e.choices.length === 0) && (!e.dialogNodes || e.dialogNodes.length === 0));
      const interactiveEvents = triggeredEvents.filter(e => (e.choices && e.choices.length > 0) || (e.dialogNodes && e.dialogNodes.length > 0));

      // Process non-blocking scrolling ticker events immediately
      tickerEvents.forEach(e => {
        const text = e.dialogNodes && e.dialogNodes.length > 0 ? e.dialogNodes[0].content : e.tip;
        this.addHistory(`[大事记] ${e.name}: ${text}`);
        this.tickerMessages.push(`${e.name}: ${text}`);

        // Log ticker event to the chronicle timeline
        this.playerTimeline.push({
          year: this.year,
          event: `重大发现：${e.name} —— ${text}`
        });

        if (e.effects) this.applyNewEffects(e.effects);
        this.applyEventEffect(e.effect, false);
      });
      if (tickerEvents.length > 0) {
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      }

      // ===== UEE 集成：Tag 衰减与世界状态评估 =====
      try {
        this.tagManager.decayTags(this.year);

        // 自动产生 Tag：基于数值阈值
        if (this.earthCivi.population < 20 && !this.tagManager.hasTag('population_crisis')) {
          this.tagManager.applyWorldTag('population_crisis', 20, 'auto:system', this.year);
          this.historyGenerator.recordTagChange(this.year, this.epoch, 'population_crisis', '人口危机', true);
        }
        if (this.earthCivi.treachery > 60 && !this.tagManager.hasTag('civil_unrest')) {
          this.tagManager.applyWorldTag('civil_unrest', 30, 'auto:system', this.year);
          this.historyGenerator.recordTagChange(this.year, this.epoch, 'civil_unrest', '民心不稳', true);
        }
        if (this.earthCivi.deterrenceValue > 60 && !this.tagManager.hasTag('deterrence_steady')) {
          this.tagManager.applyWorldTag('deterrence_steady', 40, 'auto:system', this.year);
          this.historyGenerator.recordTagChange(this.year, this.epoch, 'deterrence_steady', '威慑稳固', true);
        }
      } catch (e: any) {
        this.addHistory(`[UEE警告] Tag 系统异常: ${e.message}`);
      }

      // ===== UEE 集成：氛围评估 =====
      try {
        const prevAtmosphere = this.atmosphereEngine.currentState;
        const newAtmosphere = this.atmosphereEngine.evaluate(this.tagManager, this.earthCivi);
        if (this.atmosphereEngine.transitionTo(newAtmosphere) && prevAtmosphere !== newAtmosphere) {
          this.addHistory(`【氛围变化】${this.atmosphereEngine.getConfig().label}: ${this.atmosphereEngine.getConfig().description}`);
          this.historyGenerator.recordEvent(this.year, this.epoch, '氛围变化', `游戏氛围变为「${this.atmosphereEngine.getConfig().label}」`);
        }
      } catch (e: any) {
        this.addHistory(`[UEE警告] 氛围系统异常: ${e.message}`);
      }

      // ===== UEE 集成：生态链推进 =====
      try {
        const ecoEvents = this.ecologyChain.advanceTurn(this.tagManager, this.year);
        for (const eventId of ecoEvents) {
          this.addHistory(`【生态链触发】涟漪效应事件: ${eventId}`);
          const ecoRandomEvent = this.eventManager.checkRandomEvents();
          if (ecoRandomEvent) {
            triggeredEvents.push(ecoRandomEvent);
          }
        }
      } catch (e: any) {
        this.addHistory(`[UEE警告] 生态链系统异常: ${e.message}`);
      }

      // ===== UEE 集成：历史记录器 =====
      this.historyGenerator.incTurn();
      this.historyGenerator.prune(500);

      // Process blocking interactive strategy events via popup queue
      interactiveEvents.forEach(e => {
        this.addHistory(`触发抉择事件: ${e.name}`);
        console.log("[Narrative] Triggered Choice:", e.name);

        const eventYear = this.year;
        const eventEpoch = this.epoch;

        const choices = e.choices && e.choices.length > 0
          ? e.choices.map(c => ({
              label: c.label,
              action: () => {
                // Log choice to timeline and history
                this.playerTimeline.push({
                  year: eventYear,
                  event: `在「${e.name}」事件中做出选择：${c.label}`
                });
                this.addHistory(`[抉择结果] ${e.name} -> 选择了「${c.label}」`, eventYear, eventEpoch);

                if (c.action) {
                  c.action();
                } else {
                  if (c.effects) this.applyNewEffects(c.effects);
                  if ((c as any).flags) (c as any).flags.forEach((f: string) => this.addFlag(f));
                }
                this.applyEventEffect(e.effect);
              }
            }))
          : [{
              label: "确认",
              action: () => {
                // Log confirmation of major historical milestone to timeline
                this.playerTimeline.push({
                  year: eventYear,
                  event: `确认了重大历史事件「${e.name}」`
                });
                this.addHistory(`[确认事件] ${e.name}`, eventYear, eventEpoch);

                if (e.effects) this.applyNewEffects(e.effects);
                this.applyEventEffect(e.effect);
              }
            }];

        const payload: GameEventPayload = {
          id: e.id || `event_${this.year}_${e.name}`,
          title: e.name,
          dialogQueue: e.dialogNodes.length > 0 ? e.dialogNodes : [{
            speakerName: "系统",
            content: e.tip
          }],
          choices
        };
        this.eventQueue.push(payload);
      });

      if (interactiveEvents.length === 0) {
        try {
          this.relationNetwork.updateRelations(this.tagManager);
          for (const alien of this.alienCiviManager.aliens.values()) {
            if (alien.unlocked && !alien.isDieOut()) {
              const rel = this.relationNetwork.getRelation('地球', alien.name);
              if (rel) {
                if (rel.intensity > 70 && alien.diplomacyCooldown > 1) {
                  alien.diplomacyCooldown = Math.max(1, alien.diplomacyCooldown - 1);
                }
                if (rel.intensity < 30 && alien.friendshipType > FriendshipType.VERYANGRY) {
                  alien.friendshipType = FriendshipType.VERYANGRY;
                }
              }
            }
          }
        } catch (e: any) {
          this.addHistory(`[关系网络] 更新异常: ${e.message}`);
        }

        try {
          const slice = this.sliceNarrativeEngine.generateSlice(
            `auto_turn_${this.year}`, `年份推进`, this.tagManager
          );
          if (slice) {
            const msg = `${slice.characterName}(${slice.characterRole}): ${slice.innerMonologue}`;
            this.tickerMessages.push(msg);
            this.addHistory(`【叙事片段】${msg}`);
            window.dispatchEvent(new CustomEvent('ticker-message-added'));
          }
        } catch (e: any) {
          console.warn("[SliceNarrative] 生成异常:", e.message);
        }

        // 1. 更新威慑维持回合计数器
        if (this.epoch >= EpochType.DETERRENCE && this.earthCivi.swordholder !== null) {
          if (this.earthCivi.deterrenceValue >= 80) {
            this.deterrenceEnduranceRounds++;
          } else {
            this.deterrenceEnduranceRounds = 0;
          }
        } else {
          this.deterrenceEnduranceRounds = 0;
        }

        // 2. 黑暗森林遗迹事件（检测跨周目数据）
        if (this.year === 50 && !this.flags.has("ruins_checked")) {
          this.flags.add("ruins_checked");
          let ruins: Array<{ year: number; culture: number; techCount: number; timestamp: number }> = [];
          try {
            const raw = localStorage.getItem('LegendOfUni_RuinHistory');
            ruins = raw ? JSON.parse(raw) : [];
          } catch {}
          if (ruins.length > 0) {
            const latestRuin = ruins[ruins.length - 1];
            const ruinsEvent: GameEventPayload = {
              id: "event_df_ruins",
              title: "深空异常遗迹",
              dialogQueue: [{
                speakerName: "科学执政官",
                content: `深空探测器在远古坐标发现了一处破碎的人类飞船遗迹。这似乎是另一个平行时间线中，毁灭于 ${latestRuin.year} 年、曾积累了 ${latestRuin.culture} 文化强度的古老地球文明残留物。我们的科学家从残骸中解译出了一些技术图纸。`
              }],
              choices: [{
                label: "继承文化遗产（文化 +200）",
                action: () => {
                  this.earthCivi.culture += 200;
                  this.earthCivi.resource += 100;
                }
              }, {
                label: "逆向研究核心技术（资源 +400）",
                action: () => {
                  this.earthCivi.resource += 400;
                  this.earthCivi.economy += 100;
                }
              }]
            };
            this.eventQueue.push(ruinsEvent);
          }
        }

        // 3. 角色生命状态检查与卸任
        for (const p of this.personManager.getAllPersons()) {
          if (!p.isAlive) {
            // 解除执剑人
            if (this.earthCivi.swordholder === p.name) {
              this.earthCivi.swordholder = null;
            }
            // 解除面壁者
            if (this.earthCivi.wallfacers.has(p.name)) {
              this.earthCivi.wallfacers.delete(p.name);
            }
            // 发布讣告
            if (p.deathYear === 0 || p.deathYear === this.year) {
              if (p.deathYear === 0) p.deathYear = this.year;
              this.addHistory(`【讣告】${p.name} 结束了波澜壮阔的一生，于 ${this.year} 年逝世。`);
              this.tickerMessages.push(`讣告：${p.name} 逝世。`);
            }
          }
        }

        this.year++;
        this.updateEpoch();
        this.checkVictoryConditions();
        this.processNextEvent();
        this.addHistory(`回合推进完成：${this.year - 1} -> ${this.year} (存活异星文明: ${this.alienCiviManager.aliens.size}, 待处理事件: ${this.eventQueue.length})`);
      } else {
        this.processNextEvent();
        this.addHistory(`已触发交互事件，年份推进暂缓 (存活异星文明: ${this.alienCiviManager.aliens.size}, 待处理事件: ${this.eventQueue.length})`);
      }
    } catch (err: any) {
      console.error("Critical error in runARound:", err);
      this.addHistory(`【核心崩溃】结算失败! 错误详情: ${err?.message || "未知错误"}`);
      this.addHistory("系统已尝试紧急回滚状态锁，请尝试再次点击或重新开始。");
    } finally {
      this.isProcessing = false;
      // 自动存档：回合结束
      const self = this;
      SaveManager.autoSave(() => JSON.stringify(self, gameReplacer));
    }
  }

  public updateEpoch(): void {
    const prevEpoch = this.epoch;
    const culture = this.earthCivi?.culture || 0;

    const matched = epochsData.find(e => culture >= e.minCulture && culture <= e.maxCulture);
    if (matched !== undefined && matched.epoch > this.epoch) {
      let allowed = true;
      if (matched.epoch === EpochType.DETERRENCE && !this.flags.has('deterrence_established')) allowed = false;
      if (matched.epoch === EpochType.BROADCAST && !this.flags.has('coordinates_broadcasted')) allowed = false;
      if (matched.epoch === EpochType.BUNKER && !this.flags.has('bunker_world_completed')) allowed = false;
      if (matched.epoch === EpochType.GALAXY && (!this.flags.has('galaxy_exodus_seen') && !this.flags.has('dimensional_strike'))) allowed = false;
      
      if (allowed) {
        this.epoch = matched.epoch;
      } else {
        // 如果文化达标但关键事件未触发，可给予一些提示或轻微停滞惩罚
        if (!this.flags.has('epoch_stalled')) {
          this.addHistory("【文明停滞】人类的文化底蕴已经足以进入下一个时代，但缺少关键的历史契机或技术突破，时代演进被阻滞了。");
          this.flags.add('epoch_stalled');
        }
      }
    }

    if (prevEpoch !== this.epoch) {
      this.flags.delete('epoch_stalled');
      const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
      this.addHistory(`【纪元更替】进入${epochNames[this.epoch]}！`);
      this.playerTimeline.push({ year: this.year, event: `【纪元更替】人类正式进入${epochNames[this.epoch]}` });

      // UEE 纪元 Tag
      const epochTagMap: Record<number, string> = {
        0: 'golden_age_deep',
        1: 'crisis_era_deep',
        2: 'deterrence_era',
        3: 'broadcast_era',
        4: 'bunker_era_deep',
        5: 'galaxy_era_deep',
        6: 'stardust_era_deep',
      };
      const tagId = epochTagMap[this.epoch];
      if (tagId) {
        this.tagManager.setWorldTagIntensity(tagId, 100, this.year, 'epoch_change');
        this.historyGenerator.recordTagChange(this.year, this.epoch, tagId, epochNames[this.epoch], true);

        // 移除旧纪元 Tag
        for (const [eid, etag] of Object.entries(epochTagMap)) {
          if (Number(eid) !== this.epoch && this.tagManager.hasTag(etag)) {
            this.tagManager.removeWorldTag(etag);
            this.historyGenerator.recordTagChange(this.year, this.epoch, etag, epochNames[Number(eid)], false);
          }
        }
      }

      // 自动触发氛围重评估
      const newAtmos = this.atmosphereEngine.evaluate(this.tagManager, this.earthCivi);
      this.atmosphereEngine.transitionTo(newAtmos);

      // 自动弹窗 Epoch CG Event
      const epochCGMap: Record<number, string> = {
        0: 'event_red_shore_base',
        1: 'event_crisis_start',
        2: 'event_deterrence_established',
        3: 'event_gravitational_broadcast',
        4: 'event_bunker_world',
        5: 'event_galaxy_era',
        6: 'event_stardust_era',
      };

      const epochContents: Record<number, string> = {
        0: "那是上个世纪的往事。人类尚未意识到宇宙的险恶，在懵懂中向星空发出了第一声呼唤，黄金岁月还在继续。",
        1: "人类发现了三体舰队，全世界进入危机纪元。行星防御理事会正式启动面壁计划，基础物理已被智子封锁，人类必须寻找在围剿下存活的手段！",
        2: "威慑平衡正式建立，人类世界进入威慑纪元。在执剑人的威慑威压下，三体文明被迫停止了向太阳系的扩张，进入脆弱而短暂的和平冷战期。",
        3: "威慑宣告中止，万有引力号启动了坐标广播，人类正式步入广播纪元。两个世界的坐标已暴露在黑暗森林法则的枪口之下，毁灭倒计时开始。",
        4: "太阳系黑暗森林打击临近，掩体世界群宣告落成，人类迈进掩体纪元。数十座宏伟太空城散布在气态行星背面，人类试图借此躲过光粒打击。",
        5: "太阳系终遭降维打击，大批光速飞船破空而去，逃亡银河系，开启银河纪元。地球不再是人类唯一的家园，人类火种从此散布在浩瀚星海。",
        6: "大宇宙的结构在战争中进一步降维碎裂。太阳系乃至银河系的核心都已退化崩缩，人类分散在各个漂浮的碎星和微型星云间挣扎求生。这是一个万物归尘、同时也是最后的星屑纪元。"
      };

      const epochCG = epochCGMap[this.epoch] || 'event_crisis_start';
      const epochContent = epochContents[this.epoch] || '';
      const newEpochName = epochNames[this.epoch];

      const newEpochEvent: GameEventPayload = {
        id: `event_epoch_transition_${this.epoch}`,
        title: `纪元更替：${newEpochName}`,
        dialogQueue: [{
          speakerName: "历史观测记录",
          avatarUrl: this.eventManager.formatAvatarUrl(epochCG),
          content: epochContent,
          isCG: true
        }],
        choices: [{
          label: `进入${newEpochName}`,
          action: () => {
            if (this.epoch === EpochType.STARDUST) {
              this.addFlag("stardust_era_active");
              this.earthCivi.culture += 300;
              this.addHistory("【星屑遗泽】步入最后的纪元，古老的火种在灰烬中复燃，文化产出大幅提升！");
            }
          }
        }]
      };
      this.eventQueue.unshift(newEpochEvent);

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('epoch-changed'));
        window.dispatchEvent(new CustomEvent('play-game-sound', { detail: { type: 'milestone' } }));
      }

      // 自动存档：纪元切换
      SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
    }
  }

  public checkVictoryConditions(): void {
    // 自动根据星际状态打上关键隐藏结局的标志位（仅限运行时判定，不含科技树）
    if (this.alienCiviManager && this.alienCiviManager.isAllCiviConquered && this.alienCiviManager.isAllCiviConquered()) {
      this.addFlag("conquest_declared");
    }

    // 0. 坐标广播处理
    if (this.broadcastTriggered) {
      this.isGameOver = true;
      if (this.broadcastSurvives) {
        this.victoryType = VictoryType.HIDDEN;
        this.gameOverReason = "太阳系坐标宣告暴露，但幸存的人类先驱已通过光速飞船或数字方舟逃逸。在大宇宙热寂到来之前，你们在归零者的小宇宙中将火种延续下去。";
        SaveManager.recordEnding({
          victoryType: this.victoryType,
          defeatType: null,
          label: "死神永生 · 小宇宙",
          year: this.year,
          epoch: this.epoch,
          keyFlags: Array.from(this.flags),
          timestamp: Date.now()
        });
        this.tagManager.applyWorldTag('victory_hidden', 100, 'game:ending', this.year);
        this.tagManager.applyWorldTag('ending_completed', 100, 'game:ending', this.year);
      } else {
        this.defeatType = DefeatType.EXTINCTION;
        this.gameOverReason = "引力波发射塔发射了精确的星系坐标信号，黑暗森林打击全面爆发。地球和三体世界在光粒打击中双双被湮灭，未做逃逸准备的人类文明彻底断绝。";
        SaveManager.recordEnding({
          victoryType: null,
          defeatType: this.defeatType,
          label: "文明灭绝",
          year: this.year,
          epoch: this.epoch,
          keyFlags: Array.from(this.flags),
          timestamp: Date.now()
        });
        
        let finishedTechs = 0;
        if (this.earthCivi?.tecTreeManager?.trees) {
          for (const tree of this.earthCivi.tecTreeManager.trees.values()) {
            if (tree.nodes) {
              for (const node of tree.nodes.values()) {
                if (node.finished) finishedTechs++;
              }
            }
          }
        }
        SaveManager.saveRuinRecord({
          year: this.year,
          culture: this.earthCivi?.culture || 0,
          techCount: finishedTechs
        });
        
        this.tagManager.applyWorldTag('ending_completed', 100, 'game:ending', this.year);
      }
      // 结局前自动存档
      SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    const conditions: VictoryCondition[] = [
      {
        type: "HIDDEN",
        label: "死神永生 · 小宇宙",
        description: "归零者的讯息抵达，人类选择将小宇宙的质量归还大宇宙，文明化为永恒的生态球",
        allowedEras: [EpochType.GALAXY, EpochType.STARDUST],
        check: () => {
          if (this.year < 350 || this.epoch < EpochType.GALAXY) return false;
          if (this.earthCivi.culture < 1000) return false;
          if (!this.hasFlag("galaxy_exodus_seen")) return false;
          if (!this.hasFlag("alien_alliance")) return false;
          if (!this.hasFlag("zero_homer_contacted")) return false;
          if (!this.hasFlag("mini_universe_built")) return false;
          if (this.earthCivi.population <= 0) return false;
          if (this.earthCivi.deterrenceValue < 50) return false;
          const tm = this.earthCivi.tecTreeManager;
          return tm.isTecFinishedAnywhere("黑域生成") && tm.isTecFinishedAnywhere("数字方舟");
        }
      },
      {
        type: "WANDERING",
        label: "流浪胜利",
        description: "完成行星发动机Ⅲ型与新家园选址，带领地球踏上星辰大海",
        allowedEras: [EpochType.BUNKER, EpochType.GALAXY, EpochType.STARDUST],
        check: () => {
          const tm = this.earthCivi.tecTreeManager;
          return this.year >= 250 &&
                 this.earthCivi.population > 0 &&
                 tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型") &&
                 tm.isTecFinished(TecTreeType.INTERSTELLAR, "新家园选址") &&
                 this.hasFlag("wandering_completed") &&
                 !this.hasFlag("digital_ark_upgrade") &&
                 !this.hasFlag("dark_domain_decision") &&
                 !this.hasFlag("conquest_declared") &&
                 !this.hasFlag("swordholder_appointed") &&
                 !this.hasFlag("zero_homer_contacted");
        }
      },
      {
        type: "DIGITAL",
        label: "数字永生胜利",
        description: "完成数字方舟，将人类意识上传至虚拟世界",
        allowedEras: [EpochType.BUNKER, EpochType.GALAXY, EpochType.STARDUST],
        check: () => {
          return this.year >= 200 &&
                 this.earthCivi.population > 50 &&
                 this.earthCivi.tecTreeManager.isTecFinished(TecTreeType.INFORMATION, "数字方舟") &&
                 this.hasFlag("digital_ark_upgrade") &&
                 !this.hasFlag("wandering_completed") &&
                 !this.hasFlag("dark_domain_decision") &&
                 !this.hasFlag("conquest_declared") &&
                 !this.hasFlag("swordholder_appointed") &&
                 !this.hasFlag("zero_homer_contacted");
        }
      },
      {
        type: "DETERRENCE",
        label: "威慑胜利",
        description: "在威慑纪元中拥有执剑人，维持威慑平衡",
        allowedEras: [EpochType.DETERRENCE],
        check: () => {
          return this.epoch >= EpochType.DETERRENCE &&
                 this.earthCivi.swordholder !== null &&
                 this.earthCivi.population > 0 &&
                 this.earthCivi.deterrenceValue >= 90 &&
                 this.deterrenceEnduranceRounds >= 20 &&
                 !this.alienCiviManager.hasAnyAtWar() &&
                 !this.hasFlag("conquest_declared") &&
                 !this.hasFlag("wandering_completed") &&
                 !this.hasFlag("digital_ark_upgrade") &&
                 !this.hasFlag("dark_domain_decision") &&
                 !this.hasFlag("zero_homer_contacted");
        }
      },
      {
        type: "CONQUEST",
        label: "征服胜利",
        description: "消灭所有异星文明或使其臣服",
        allowedEras: [EpochType.BROADCAST, EpochType.BUNKER, EpochType.GALAXY, EpochType.STARDUST],
        check: () => {
          return this.year >= 200 &&
                 this.earthCivi.population > 10 &&
                 this.earthCivi.treachery < 50 &&
                 this.alienCiviManager.isAllCiviConquered() &&
                 this.hasFlag("conquest_declared") &&
                 !this.hasFlag("swordholder_appointed") &&
                 !this.hasFlag("wandering_completed") &&
                 !this.hasFlag("digital_ark_upgrade") &&
                 !this.hasFlag("dark_domain_decision") &&
                 !this.hasFlag("zero_homer_contacted");
        }
      },
      {
        type: "DARK_DOMAIN",
        label: "黑域胜利",
        description: "完成黑域生成技术，发布宇宙安全声明",
        allowedEras: [EpochType.BUNKER, EpochType.GALAXY, EpochType.STARDUST],
        check: () => {
          return this.year >= 250 &&
                 this.earthCivi.population > 0 &&
                 this.earthCivi.tecTreeManager.isTecFinishedAnywhere("黑域生成") &&
                 this.hasFlag("dark_domain_decision") &&
                 this.earthCivi.treachery < 80 &&
                 !this.hasFlag("conquest_declared") &&
                 !this.hasFlag("swordholder_appointed") &&
                 !this.hasFlag("wandering_completed") &&
                 !this.hasFlag("digital_ark_upgrade") &&
                 !this.hasFlag("zero_homer_contacted");
        }
      },
    ];

    for (const cond of conditions) {
      // 纪元窗口期验证：若结局指定了允许的纪元，则必须处于其中
      if (cond.allowedEras && !cond.allowedEras.includes(this.epoch)) {
        continue;
      }
      if (cond.check()) {
        this.isGameOver = true;
        this.gameOverReason = `${cond.label}: ${cond.description}`;
        this.victoryType = VictoryType[cond.type as keyof typeof VictoryType];
        this.playerTimeline.push({ year: this.year, event: `【大结局】达成 ${cond.label}` });

        SaveManager.recordEnding({
          victoryType: this.victoryType,
          defeatType: null,
          label: cond.label,
          year: this.year,
          epoch: this.epoch,
          keyFlags: Array.from(this.flags).filter(f => ['wandering_chosen', 'digital_ark_chosen', 'swordholder_appointed', 'wallfacer_project', 'galaxy_exodus_seen', 'alien_alliance'].includes(f)),
          timestamp: Date.now()
        });
        this.tagManager.applyWorldTag(`victory_${cond.type.toLowerCase()}`, 100, 'game:ending', this.year);
        this.tagManager.applyWorldTag('ending_completed', 100, 'game:ending', this.year);

        // 结局前自动存档
        SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
        window.dispatchEvent(new CustomEvent('game-over'));
        return;
      }
    }

    if (this.earthCivi.treachery >= 100) {
      this.isGameOver = true;
      this.defeatType = DefeatType.TREACHERY;
      this.gameOverReason = "逃亡主义失控：人类放弃了最后的希望，文明在内耗中走向崩溃。";
      this.playerTimeline.push({ year: this.year, event: '【终结】逃亡主义吞噬了文明最后的秩序' });
      SaveManager.recordEnding({
        victoryType: null, defeatType: this.defeatType, label: "逃亡主义崩溃",
        year: this.year, epoch: this.epoch, keyFlags: Array.from(this.flags), timestamp: Date.now()
      });
      // 结局前自动存档
      SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if (this.earthCivi.population <= 0) {
      this.isGameOver = true;
      this.defeatType = DefeatType.EXTINCTION;
      this.gameOverReason = "文明灭绝：地球已成为一颗死寂的星球。";
      this.playerTimeline.push({ year: this.year, event: '【终结】最后的人类在沉默中消逝' });
      SaveManager.recordEnding({
        victoryType: null, defeatType: this.defeatType, label: "文明灭绝",
        year: this.year, epoch: this.epoch, keyFlags: Array.from(this.flags), timestamp: Date.now()
      });
      
      let finishedTechs = 0;
      if (this.earthCivi?.tecTreeManager?.trees) {
        for (const tree of this.earthCivi.tecTreeManager.trees.values()) {
          if (tree.nodes) {
            for (const node of tree.nodes.values()) {
              if (node.finished) finishedTechs++;
            }
          }
        }
      }
      SaveManager.saveRuinRecord({
        year: this.year,
        culture: this.earthCivi?.culture || 0,
        techCount: finishedTechs
      });
      // 结局前自动存档
      SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
      window.dispatchEvent(new CustomEvent('game-over'));
      return;
    }

    if ((this.year > 350 || this.dimensionStrikeTriggered) &&
        !this.earthCivi.tecTreeManager.isTecFinishedAnywhere("黑域生成") &&
        !this.earthCivi.tecTreeManager.isTecFinishedAnywhere("数字方舟") &&
        !this.hasFlag("dimensional_defense") &&
        !this.hasFlag("dimensional_defense_completed") &&
        !this.hasFlag("wandering_completed")) {
      this.isGameOver = true;
      const isStrikeText = this.dimensionStrikeTriggered || this.loreMode === 'strict_three_body';
      if (this.dimensionStrikeTriggered) {
        this.defeatType = DefeatType.DIMENSION_STRIKE;
        this.gameOverReason = "二向箔打击：黑暗森林打击降临，太阳系从三维空间跌入二维。文明未能逃逸。";
        this.playerTimeline.push({ year: this.year, event: '【终结】二向箔降维打击抹去了整个太阳系' });
      } else {
        this.defeatType = DefeatType.HELIUM_FLASH;
        this.gameOverReason = isStrikeText
          ? "二向箔打击：黑暗森林打击降临，太阳系从三维空间跌入二维。文明未能逃逸。"
          : "太阳氦闪：漫长的等待终结于刺眼的白光，地球未能逃离。";
        this.playerTimeline.push({ year: this.year, event: isStrikeText ? '【终结】二向箔降维打击抹去了整个太阳系' : '【终结】太阳的死亡终结了一切' });
      }
      SaveManager.recordEnding({
        victoryType: null, defeatType: this.defeatType, label: this.dimensionStrikeTriggered ? "二向箔打击" : "太阳氦闪",
        year: this.year, epoch: this.epoch, keyFlags: Array.from(this.flags), timestamp: Date.now()
      });
      
      let finishedTechs = 0;
      if (this.earthCivi?.tecTreeManager?.trees) {
        for (const tree of this.earthCivi.tecTreeManager.trees.values()) {
          if (tree.nodes) {
            for (const node of tree.nodes.values()) {
              if (node.finished) finishedTechs++;
            }
          }
        }
      }
      SaveManager.saveRuinRecord({
        year: this.year,
        culture: this.earthCivi?.culture || 0,
        techCount: finishedTechs
      });
      // 结局前自动存档
      SaveManager.autoSave(() => JSON.stringify(this, gameReplacer));
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

  public applyEventEffect(effect: EventEffect, isInteractive: boolean = true): void {
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
    if (isInteractive) {
      window.dispatchEvent(new CustomEvent('game-event-triggered'));
      this.processNextEvent();
      if (this.eventQueue.length === 0 && !this.currentEvent) {
        this.year++;
        this.updateEpoch();
        this.checkVictoryConditions();
        this.addHistory(`回合推进完成：${this.year - 1} -> ${this.year} (存活异星文明: ${this.alienCiviManager.aliens.size}, 待处理事件: ${this.eventQueue.length})`);
        window.dispatchEvent(new CustomEvent('game-turn-complete'));
      }
    }
  }

  /** 效果别名字典：将非规范别名映射为 Civilization 规范属性名 */
  private static readonly EFFECT_TARGET_ALIAS: Record<string, string> = {
    'prestige': 'deterrenceValue',
    'military': 'army',
  };

  private clampEffectValue(target: string, rawValue: number): number {
    const e = this.earthCivi;
    if (!e) return rawValue;

    // 规范化别名
    const canonical = Game.EFFECT_TARGET_ALIAS[target] || target;

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
        // 规范化别名后再处理
        const canonicalTarget = Game.EFFECT_TARGET_ALIAS[eff.target] || eff.target;
        const val = this.clampEffectValue(canonicalTarget, Number(eff.value));
        if (val < 0) {
          switch (canonicalTarget) {
            case 'army': this.earthCivi.army -= Math.min(this.earthCivi.army * 0.5, Math.abs(val)); break;
            case 'economy': this.earthCivi.economy -= Math.min(this.earthCivi.economy * 0.5, Math.abs(val)); break;
            case 'population': this.earthCivi.population -= Math.min(this.earthCivi.population * 0.5, Math.abs(val)); break;
            case 'culture': this.earthCivi.culture -= Math.min(this.earthCivi.culture * 0.5, Math.abs(val)); break;
            case 'deterrenceValue': this.earthCivi.deterrenceValue -= Math.min(this.earthCivi.deterrenceValue * 0.5, Math.abs(val)); break;
            case 'treachery': this.earthCivi.treachery = Math.max(0, this.earthCivi.treachery - Math.abs(val)); break;
            case 'resource': this.earthCivi.resource -= Math.min(this.earthCivi.resource * 0.5, Math.abs(val)); break;
          }
        } else {
          switch (canonicalTarget) {
            case 'army': this.earthCivi.army += val; break;
            case 'economy': this.earthCivi.economy += val; break;
            case 'population': this.earthCivi.population += val; break;
            case 'culture': this.earthCivi.culture += val; break;
            case 'deterrenceValue': this.earthCivi.deterrenceValue += val; break;
            case 'treachery': this.earthCivi.treachery = Math.min(100, this.earthCivi.treachery + val); break;
            case 'resource': this.earthCivi.resource += val; break;
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
        const epochNames = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
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
        this.applyEventEffect(eff.value as EventEffect, false);
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
    const result = this._conductDiplomacyInternal(alienName, actionType);
    if (!result.startsWith("无法") && !result.startsWith("经济不足") && !result.includes("失败")) {
      const alien = this.alienCiviManager.aliens.get(alienName);
      if (alien) {
        const relDelta = actionType === 'negotiate' ? 10 :
                         actionType === 'trade' ? 5 :
                         actionType === 'provoke' ? -20 :
                         actionType === 'alliance' ? 30 : 0;
        if (relDelta !== 0) {
          this.relationNetwork.modifyRelation('地球', alienName, relDelta);
          if (Math.abs(relDelta) >= 20) {
            const tagId = relDelta > 0 ? 'diplomatic_warming' : 'diplomatic_crisis';
            this.tagManager.applyWorldTag(tagId, Math.abs(relDelta), `diplomacy:${actionType}`, this.year);
          }
        }
        if (alien.friendshipType >= FriendshipType.FRIEND && actionType === 'alliance') {
          this.addFlag(`${alienName}_alliance_formed`);
          this.addFlag("alien_alliance");
          this.tickerMessages.push(`【星际外交】人类与 ${alienName} 正式缔结同盟条约，开启星际合作新纪元！`);
          window.dispatchEvent(new CustomEvent('ticker-message-added'));
        }
        if (alien.friendshipType <= FriendshipType.VERYANGRY && actionType === 'provoke') {
          this.tagManager.applyWorldTag('mil_threat', 30, `diplomacy:provoke:${alienName}`, this.year);
        }
      }
    }
    return result;
  }

  private _conductDiplomacyInternal(alienName: string, actionType: string): string {
    const alien = this.alienCiviManager.aliens.get(alienName);
    if (!alien || alien.isDieOut()) return `无法与已灭亡的文明 ${alienName} 进行外交。`;
    if (alien.diplomacyCooldown > 0) return `外交冷却中，还需等待 ${alien.diplomacyCooldown} 回合。`;

    const game = this;
    const e = game.earthCivi;

    alien.diplomacyCooldown = 3;

    if (alienName === "三体") {
      switch (actionType) {
        case 'negotiate':
          alien.friendshipType = Math.min(FriendshipType.VERYFRIEND, alien.friendshipType + 1);
          e.deterrenceValue = Math.max(0, e.deterrenceValue - 10);
          return `与 ${alienName} 进行外交和平谈判。关系得到改善，但因释放和平信号，对三体威慑度下降 10%（当前威慑度: ${Math.floor(e.deterrenceValue)}%）。`;
        case 'trade':
          if (e.economy >= 30) {
            e.economy -= 30;
            e.resource += 50;
            e.deterrenceValue = Math.max(0, e.deterrenceValue - 15);
            return `与 ${alienName} 进行了“三体文化与科技交流”：-30 经济，+50 资源。人类社会沉浸在三体文化的温吞中，威慑度下降 15%（当前威慑度: ${Math.floor(e.deterrenceValue)}%）。`;
          }
          return `经济不足以进行贸易（需要30）。`;
        case 'provoke':
          if (!e.swordholder) {
            return `【威慑失败】当前没有执剑人在位，无法发起坐标广播威慑。威胁被判定为虚张声势！`;
          }
          alien.friendshipType = FriendshipType.VERYANGRY;
          e.deterrenceValue = Math.min(100, e.deterrenceValue + 20);
          return `【威慑提升】人类通过执剑人 ${e.swordholder} 对 ${alienName} 进行了引力波广播威慑威胁！威慑度提升 20%，当前威慑度: ${Math.floor(e.deterrenceValue)}%，关系恶化至极度敌对。`;
        case 'alliance':
          if (e.deterrenceValue >= 90) {
            alien.isBund = true;
            alien.friendshipType = Math.min(FriendshipType.VERYFRIEND, alien.friendshipType + 1);
            return `【战略同盟】在高达 ${Math.floor(e.deterrenceValue)}% 的绝对威慑力下，${alienName} 被迫妥协，与人类签署了《太阳系-三体威慑平衡和平同盟协定》！`;
          }
          return `【结盟失败】${alienName} 拒绝了和平结盟。三体文明回复：“我们在人类的执剑人身上看到了软弱与迟疑。威慑度不足以保障我们的平等共存。”`;
        default:
          return `未知的外交行动：${actionType}`;
      }
    }

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

  public updateDiplomacyUnlocks(): void {
    const trisolaris = this.alienCiviManager.aliens.get("三体");
    if (trisolaris) trisolaris.unlocked = true;

    const singer = this.alienCiviManager.aliens.get("歌者");
    if (singer && !singer.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("1万光年远镜") ||
                        this.earthCivi.tecTreeManager.isTecFinishedAnywhere("太阳波放大器50光年") ||
                        this.year >= 150 ||
                        this.hasFlag("singer_contact");
      if (condition) {
        singer.unlocked = true;
        this.addHistory(`【探索信道解锁】深空观测站捕获到高频光粒波段信号，成功建立与异星文明「歌者」的通信信道！`);
      }
    }

    const ring = this.alienCiviManager.aliens.get("魔戒");
    if (ring && !ring.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("宇宙社会学") ||
                        this.earthCivi.tecTreeManager.isTecFinishedAnywhere("10%光速飞船") ||
                        this.earthCivi.starIndices.has(10) ||
                        this.earthCivi.starIndices.has(11) ||
                        this.hasFlag("ring_contact");
      if (condition) {
        ring.unlocked = true;
        this.addHistory(`【探索信道解锁】探索飞船在太阳系边缘发现四维空间碎块及墓地遗迹，成功解密与异星生命「魔戒」的通信信道！`);
      }
    }

    const fringe = this.alienCiviManager.aliens.get("边缘世界");
    if (fringe && !fringe.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("99%光速飞船") ||
                        this.earthCivi.tecTreeManager.isTecFinishedAnywhere("引力波广播系统") ||
                        this.epoch >= EpochType.BROADCAST ||
                        this.hasFlag("fringe_contact");
      if (condition) {
        fringe.unlocked = true;
        this.addHistory(`【探索信道解锁】引力波天线捕获到正在与三体文明交战的敌对势力讯号，建立通信信道：「边缘世界」！`);
      }
    }

    const zeroers = this.alienCiviManager.aliens.get("归零者");
    if (zeroers && !zeroers.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("归零者研究") ||
                        this.hasFlag("zeroers_contact") ||
                        this.year >= 280;
      if (condition) {
        zeroers.unlocked = true;
        this.addHistory(`【探索信道解锁】检测到全宇宙广播的终极归零重置宣言，成功接入神级文明通信信道：「归零者」！`);
      }
    }

    const carbon = this.alienCiviManager.aliens.get("碳基联邦");
    if (carbon && !carbon.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("银河系远镜") && this.year >= 150;
      if (condition) {
        carbon.unlocked = true;
        this.addHistory(`【探索信道解锁】银河系远镜捕捉到了古老的硅碳大战残余遗迹波段，成功接入「碳基联邦」通信信道！`);
      }
    }

    const silicon = this.alienCiviManager.aliens.get("硅基帝国");
    if (silicon && !silicon.unlocked) {
      const condition = this.earthCivi.tecTreeManager.isTecFinishedAnywhere("银河系远镜") && this.year >= 150;
      if (condition) {
        silicon.unlocked = true;
        this.addHistory(`【探索信道解锁】银河系远镜捕捉到了高强度无机计算矩阵波动，成功接入「硅基帝国」通信信道！`);
      }
    }

    const god = this.alienCiviManager.aliens.get("上帝文明");
    if (god && !god.unlocked) {
      const condition = this.epoch >= EpochType.GALAXY && this.year >= 250;
      if (condition) {
        god.unlocked = true;
        this.addHistory(`【探索信道解锁】深空舰队遭遇了正在衰亡的古老文明秋林，成功接入「上帝文明」通信信道！`);
      }
    }

    const quantum = this.alienCiviManager.aliens.get("量子态文明");
    if (quantum && !quantum.unlocked) {
      const condition = this.epoch >= EpochType.GALAXY && this.year >= 250;
      if (condition) {
        quantum.unlocked = true;
        this.addHistory(`【探索信道解锁】物理学家观测到了呈现文明特征的宏观量子涨落，成功接入「量子态文明」通信信道！`);
      }
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

  public getEndingForecast(): Array<{ name: string; progress: number; isThreat: boolean }> {
    const forecast: Array<{ name: string; progress: number; isThreat: boolean }> = [];
    
    // 1. WANDERING
    let wanderingProgress = 0;
    const tm = this.earthCivi.tecTreeManager;
    if (tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅲ型")) wanderingProgress += 25;
    if (tm.isTecFinished(TecTreeType.INTERSTELLAR, "新家园选址")) wanderingProgress += 25;
    if (this.hasFlag("wandering_completed")) wanderingProgress += 25;
    if (this.year >= 250) wanderingProgress += 25;
    else wanderingProgress += Math.floor((this.year / 250) * 25);
    forecast.push({ name: "流浪胜利", progress: wanderingProgress, isThreat: false });

    // 2. DIGITAL
    let digitalProgress = 0;
    if (tm.isTecFinished(TecTreeType.INFORMATION, "数字方舟")) digitalProgress += 40;
    if (this.hasFlag("digital_ark_upgrade")) digitalProgress += 30;
    if (this.year >= 200) digitalProgress += 30;
    else digitalProgress += Math.floor((this.year / 200) * 30);
    forecast.push({ name: "数字飞升", progress: digitalProgress, isThreat: false });

    // 3. DETERRENCE
    let deterrenceProgress = 0;
    if (this.epoch >= EpochType.DETERRENCE) deterrenceProgress += 20;
    if (this.earthCivi.swordholder !== null) deterrenceProgress += 20;
    if (this.earthCivi.deterrenceValue >= 80) deterrenceProgress += 30;
    else deterrenceProgress += Math.floor((this.earthCivi.deterrenceValue / 80) * 30);
    if (this.year >= 150) deterrenceProgress += 30;
    else deterrenceProgress += Math.floor((this.year / 150) * 30);
    forecast.push({ name: "黑暗森林威慑", progress: deterrenceProgress, isThreat: false });

    // 4. DARK_DOMAIN
    let darkDomainProgress = 0;
    if (tm.isTecFinished(TecTreeType.PHYSICS, "光速飞船推进器")) darkDomainProgress += 40;
    if (this.hasFlag("dark_domain_declared")) darkDomainProgress += 30;
    if (this.year >= 280) darkDomainProgress += 30;
    else darkDomainProgress += Math.floor((this.year / 280) * 30);
    forecast.push({ name: "黑域安全声明", progress: darkDomainProgress, isThreat: false });

    // 5. CONQUEST
    let conquestProgress = 0;
    if (this.alienCiviManager.isAllCiviConquered()) conquestProgress += 50;
    if (this.hasFlag("conquest_declared")) conquestProgress += 30;
    if (this.year >= 200) conquestProgress += 20;
    else conquestProgress += Math.floor((this.year / 200) * 20);
    forecast.push({ name: "星系征服", progress: conquestProgress, isThreat: false });

    // 6. HELIUM_FLASH (Threat)
    let heliumProgress = Math.floor((this.year / 350) * 100);
    if (heliumProgress > 100) heliumProgress = 100;
    forecast.push({ name: "氦闪危机", progress: heliumProgress, isThreat: true });

    // 7. TREACHERY (Threat)
    const treacheryProgress = Math.floor(this.earthCivi.treachery);
    forecast.push({ name: "逃亡崩溃", progress: treacheryProgress, isThreat: true });

    return forecast;
  }

  public static rollbackToFateDivergence(): boolean {
    return GameInstance.rollbackToFateDivergence();
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
    const endingHistory = SaveManager.getEndingHistory();
    const unlocked = SaveManager.getEndingUnlocks();

    SaveManager.deleteSave();
    localStorage.removeItem("game-tutorial-seen");
    this.instance = new Game();

    if (endingHistory.length > 0) {
      this.instance.addFlag('new_game_plus');
      if (unlocked.has('unlocked_victory_HIDDEN')) {
        this.instance.addFlag('unlocked_zeroer_perspective');
      }
      if (unlocked.has('unlocked_victory_DIGITAL')) {
        this.instance.earthCivi.economy += 500;
        this.instance.earthCivi.culture += 200;
      }
      if (unlocked.has('unlocked_victory_WANDERING')) {
        this.instance.earthCivi.army += 50;
      }
      if (unlocked.has('unlocked_victory_DETERRENCE')) {
        this.instance.earthCivi.deterrenceValue += 20;
      }
      if (unlocked.has('unlocked_victory_CONQUEST')) {
        for (const alien of this.instance.alienCiviManager.aliens.values()) {
          alien.unlocked = true;
        }
      }
      if (unlocked.has('unlocked_victory_DARK_DOMAIN')) {
        this.instance.earthCivi.resource += 500;
      }
      
      this.instance.tagManager.applyWorldTag('echo_of_past_ending', 30, 'new_game_plus', 0);
    }

    setTimeout(() => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-tutorial'));
        if (endingHistory.length > 0) {
          window.dispatchEvent(new CustomEvent('new-game-plus-activated', {
            detail: { endings: endingHistory.length, unlocked: Array.from(unlocked) }
          }));
        }
      }
    }, 500);
  }


  public static saveGame(): void {
    if (!this.instance) return;
    if (this.instance.historyGenerator) {
      this.instance.historyGenerator.prune(500);
    }
    this.instance.addHistory("游戏已保存到本地存储。");
    SaveManager.save(() => JSON.stringify(this.instance, gameReplacer));
  }

  public static loadGame(): boolean {
    try {
      const dataStr = SaveManager.load();
      if (!dataStr) return false;

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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-loaded'));
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      }
      return true;
    } catch (e) {
      if (e instanceof SaveDataCorruptedError) {
        if (e.message.includes("无效的 JSON 格式")) {
          console.error("Save load failed with invalid JSON format:", e.message);
          return false;
        }
        console.error("Save corruption detected:", e.message);
        throw e;
      }
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
    safeSP(inst.planetEngine, PlanetEngine.prototype);
    safeSP(inst.digitalLife, DigitalLife.prototype);

    // UEE 新模块原型恢复
    safeSP(inst.tagManager, TagManager.prototype);
    safeSP(inst.ecologyChain, EcologyChain.prototype);
    safeSP(inst.relationNetwork, RelationNetwork.prototype);
    safeSP(inst.atmosphereEngine, AtmosphereEngine.prototype);
    safeSP(inst.historyGenerator, HistoryGenerator.prototype);
    safeSP(inst.sliceNarrativeEngine, SliceNarrativeEngine.prototype);
    safeSP(inst.eventBus, EventBus.prototype);

    if (inst.digitalLife) {
      if (inst.digitalLife.resurrectedPersons && !(inst.digitalLife.resurrectedPersons instanceof Set)) {
        inst.digitalLife.resurrectedPersons = new Set(inst.digitalLife.resurrectedPersons);
      }
    }

    if (inst.eventManager && (!inst.eventManager.events || inst.eventManager.events.length === 0)) {
      const savedCounts = inst.eventManager.randomEventTriggerCounts;
      const savedFilteredIds = inst.eventManager.triggeredFilteredIds;
      const savedLaneYears = inst.eventManager.lastLaneTriggeredYear;
      const savedTagYears = inst.eventManager.lastTagTriggeredYear;
      const savedAnyYear = inst.eventManager.lastAnyEventYear;
      inst.eventManager.init();
      if (savedCounts) inst.eventManager.randomEventTriggerCounts = savedCounts;
      if (savedFilteredIds) inst.eventManager.triggeredFilteredIds = savedFilteredIds;
      if (savedLaneYears) inst.eventManager.lastLaneTriggeredYear = savedLaneYears;
      if (savedTagYears) inst.eventManager.lastTagTriggeredYear = savedTagYears;
      if (savedAnyYear !== undefined) inst.eventManager.lastAnyEventYear = savedAnyYear;
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
      // Departments are standard objects, do not cast to Map.prototype
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

  static validateSaveIntegrity(): boolean {
    const inst = this.instance!;
    if (!inst.earthCivi || typeof inst.earthCivi.population !== 'number') return false;
    if (!inst.starManager || !inst.starManager.stars) return false;
    if (!inst.personManager) return false;
    return true;
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

  public static rollbackToFateDivergence(): boolean {
    if (!this.instance || !this.instance.turnHistory || this.instance.turnHistory.length === 0) return false;
    try {
      const dataStr = this.instance.turnHistory[0]; // 回滚到10回合前（或者是最久远的一个快照）
      const parsedData = JSON.parse(dataStr, this.reviver);
      
      const carryOverHistory = [...this.instance.turnHistory];
      carryOverHistory.shift(); // 移除最老的一个快照，防止死循环
      
      this.instance = new Game();
      Object.assign(this.instance, parsedData);
      this.restorePrototypes();
      
      this.instance.turnHistory = carryOverHistory;
      this.instance.isGameOver = false;
      this.instance.victoryType = null;
      this.instance.defeatType = null;
      this.instance.gameOverReason = "";
      this.instance.isProcessing = false;
      this.instance.currentEvent = null;
      this.instance.eventQueue = [];
      this.instance.isObserverMode = false;
      
      this.instance.addHistory("【系统】时间线已回溯至分歧点（约 10 回合前）。");
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('game-loaded'));
        window.dispatchEvent(new CustomEvent('ticker-message-added'));
      }
      return true;
    } catch (e) {
      console.error("Failed to rollback to fate divergence:", e);
      return false;
    }
  }
}

