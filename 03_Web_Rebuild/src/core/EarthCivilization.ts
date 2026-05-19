import { Civilization } from "./Civilization";
import { Department, createDepartment } from "./Department";
import { DepartmentType, TecTreeType } from "../types/enums";
import { GameInstance } from "./Game";
import { CombatEngine } from "./CombatEngine";
import { createBarback } from "./Barback";
import type { RngProvider } from "./Game";
import { STAR_INDEX } from "../config/starIndices";

const MAX_ECONOMY = 999999;
const MAX_POPULATION_MULTIPLIER = 3;

export class EarthCivilization extends Civilization {
  public idlePopulation: number = 0;
  public levelString: string = "普通文明";
  public deterrenceValue: number = 0;
  public wallfacers: Set<string> = new Set();
  public swordholder: string | null = null;
  public departments: Map<DepartmentType, Department> = new Map();

  public miningWorkers: number = 0;
  public factoryWorkers: number = 0;
  public cultureWorkers: number = 0;
  public idleWorkers: number = 65;

  public miningRatio: number = 30;
  public factoryRatio: number = 30;
  public cultureRatio: number = 30;

  private _rngProvider: RngProvider | null = null;

  public setRngProvider(provider: RngProvider): void {
    this._rngProvider = provider;
  }

  private rng(): number {
    return this._rngProvider ? this._rngProvider.random() : Math.random();
  }

  constructor() {
    super("地球");
    const deptNames = [
      "经济部", "军事部", "文化部", "人力资源部", "宇宙社会学",
      "核技术", "航天技术", "质子技术", "天体物理", "文化研究所", "经济研究所"
    ];
    for (let i = 0; i < 11; i++) {
      const d = createDepartment(i as DepartmentType, deptNames[i]);
      this.departments.set(i as DepartmentType, d);
    }
    this.starIndices.add(STAR_INDEX.EARTH);
    this.population = 65;
    this.economy = 100;
    this.resource = 200;
    this.army = 10;
    this.idlePopulation = 65;
    this.idleWorkers = 65;
  }

  public addWallfacer(name: string): void {
    this.wallfacers.add(name);
  }

  public removeWallfacer(name: string): void {
    this.wallfacers.delete(name);
  }

  public isWallfacer(name: string): boolean {
    return this.wallfacers.has(name);
  }

  public runARound(): void {
    const game = GameInstance.get();

    this.autoAssignMinisters(game);
    this.allocateWorkers();

    this.processMining(game);
    this.processFactories(game);
    this.culture += this.processCulture(game);
    this.processTechResearch(game);
    this.processPopulationGrowth(game);
    this.processTreachery(game);

    const oldCulture = this.culture;

    for (const wName of this.wallfacers) {
      const p = game.personManager.getPerson(wName);
      if (p) {
        this.deterrenceValue += (p.leadership + p.art) * 0.5;
        this.army += 5;
      }
    }

    if (this.swordholder) {
      const sh = game.personManager.getPerson(this.swordholder);
      if (sh) {
        this.army += sh.leadership * 2;
      }
    }

    game.updateCiviLevel(oldCulture);

    this.syncStarPopulation(game);
    this.processFleets(game);
    this.processBuildings(game);
    this.sanitizeResources(game);
  }

