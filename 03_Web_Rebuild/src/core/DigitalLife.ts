import { GameInstance } from "./Game";

export class DigitalLife {
  public uploadPercentage: number = 0; // 0 to 100% of global population
  public activeServerCount: number = 0;
  public mossAutonomyLevel: number = 0; // 0 to 100%
  public resurrectedPersons: Set<string> = new Set();
  public digitalArkCapacity: number = 1000; // in million minds

  constructor() {
    this.uploadPercentage = 0;
    this.activeServerCount = 0;
    this.mossAutonomyLevel = 0;
    this.resurrectedPersons = new Set();
  }

  public constructQuantumServer(): string {
    const game = GameInstance.get();
    const cost = 150; // 150 resources to construct a 550W-powered server ark

    if (game.earthCivi.resource < cost) {
      return `资源不足！建造量子数据中心（服务器）需要 ${cost} 资源。`;
    }

    game.earthCivi.resource -= cost;
    this.activeServerCount += 1;
    this.digitalArkCapacity += 500;
    this.mossAutonomyLevel = Math.min(100, this.mossAutonomyLevel + 10);

    game.addHistory(`【数字生命】第 ${this.activeServerCount} 座量子数据中心建成。数字生命容纳容量上限提升至 ${this.digitalArkCapacity} 万人，MOSS自主度提升。`);
    return `成功建造了一台量子量子计算机服务器。容量增加。`;
  }

  public uploadConsciousness(amount: number): string {
    const game = GameInstance.get();
    if (this.activeServerCount === 0) {
      return "无法上传！请先建造量子服务器以提供存储器介质。";
    }

    const maxUploadRate = this.digitalArkCapacity / 10; // limits upload per turn
    const uploadAmount = Math.min(amount, maxUploadRate, game.earthCivi.population);

    if (uploadAmount <= 0) {
      return "没有可以上传的人口或服务器容量已满。";
    }

    game.earthCivi.population = Math.max(1, game.earthCivi.population - uploadAmount);
    this.uploadPercentage = Math.min(100, this.uploadPercentage + (uploadAmount / 1000) * 100);

    game.addHistory(`【数字永生】${uploadAmount.toFixed(1)} 亿人口选择放弃三维肉身，意识正式上传至数字太空方舟！`);
    
    if (this.uploadPercentage >= 95) {
      game.addFlag('digital_singularity_reached');
      game.addHistory("【数字天国】超过95%的人类意识已上传，人类文明进入超维数字演化形态！");
    }

    return `成功上传了 ${uploadAmount.toFixed(1)} 亿人口的意识。当前数字永生比例: ${this.uploadPercentage.toFixed(1)}%。`;
  }

  public resurrectLeader(name: string): string {
    const game = GameInstance.get();
    const leader = game.personManager.getPerson(name);
    if (!leader) return "未找到该历史人物。";
    if (game.personManager.availablePersons.has(name)) return `${name} 目前仍在现实阵营中存活，无需复活。`;
    if (this.resurrectedPersons.has(name)) return `${name} 已在量子架构中完成了数字重构。`;

    if (this.mossAutonomyLevel < 30) {
      return "复活失败：MOSS自主计算力不足 (需要MOSS自主度达到30%以完成超维意识拓扑结构映射)。";
    }

    this.resurrectedPersons.add(name);
    game.personManager.unlockPerson(name); // unlocks back
    game.addHistory(`【数字生命重构】量子超脑 550W 成功加载了已故先烈 ${name} 的全频段思维备份，其数字体正式重回决策中枢！`);
    return `成功在数字世界中复活了领袖: ${name}！`;
  }

  public processTurn(): void {
    if (this.activeServerCount > 0) {
      const game = GameInstance.get();
      // MOSS passive firewall reduces treachery (cyber security)
      const reduction = Math.floor(this.mossAutonomyLevel * 0.1);
      if (reduction > 0) {
        game.earthCivi.treachery = Math.max(0, game.earthCivi.treachery - reduction);
      }
    }
  }
}
