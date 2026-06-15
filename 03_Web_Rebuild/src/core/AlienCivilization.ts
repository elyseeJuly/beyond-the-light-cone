import { Civilization } from "./Civilization";
import { AiPersonality, EpochType, FriendshipType } from "../types/enums";
import { GameInstance } from "./Game";
import { createFleet } from "./Fleet";
import { CombatEngine } from "./CombatEngine";
import { createBarback } from "./Barback";
import aliensData from "../data/aliens.json";
import type { RngProvider } from "./Game";
import diplomacyData from "../data/diplomacy.json";

export class AlienCivilization extends Civilization {
  public typeIndex: number;
  public personality: AiPersonality;
  public attackCooldown: number = 0;
  public lastAttackYear: number = 0;
  public starsys: number = 0;
  public unlocked: boolean = false;
  
  public waterdropCount: number = 0;
  public waterdropCooldown: number = 0;
  public hasDimensionStruck: boolean = false;
  public dimensionStrikeWarningTurns: number = 0;

  private _rngProvider: RngProvider | null = null;

  constructor(name: string, typeIndex: number, personality: AiPersonality, starsys: number = 1) {
    super(name);
    this.typeIndex = typeIndex;
    this.personality = personality;
    this.friendshipType = FriendshipType.NORMAL;
    this.starsys = starsys;
    this.population = 500;
    this.army = 50;
    this.resource = 1000;
  }

  public setRngProvider(provider: RngProvider): void {
    this._rngProvider = provider;
  }

  private rng(): number {
    return this._rngProvider ? this._rngProvider.random() : Math.random();
  }

  public runARound(): void {
    if (this.isDieOut()) return;
    const game = GameInstance.get();

    // Handover crisis check
    if (this.name === "三体" && game.earthCivi.swordholderHandoverTurn) {
      const shName = game.earthCivi.swordholder;
      if (shName) {
        const sh = game.personManager.getPerson(shName);
        if (sh && sh.leadership < 60) {
          if (this.rng() < 0.75) {
            this.launchHandoverWaterdropAttack(game, sh.name);
          }
        }
      }
    }

    if (this.waterdropCooldown > 0) this.waterdropCooldown--;

    this.growEconomy();
    this.ageBehavior(game);
    this.processDimensionStrike(game);

    if (this.friendshipType >= FriendshipType.FRIEND && this.rng() < 0.1) {
      const trees = Array.from(game.earthCivi.tecTreeManager.trees.values());
      const activeNodes: any[] = [];
      for (const tree of trees) {
        for (const node of (tree as any).nodes.values()) {
          if (node.inResearch && !node.finished) activeNodes.push(node);
        }
      }
      if (activeNodes.length > 0) {
        const target = activeNodes[Math.floor(this.rng() * activeNodes.length)];
        const boost = Math.floor(target.totalWorkload * 0.1) + 5;
        target.currentWorkload += boost;
        if (target.currentWorkload >= target.totalWorkload) target.currentWorkload = target.totalWorkload - 1;
        game.addHistory(`【外交回馈】${this.name} 与人类进行了技术交流，显著推进了「${target.name}」的研发进度！`);
      }
    }

    // AI Special Weapons Triggers
    if (this.friendshipType === FriendshipType.VERYANGRY) {
      if (this.waterdropCooldown === 0 && this.waterdropCount < 3 && this.rng() < 0.15) {
        this.launchWaterdropAttack(game);
      } else if (!this.hasDimensionStruck && this.rng() < 0.05 && game.year > 150) {
        this.triggerDimensionStrike(game);
      }
    }

    this.processFleets(game);
  }

