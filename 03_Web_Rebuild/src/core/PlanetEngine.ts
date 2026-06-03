import { GameInstance } from "./Game";

export class PlanetEngine {
  public totalEngines: number = 12000; // Original wandering earth requires 12000 engines
  public enginesBuilt: number = 0;
  public thrustLevel: number = 0; // 0 to 100%
  public currentDistanceTravelled: number = 0; // in Astronomical Units (AU) or Light Years
  public targetDistance: number = 4.22; // Distance to Proxima Centauri (LY)
  public status: 'PLANNING' | 'CONSTRUCTING' | 'ORBIT_SHIFT' | 'FLIGHT' | 'COMPLETED' = 'PLANNING';
  public moonCrisisResolved: boolean = false;
  
  constructor() {
    this.enginesBuilt = 0;
    this.thrustLevel = 0;
    this.currentDistanceTravelled = 0;
    this.status = 'PLANNING';
  }

  public buildEngines(amount: number): string {
    const game = GameInstance.get();
    const cost = amount * 10; // 10 resources per engine

    if (game.earthCivi.resource < cost) {
      return `资源不足！建造 ${amount} 台行星发动机需要 ${cost} 资源。`;
    }

    game.earthCivi.resource -= cost;
    this.enginesBuilt = Math.min(this.totalEngines, this.enginesBuilt + amount);

    if (this.status === 'PLANNING') {
      this.status = 'CONSTRUCTING';
    }

    if (this.enginesBuilt >= this.totalEngines && this.status === 'CONSTRUCTING') {
      this.status = 'ORBIT_SHIFT';
      game.addHistory("【行星发动机】全球12000台重元素聚变行星发动机全部建造完成！地球已具备启航变轨能力！");
    }

    return `成功建造 ${amount} 台行星发动机。当前进度: ${this.enginesBuilt}/${this.totalEngines}。`;
  }

  public initiateOrbitShift(): string {
    if (this.status !== 'ORBIT_SHIFT') {
      return `无法启动变轨！当前状态: ${this.status} (需要发动机全部建造完毕)。`;
    }

    const game = GameInstance.get();
    this.status = 'FLIGHT';
    this.thrustLevel = 100;
    game.addFlag('wandering_earth_started');
    game.addHistory("【启航】地球发动机全功率启动！巨大的等离子蓝色尾焰直冲云霄，地球正式脱离太阳轨道，向比邻星启航！");
    return "地球发动机全力启动，变轨逃逸计划正式执行！";
  }

  public processTurn(): void {
    if (this.status === 'FLIGHT') {
      const game = GameInstance.get();
      // Distance grows by thrust and technology levels
      const speed = 0.05 + (game.earthCivi.tecTreeManager.isTecFinishedAnywhere("重元素聚变") ? 0.03 : 0);
      this.currentDistanceTravelled = Math.min(this.targetDistance, this.currentDistanceTravelled + speed);

      game.addHistory(`【航行纪实】地球在太空中高速行驶，距目标比邻星还有 ${(this.targetDistance - this.currentDistanceTravelled).toFixed(2)} 光年。`);

      if (this.currentDistanceTravelled >= this.targetDistance) {
        this.status = 'COMPLETED';
        game.addFlag('wandering_completed');
        game.addHistory("【抵达】人类文明经历了漫长的流浪，地球终于滑入了比邻星引力轨道，流浪地球计划大获成功！");
      }
    }
  }
}
