import { Civilization } from "./Civilization";
import { AiPersonality, EpochType, FriendshipType } from "../types/enums";
import { GameInstance } from "./Game";
import { createFleet } from "./Fleet";
import { CombatEngine } from "./CombatEngine";
import { createBarback } from "./Barback";
import aliensData from "../data/aliens.json";
import type { RngProvider } from "./Game";

export class AlienCivilization extends Civilization {
  public typeIndex: number;
  public personality: AiPersonality;
  public attackCooldown: number = 0;
  public lastAttackYear: number = 0;
  public starsys: number = 0;

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

    this.growEconomy();
    this.ageBehavior(game);
    this.processFleets(game);
  }

  private growEconomy(): void {
    this.resource += Math.floor(this.rng() * 10);
    this.army += 2;
    if (this.rng() < 0.12) this.population += Math.floor(this.rng() * 10) + 5;
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
    if (!game.earthCivi.isDieOut() && deterrenceRate < 90 && this.rng() < 0.18) {
      if (game.epoch === EpochType.DETERRENCE || game.epoch === EpochType.BROADCAST) {
        if (this.rng() < 0.3) return;
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
    if (!game.earthCivi.isDieOut() && deterrenceRate < 70 && this.rng() < 0.12) {
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
    if (this.friendshipType >= FriendshipType.FRIEND && this.rng() < 0.08) {
      const received = Math.min(100, Math.floor(game.earthCivi.economy * 0.1));
      game.earthCivi.economy -= received;
      game.addHistory(`${this.name} 以友好名义索取了 ${received} 经济援助。`);
      return;
    }
    if (deterrenceRate < 50 && this.rng() < 0.25) {
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
      const alien = new AlienCivilization(
        data.name || data.Name,
        this.aliens.size,
        personality,
        data.starsys || 1
      );
      alien.starIndices.add(1000 + this.aliens.size);
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
}