  public launchHandoverWaterdropAttack(game: any, shName: string): void {
    if (game.earthCivi.starIndices.size <= 1) return; // Safety valve
    this.waterdropCount++;
    this.waterdropCooldown = 10;

    const msg = `【交接危机】智子判定新任执剑人「${shName}」威慑度不足，三体「水滴」探测器发起饱和打击！`;
    game.addHistory(msg);
    game.playerTimeline.push({
      year: game.year,
      event: msg
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('play-game-sound', { detail: { type: 'alert' } }));
    }

    const targetIdx = 3;
    const fleet = createFleet(`「水滴」交接突袭探测器`, this.name, targetIdx, 0, 3, true);
    this.fleets.push(fleet);
  }

  private growEconomy(): void {
    const MAX_AI_RESOURCE = 5000;
    const MAX_AI_ARMY = 500;
    const MAX_AI_POPULATION = 2000;
    
    if (this.resource < MAX_AI_RESOURCE) {
      this.resource += Math.floor(this.rng() * 10);
    }
    if (this.army < MAX_AI_ARMY) {
      this.army += 2;
    }
    if (this.population < MAX_AI_POPULATION) {
      if (this.rng() < 0.12) this.population += Math.floor(this.rng() * 10) + 5;
    }
  }

  private ageBehavior(game: any): void {
    const deterrenceRate = this.calculateDeterrence(game);

    switch (this.personality) {
      case AiPersonality.HUNTER:
        this.hunterBehavior(game, deterrenceRate);
        break;
      case AiPersonality.CLEANER:
        this.cleanerBehavior(game, deterrenceRate);
        break;
      case AiPersonality.EXPANSIONIST:
        this.expansionistBehavior(game, deterrenceRate);
        break;
      case AiPersonality.DEFENSIVE:
        this.defensiveBehavior(game, deterrenceRate);
        break;
      case AiPersonality.OPPORTUNIST:
        this.opportunistBehavior(game, deterrenceRate);
        break;
    }
  }

  private calculateDeterrence(game: any): number {
    let deterrenceRate = game.earthCivi.deterrenceValue * 0.5;
    const swordholderName = game.earthCivi.swordholder;
    if (swordholderName) {
      const sh = game.personManager.getPerson(swordholderName);
      if (sh) deterrenceRate += sh.leadership;
    }
    return deterrenceRate;
  }

  private hunterBehavior(game: any, deterrenceRate: number): void {
    if (!game.earthCivi.isDieOut() && deterrenceRate < 90 && this.rng() < diplomacyData.hunterAttackChance) {
      if (game.epoch === EpochType.DETERRENCE || game.epoch === EpochType.BROADCAST) {
        if (this.rng() < diplomacyData.hunterEpochDeterrenceChance) return;
      }
      if (this.attackCooldown === 0) {
        this.attackCooldown = 5 + Math.floor(this.rng() * 6);
        game.addHistory(`【情报】${this.name} 舰队正在集结，预计 ${this.attackCooldown} 年后抵达太阳系。`);
      } else if (this.attackCooldown > 1) {
        this.attackCooldown--;
        game.addHistory(`【情报】${this.name} 舰队距抵达还有 ${this.attackCooldown} 年。`);
      } else {
        this.attackCooldown = 0;
        this.launchFleetAttack(game, 6);
      }
    }
  }

  private cleanerBehavior(game: any, deterrenceRate: number): void {
    if (!game.earthCivi.isDieOut() && deterrenceRate < 70 && this.rng() < diplomacyData.cleanerAttackChance) {
      if (this.attackCooldown === 0) {
        this.attackCooldown = 3 + Math.floor(this.rng() * 4);
        game.addHistory(`【侦测】探测到 ${this.name} 具有清理倾向！舰队正在接近。`);
      } else if (this.attackCooldown > 1) {
        this.attackCooldown--;
      } else {
        this.attackCooldown = 0;
        this.launchFleetAttack(game, 8);
      }
    }
  }