  private processBuildings(game: any): void {
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (!star || !star.buildingProgress) continue;
      const bp = star.buildingProgress;
      for (const key of Object.keys(bp)) {
        const b = bp[key];
        if (b.currentBuild < b.totalBuild) {
          b.currentBuild += b.buildPerRound;
          if (b.currentBuild >= b.totalBuild) {
            b.currentBuild = b.totalBuild;
            if (key === 'stope') star.hasStope = true;
            else if (key === 'factory') star.hasFactory = true;
            else if (key === 'city') star.hasCity = true;
            game.addHistory(`${star.name} 的${key === 'stope' ? '采矿场' : key === 'factory' ? '加工厂' : '太空城市'}建造完成！`);
            delete bp[key];
          }
        }
      }
      if (Object.keys(bp).length === 0) star.buildingProgress = null;
    }
  }

  private sanitizeResources(game: any): void {
    this.population = Math.max(0, this.population);
    this.economy = Math.max(0, this.economy);
    this.resource = Math.max(0, this.resource);
    this.culture = Math.max(0, this.culture);
    this.army = Math.max(0, this.army);
    this.deterrenceValue = Math.max(0, this.deterrenceValue);
    this.idleWorkers = Math.max(0, this.idleWorkers);
    this.idlePopulation = Math.max(0, this.idlePopulation);

    if (this.population <= 0 && !game.isGameOver) {
      game.addHistory("【灭绝】地球文明人口耗尽，文明灭亡。");
      game.isGameOver = true;
      game.gameOverReason = "文明灭绝：地球已成为一颗死寂的星球。";
      window.dispatchEvent(new CustomEvent('game-over'));
    }
  }

  public autoAssignMinisters(game: any): void {
    const deptStatMap: [DepartmentType, string][] = [
      [DepartmentType.ECONOMY, 'economy'],
      [DepartmentType.ARMY, 'army'],
      [DepartmentType.CULTURE, 'social'],
      [DepartmentType.HUMANRES, 'leadership'],
      [DepartmentType.ASTROSOCIOLOGY, 'science'],
      [DepartmentType.NUCLEAR, 'science'],
      [DepartmentType.SPACEFIGHT, 'army'],
      [DepartmentType.PROTON, 'science'],
      [DepartmentType.ASTROPHYSICS, 'science'],
      [DepartmentType.CULTURETEC, 'art'],
      [DepartmentType.ECONOMYTEC, 'economy'],
    ];

    for (const [deptType, statKey] of deptStatMap) {
      const dept = this.departments.get(deptType);
      if (!dept || dept.leaderName) continue;

      let bestPerson: string | null = null;
      let bestStat = -1;

      for (const name of game.personManager.availablePersons) {
        const p = game.personManager.getPerson(name);
        if (!p) continue;
        const stat = (p as any)[statKey] || 0;
        if (stat > bestStat) {
          bestStat = stat;
          bestPerson = name;
        }
      }

      if (bestPerson) {
        dept.leaderName = bestPerson;
        game.personManager.availablePersons.delete(bestPerson);
        const person = game.personManager.getPerson(bestPerson);
        if (person) person.departmentId = dept.name;
      }
    }
  }

  private allocateWorkers(): void {
    const total = this.idleWorkers;
    const totalRatio = this.miningRatio + this.factoryRatio + this.cultureRatio;
    const denom = totalRatio > 0 ? totalRatio : 1;
    this.miningWorkers = Math.floor(total * this.miningRatio / denom);
    this.factoryWorkers = Math.floor(total * this.factoryRatio / denom);
    this.cultureWorkers = Math.floor(total * this.cultureRatio / denom);
    this.idleWorkers = total - this.miningWorkers - this.factoryWorkers - this.cultureWorkers;
  }

  private processMining(game: any): void {
    const ecoDept = this.departments.get(DepartmentType.ECONOMY);
    let leaderBonus = 0;
    if (ecoDept && ecoDept.leaderName) {
      const leader = game.personManager.getPerson(ecoDept.leaderName);
      if (leader) leaderBonus = Math.floor(leader.economy / 20);
    }

    let stopeCount = 0;
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (star && star.hasStope) stopeCount++;
    }
    if (stopeCount === 0) return;

    const workersPerStope = Math.floor(this.miningWorkers / stopeCount);
    let miningWeight = 2;
    const tm = this.tecTreeManager;
    if (tm.isTecFinished(TecTreeType.AEROSPACE, "星矿Ⅲ")) miningWeight = 5;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "星矿Ⅱ")) miningWeight = 4;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "星矿Ⅰ")) miningWeight = 3;

    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (!star || !star.hasStope) continue;
      let add = Math.floor((workersPerStope + leaderBonus) * miningWeight / 2);
      const treacheryFactor = Math.max(1, 100 - this.treachery);
      add = Math.floor(add * treacheryFactor / 100);
      add = Math.min(add, 100);
      if (add > star.currentResource) add = star.currentResource;
      star.currentResource -= add;
      this.resource += add;
    }
  }

  private processFactories(game: any): void {
    const ecoDept = this.departments.get(DepartmentType.ECONOMY);
    let leaderBonus = 0;
    if (ecoDept && ecoDept.leaderName) {
      const leader = game.personManager.getPerson(ecoDept.leaderName);
      if (leader) leaderBonus = Math.floor(leader.economy / 30);
    }

    let factoryCount = 0;
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (star && star.hasFactory) factoryCount++;
    }
    if (factoryCount === 0) {
      this.economy += Math.max(1, Math.floor(15 * (1 + this.civiLevel * 0.2)));
      return;
    }

    const workersPerFactory = Math.floor(this.factoryWorkers / factoryCount);
    let factoryWeight = 2;
    const tm = this.tecTreeManager;
    if (tm.isTecFinished(TecTreeType.AEROSPACE, "星厂Ⅲ")) factoryWeight = 5;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "星厂Ⅱ")) factoryWeight = 4;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "星厂Ⅰ")) factoryWeight = 3;

    let totalEco = 0;
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (!star || !star.hasFactory) continue;
      let add = Math.floor((workersPerFactory + leaderBonus) * factoryWeight / 2);
      if (tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型")) {
        add *= 5;
      }
      const treacheryFactor = Math.max(1, 100 - this.treachery);
      add = Math.floor(add * treacheryFactor / 100);
      const maxEco = tm.isTecFinished(TecTreeType.AEROSPACE, "行星发动机Ⅰ型") ? 500 : 100;
      add = Math.min(add, maxEco);

      const hasMassConversion = tm.isTecFinished(TecTreeType.INFORMATION, "质能转换");
      if (!hasMassConversion) {
        const resCost = add * 2;
        if (resCost > this.resource) add = Math.floor(this.resource / 2);
        this.resource -= add * 2;
      }
      totalEco += add;
    }
    this.economy += totalEco;
    if (this.economy > MAX_ECONOMY) this.economy = MAX_ECONOMY;
  }

  private processCulture(game: any): number {
    const culDept = this.departments.get(DepartmentType.CULTURE);
    let leaderBonus = 0;
    let deptBase = 5;
    if (culDept && culDept.leaderName) {
      const leader = game.personManager.getPerson(culDept.leaderName);
      if (leader) {
        leaderBonus = Math.floor(leader.social / 5);
        deptBase += Math.floor(leader.social * 0.5);
      }
    }

    let weight = 2;
    const tm = this.tecTreeManager;
    if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅲ")) weight = 5;
    else if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅱ")) weight = 4;
    else if (tm.isTecFinished(TecTreeType.INFORMATION, "思想钢印Ⅰ")) weight = 3;

    let cultureGain = Math.floor((this.cultureWorkers + leaderBonus) * weight / 20) + deptBase;
    cultureGain = Math.min(cultureGain, 100);
    return cultureGain;
  }


  private processTechResearch(game: any): void {
    const deptToTree: Map<DepartmentType, TecTreeType> = new Map([
      [DepartmentType.ASTROSOCIOLOGY, TecTreeType.PHYSICS],
      [DepartmentType.NUCLEAR, TecTreeType.AEROSPACE],
      [DepartmentType.SPACEFIGHT, TecTreeType.MILITARY],
      [DepartmentType.PROTON, TecTreeType.INFORMATION],
      [DepartmentType.ASTROPHYSICS, TecTreeType.INTERSTELLAR],
    ]);

    for (const [deptType, treeType] of deptToTree) {
      const dept = this.departments.get(deptType);
      let scienceBonus = 0;
      if (dept && dept.leaderName) {
        const leader = game.personManager.getPerson(dept.leaderName);
        if (leader) scienceBonus = Math.floor(leader.science / 10);
      }

      const tree = this.tecTreeManager.trees.get(treeType);
      if (!tree) continue;

      let hasActiveResearch = false;
      for (const node of tree.nodes.values()) {
        if (node.inResearch && !node.finished) {
          hasActiveResearch = true;
          break;
        }
      }

      if (!hasActiveResearch) {
        let bestNode: any = null;
        for (const node of tree.nodes.values()) {
          if (node.finished) continue;
          const parentFinished = !node.parentName || tree.isFinished(node.parentName);
          if (!parentFinished) continue;
          if (!bestNode || node.cost < bestNode.cost) {
            bestNode = node;
          }
        }
        if (bestNode) {
          bestNode.inResearch = true;
          game.addHistory(`自动开始研究: ${bestNode.name}`);
        }
      }

      for (const node of tree.nodes.values()) {
        if (node.inResearch && !node.finished) {
          let progress = 10 + scienceBonus;
          if (progress < 5) progress = 5;
          const treacheryFactor = Math.max(1, 100 - this.treachery);
          progress = Math.floor(progress * treacheryFactor / 100);
          if (game.isSophonBlocked()) {
            progress = Math.max(3, Math.floor(progress / 3));
          }
          progress = Math.min(progress, 100);
          node.currentWorkload += progress;
          if (node.currentWorkload >= node.totalWorkload) {
            node.currentWorkload = node.totalWorkload;
            node.finished = true;
            node.inResearch = false;
            game.addHistory(`科技研发完成: ${node.name}`);
          }
        }
      }
    }
  }

  private processPopulationGrowth(game: any): void {
    let growthWeight = 2;
    const tm = this.tecTreeManager;
    if (tm.isTecFinished(TecTreeType.AEROSPACE, "殖民城Ⅲ")) growthWeight = 5;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "殖民城Ⅱ")) growthWeight = 4;
    else if (tm.isTecFinished(TecTreeType.AEROSPACE, "殖民城Ⅰ")) growthWeight = 3;

    let cityCount = 0;
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (star && star.hasCity) cityCount++;
    }

    const baseGrowth = cityCount > 0 ? Math.floor(5 * growthWeight / 2) * cityCount : 1;
    const popGain = Math.min(baseGrowth, 30);

    const totalPopLimit = Array.from(this.starIndices).reduce((sum: number, idx: number) => {
      const s = game.starManager.getStar(idx);
      return sum + (s ? s.populationLimit : 0);
    }, 0);

    this.population += popGain;
    this.idlePopulation += popGain;
    this.idleWorkers += popGain;
    const maxPop = totalPopLimit * MAX_POPULATION_MULTIPLIER;
    if (this.population > maxPop) {
      this.population = maxPop;
    }
    if (this.idlePopulation > maxPop) {
      this.idlePopulation = maxPop;
    }
    if (this.idleWorkers > maxPop) {
      this.idleWorkers = maxPop;
    }

    const humanResDept = this.departments.get(DepartmentType.HUMANRES);
    if (humanResDept && humanResDept.leaderName) {
      const leader = game.personManager.getPerson(humanResDept.leaderName);
      if (leader) {
        const extraPop = Math.floor(leader.leadership * 0.2);
        this.population += extraPop;
        this.idlePopulation += extraPop;
        this.idleWorkers += extraPop;
      }
    }
  }

  private processTreachery(game: any): void {
    const earlyGameFactor = game.year < 100 ? 0.5 : 1.0;
    const randomGain = Math.floor(this.rng() * 3 * earlyGameFactor);
    this.treachery = Math.min(100, this.treachery + randomGain);
    if (this.treachery > 80) {
      game.addHistory(`【警告】逃亡主义上升至 ${this.treachery}，文明面临内部分裂风险！`);
    }
  }

  private syncStarPopulation(game: any): void {
    for (const idx of this.starIndices) {
      const star = game.starManager.getStar(idx);
      if (star) star.currentPopulation = this.population;
    }
  }

  private processFleets(game: any): void {
    for (let i = this.fleets.length - 1; i >= 0; i--) {
      const fleet = this.fleets[i];
      if (fleet.eta > 0) {
        fleet.eta--;
        if (fleet.eta === 0) {
          game.addHistory(`舰队 [${fleet.name}] 已抵达目的地星系 ${fleet.targetStarIndex}！`);
          const targetStar = game.starManager.getStar(fleet.targetStarIndex);
          if (targetStar && targetStar.belongToCivi !== this.name) {
            const tempDef = createBarback("temp_def", fleet.targetStarIndex);
            tempDef.soldierCount = 100;
            const win = CombatEngine.resolveFleetVsBarback(fleet, tempDef);
            if (win) {
              targetStar.belongToCivi = this.name;
              this.starIndices.add(fleet.targetStarIndex);
              game.addHistory(`【胜利】成功占领星系 ${targetStar.name}！`);
            } else {
              this.fleets.splice(i, 1);
            }
          }
        }
      }
    }
  }
}
