import { describe, it, expect, beforeEach } from 'vitest';
import { DigitalLife } from '../../core/DigitalLife';
import { GameInstance } from '../../core/Game';

function setupGame() {
  GameInstance.reset();
  return GameInstance.get();
}

describe('DigitalLife', () => {
  let dl: DigitalLife;

  beforeEach(() => {
    dl = new DigitalLife();
  });

  it('初始属性', () => {
    expect(dl.uploadPercentage).toBe(0);
    expect(dl.activeServerCount).toBe(0);
    expect(dl.mossAutonomyLevel).toBe(0);
    expect(dl.resurrectedPersons.size).toBe(0);
    expect(dl.digitalArkCapacity).toBe(1000);
  });

  it('constructQuantumServer 资源不足时返回错误', () => {
    const game = setupGame();
    game.earthCivi.resource = 0;
    const result = dl.constructQuantumServer();
    expect(result).toContain('资源不足');
    expect(dl.activeServerCount).toBe(0);
  });

  it('constructQuantumServer 成功建造服务器', () => {
    const game = setupGame();
    game.earthCivi.resource = 500;
    const result = dl.constructQuantumServer();
    expect(result).toContain('成功建造');
    expect(dl.activeServerCount).toBe(1);
    expect(dl.digitalArkCapacity).toBe(1500);
    expect(dl.mossAutonomyLevel).toBe(10);
    expect(game.earthCivi.resource).toBe(350);
  });

  it('constructQuantumServer 多次建造增加容量和自主度', () => {
    const game = setupGame();
    game.earthCivi.resource = 1000;
    dl.constructQuantumServer();
    dl.constructQuantumServer();
    expect(dl.activeServerCount).toBe(2);
    expect(dl.digitalArkCapacity).toBe(2000);
    expect(dl.mossAutonomyLevel).toBe(20);
  });

  it('uploadConsciousness 无服务器时失败', () => {
    const result = dl.uploadConsciousness(10);
    expect(result).toContain('无法上传');
  });

  it('uploadConsciousness 成功上传人口', () => {
    const game = setupGame();
    dl.activeServerCount = 1;
    game.earthCivi.population = 100;
    const result = dl.uploadConsciousness(10);
    expect(result).toContain('成功上传');
    expect(game.earthCivi.population).toBeLessThan(100);
    expect(dl.uploadPercentage).toBeGreaterThan(0);
  });

  it('uploadConsciousness 人口不低于1', () => {
    const game = setupGame();
    dl.activeServerCount = 1;
    game.earthCivi.population = 5;
    dl.uploadConsciousness(100);
    expect(game.earthCivi.population).toBeGreaterThanOrEqual(1);
  });

  it('uploadConsciousness 多次上传达到95%触发数字奇点', () => {
    const game = setupGame();
    dl.activeServerCount = 20; // 高容量确保上传速率足够
    game.earthCivi.population = 20000;
    // 多次上传直到上传率达到95%
    for (let i = 0; i < 50; i++) {
      dl.uploadConsciousness(2000);
      if (game.hasFlag('digital_singularity_reached')) break;
    }
    expect(game.hasFlag('digital_singularity_reached')).toBe(true);
  });

  it('resurrectLeader 人物不存在返回错误', () => {
    const result = dl.resurrectLeader('不存在的人');
    expect(result).toContain('未找到');
  });

  it('resurrectLeader MOSS自主度不足返回错误', () => {
    const result = dl.resurrectLeader('罗辑');
    expect(result).toContain('MOSS自主计算力不足');
    expect(dl.resurrectedPersons.has('罗辑')).toBe(false);
  });

  it('resurrectLeader 成功复活人物', () => {
    const game = setupGame();
    dl.mossAutonomyLevel = 50;
    const result = dl.resurrectLeader('罗辑');
    expect(result).toContain('成功在数字世界中复活');
    expect(dl.resurrectedPersons.has('罗辑')).toBe(true);
    expect(game.personManager.availablePersons.has('罗辑')).toBe(true);
  });

  it('resurrectLeader 已复活的人物不重复复活', () => {
    const game = setupGame();
    dl.mossAutonomyLevel = 50;
    // 先将人物从可用列表移除，以跳过"已在现实中存活"的检查
    game.personManager.availablePersons.delete('罗辑');
    const firstResult = dl.resurrectLeader('罗辑');
    expect(firstResult).toContain('成功在数字世界中复活');
    expect(dl.resurrectedPersons.has('罗辑')).toBe(true);

    // resurrectLeader 解锁了人物，第二次调用会先检查 availablePersons
    // 需要再次删除以通过该检查，进入 resurrectedPersons 检查
    game.personManager.availablePersons.delete('罗辑');
    const secondResult = dl.resurrectLeader('罗辑');
    expect(secondResult).toContain('数字重构');
    expect(dl.resurrectedPersons.size).toBe(1);
  });

  it('processTurn 有服务器时减少逃亡主义', () => {
    const game = setupGame();
    dl.activeServerCount = 1;
    dl.mossAutonomyLevel = 50;
    game.earthCivi.treachery = 30;
    dl.processTurn();
    expect(game.earthCivi.treachery).toBe(25); // 30 - floor(50 * 0.1) = 25
  });

  it('processTurn 无服务器时不影响逃亡主义', () => {
    const game = setupGame();
    game.earthCivi.treachery = 30;
    dl.processTurn();
    expect(game.earthCivi.treachery).toBe(30);
  });

  it('MOSS自主度积累', () => {
    const game = setupGame();
    game.earthCivi.resource = 5000;
    for (let i = 0; i < 10; i++) {
      dl.constructQuantumServer();
    }
    expect(dl.mossAutonomyLevel).toBe(100); // max 100
    expect(dl.activeServerCount).toBe(10);
  });

  it('uploadConsciousness 受服务器容量限制', () => {
    const game = setupGame();
    dl.activeServerCount = 1;
    dl.digitalArkCapacity = 1500; // 手动设置容量以匹配 activeServerCount=1
    game.earthCivi.population = 2000;
    const result = dl.uploadConsciousness(2000);
    // maxUploadRate = digitalArkCapacity / 10 = 1500 / 10 = 150
    expect(result).toContain('成功上传');
    expect(game.earthCivi.population).toBe(2000 - 150);
    // uploadPercentage = (150 / 1000) * 100 = 15
    expect(dl.uploadPercentage).toBeCloseTo(15, 1);
  });
});