  private expansionistBehavior(game: any, deterrenceRate: number): void {
    if (this.rng() < 0.10) {
      const allStars = game.starManager.getAllStars();
      const unowned = allStars.filter((s: any) => s.isPlanet && !s.belongToCivi && s.index > 8);
      if (unowned.length > 0 && deterrenceRate < 80) {
        const target = unowned[Math.floor(this.rng() * unowned.length)];
        target.belongToCivi = this.name;
        this.starIndices.add(target.index);
        game.addHistory(`${this.name} 扩张至 ${target.name}。`);
      }
    }
  }

  private defensiveBehavior(game: any, _deterrenceRate: number): void {
    if (this.rng() < 0.05) {
      game.addHistory(`${this.name} 保持防御态势，加固现有领地。`);
    }
    this.army += 5;
  }

  private opportunistBehavior(game: any, deterrenceRate: number): void {
    if (this.friendshipType >= FriendshipType.FRIEND && this.rng() < diplomacyData.opportunistChance) {
      const received = Math.min(100, Math.floor(game.earthCivi.economy * diplomacyData.opportunistRequestRatio));
      game.earthCivi.economy -= received;
      game.addHistory(`${this.name} 以友好名义索取了 ${received} 经济援助。`);
      return;
    }
    if (deterrenceRate < 50 && this.rng() < diplomacyData.opportunistAttackChance) {
      this.launchFleetAttack(game, 3);
    }
  }

  private launchFleetAttack(game: any, eta: number): void {
    const targetIdx = 3;
    const fleet = createFleet(`${this.name} 远征军`, this.name, targetIdx, 0, eta);
    fleet.weapons.push({ weaponName: "水滴型战舰", currentBuild: 80 });
    fleet.weapons.push({ weaponName: "强互作用探测器", currentBuild: 40 });
    this.fleets.push(fleet);
    game.addHistory(`【警报】${this.name} 远征舰队已启程，预计 ${eta} 年后抵达！`);
  }

  private processFleets(game: any): void {
    for (let i = this.fleets.length - 1; i >= 0; i--) {
      const fleet = this.fleets[i];
      if (fleet.eta > 0) {
        fleet.eta--;
        if (fleet.eta === 0) {
          game.addHistory(`【警报】${fleet.name} 抵达太阳系！`);
          const earthTarget = game.starManager.getStar(fleet.targetStarIndex);
          if (earthTarget && earthTarget.belongToCivi === "地球") {
            let defBarback = createBarback("earth_def", 0);
            defBarback.soldierCount = 500 + game.earthCivi.army;
            const win = CombatEngine.resolveFleetVsBarback(fleet, defBarback);
            if (win) {
              earthTarget.belongToCivi = this.name;
              game.earthCivi.population = Math.floor(game.earthCivi.population * 0.3);
              game.addHistory(`【战败】地球被 ${this.name} 占领，人类文明遭受重创！`);
            } else {
              game.addHistory(`【奇迹】地球守军成功击退了 ${fleet.name}！`);
              this.friendshipType = Math.max(FriendshipType.VERYANGRY, this.friendshipType - 1);
              this.fleets.splice(i, 1);
            }
          }
        }
      }
    }
  }

  public launchWaterdropAttack(game: any): void {
    if (this.waterdropCount >= 3 || this.waterdropCooldown > 0) return;
    if (game.earthCivi.starIndices.size <= 1) return; // Safety valve

    this.waterdropCount++;
    this.waterdropCooldown = 10;
    
    game.addHistory(`【黑暗森林警报】智子观测到 ${this.name} 文明的「水滴」探测器已进入超高速巡航，预计 3 回合后抵达太阳系！`);
    
    const targetIdx = 3;
    const fleet = createFleet(`「水滴」绝对静止探测器`, this.name, targetIdx, 0, 3, true);
    this.fleets.push(fleet);
  }

  public triggerDimensionStrike(game: any): void {
    if (this.hasDimensionStruck) return;
    if (game.earthCivi.starIndices.size <= 1) return; // Safety valve

    this.hasDimensionStruck = true;
    this.dimensionStrikeWarningTurns = 5;
    game.addHistory(`【死神警报】深空雷达侦测到一颗由 ${this.name} 抛出的微小薄膜物体正以光速扑向太阳系！高维空间崩塌倒计时开始：5回合后！`);
  }

  private processDimensionStrike(game: any): void {
    if (this.dimensionStrikeWarningTurns > 0) {
      this.dimensionStrikeWarningTurns--;
      if (this.dimensionStrikeWarningTurns > 0) {
        game.addHistory(`【二向箔倒计时】坍缩波前锋正在加速靠近，剩余 ${this.dimensionStrikeWarningTurns} 回合！`);
      } else {
        game.addHistory(`【高维坍缩】二向箔最终降临太阳系！三维空间以光速坍塌至二维！`);
        const tm = game.earthCivi.tecTreeManager;
        const survives = tm.isTecFinishedAnywhere("黑域生成") || tm.isTecFinishedAnywhere("数字方舟") || game.hasFlag("galaxy_exodus_seen") || game.hasFlag("wandering_completed");
        
        if (survives) {
          game.addHistory(`【生存奇迹】由于已构建光速安全声明/数字意识备份，人类文明的部分火种在坍缩中逃逸生存！`);
          game.earthCivi.population = Math.max(1, Math.floor(game.earthCivi.population * 0.5));
          game.earthCivi.resource = Math.max(1, Math.floor(game.earthCivi.resource * 0.5));
        } else {
          game.dimensionStrikeTriggered = true;
          game.dimensionStrikeYear = game.year;
        }
      }
    }
  }

  public checkGravityBroadcast(game: any): void {
    if (!game.hasFlag(`${this.name}_broadcast_sent`)) {
      game.addFlag(`${this.name}_broadcast_sent`);
      game.addHistory(`【黑暗森林广播】${this.name} 在母星系面临崩溃前，通过引力波向全宇宙广播了太阳系与三体星系的精确坐标！坐标已完全暴露！`);
      game.earthCivi.treachery = Math.min(100, game.earthCivi.treachery + 25);
    }
  }
}

export class AlienCiviManager {
  public aliens: Map<string, AlienCivilization> = new Map();

  constructor() {
    this.init();
  }

  public init(): void {
    if (!aliensData || !Array.isArray(aliensData)) return;

    aliensData.forEach((data: any) => {
      const personality = data.personality ?? AiPersonality.HUNTER;
      const civiName = data.name || data.Name;
      const alien = new AlienCivilization(
        civiName,
        this.aliens.size,
        personality,
        data.starsys || 1
      );
      if (civiName === "三体") {
        alien.unlocked = true;
      }
      const homeStarIndex = 999 - this.aliens.size;
      alien.starIndices.add(homeStarIndex);
      alien.population = data.res || 500;
      alien.resource = data.res || 1000;
      this.aliens.set(alien.name, alien);
    });
  }

  public isAllCiviConquered(): boolean {
    for (const alien of this.aliens.values()) {
      if (!alien.isDieOut() && !alien.isBund) {
        return false;
      }
    }
    return this.aliens.size > 0;
  }

  public loseStar(civiName: string, starIndex: number): void {
    const alien = this.aliens.get(civiName);
    if (alien) {
      alien.starIndices.delete(starIndex);
      const game = GameInstance.get();
      if (alien.isDieOut() && game) {
        game.addHistory(`【胜利】外星文明 ${civiName} 被彻底消灭！`);
      }
    }
  }

  public setRngProvider(provider: RngProvider): void {
    for (const alien of this.aliens.values()) {
      alien.setRngProvider(provider);
    }
  }

  public runARound(): void {
    for (const alien of this.aliens.values()) {
      alien.runARound();
    }
  }

  public hasAnyAtWar(): boolean {
    for (const alien of this.aliens.values()) {
      if (!alien.isDieOut() && alien.friendshipType === FriendshipType.VERYANGRY) {
        return true;
      }
    }
    return false;
  }
}
