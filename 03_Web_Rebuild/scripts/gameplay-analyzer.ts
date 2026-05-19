// gameplay-analyzer.ts — Headless gameplay analysis script
// 不改动任何游戏源码，仅通过标准 API 进行游玩分析

import { GameInstance, Game } from "../src/core/Game";
import { EarthCivilization } from "../src/core/EarthCivilization";
import { FriendshipType } from "../src/types/enums";
import { STAR_INDEX } from "../src/config/starIndices";

interface TurnSnapshot {
  turn: number;
  economy: number;
  resource: number;
  culture: number;
  population: number;
  army: number;
  treachery: number;
  deterrence: number;
  civiLevel: number;
  techsCompleted: number;
  alienCount: number;
  eventQueueLen: number;
}

const results: TurnSnapshot[] = [];
const errors: string[] = [];
const warnings: string[] = [];

function snapshot(game: Game, turn: number): TurnSnapshot {
  const e = game.earthCivi;
  let techsCompleted = 0;
  for (const tree of e.tecTreeManager.trees.values()) {
    for (const node of tree.nodes.values()) {
      if (node.finished) techsCompleted++;
    }
  }
  return {
    turn,
    economy: e.economy,
    resource: e.resource,
    culture: e.culture,
    population: e.population,
    army: e.army,
    treachery: e.treachery,
    deterrence: e.deterrenceValue,
    civiLevel: e.civiLevel,
    techsCompleted,
    alienCount: game.alienCiviManager.aliens.size,
    eventQueueLen: game.eventQueue.length,
  };
}

function safeRunRound(game: Game): void {
  if (game.eventQueue.length > 0 || game.currentEvent) {
    while (game.eventQueue.length > 0) {
      game.processNextEvent();
      if (game.currentEvent) {
        if (game.currentEvent.choices && game.currentEvent.choices.length > 0) {
          try {
            game.currentEvent.choices[0].action();
          } catch (e: any) {
            errors.push(`Turn ${game.year}: Event choice error: ${e.message}`);
          }
        }
        game.currentEvent = null;
      }
    }
  }
  game.runARound();
  while (game.eventQueue.length > 0 || game.currentEvent) {
    if (game.currentEvent?.choices?.length) {
      try {
        game.currentEvent.choices[0].action();
      } catch (e: any) {}
    }
    game.processNextEvent();
  }
}

// Create a mock window object for the game to dispatch events on
(global as any).window = {
  dispatchEvent: (e: any) => {
    // swallow events in headless mode
  },
  CustomEvent: class {
    type: string;
    constructor(type: string) { this.type = type; }
  },
};

console.log("========== 宇宙群英传 Headless 游玩分析 ==========\n");

// Phase 1: Initialize
const game = GameInstance.get();
console.log(`游戏初始化完成`);
console.log(`初始年份: ${game.year}`);
console.log(`初始纪元: ${game.epoch}`);
console.log(`异星文明数: ${game.alienCiviManager.aliens.size}`);
console.log(`人物数量: ${game.personManager.persons.size}`);
console.log(`科技树: ${game.earthCivi.tecTreeManager.trees.size} 条`);
console.log(`星球总数: ${game.starManager.stars.size}`);
console.log("");

const earth = game.earthCivi;
const earthStar = game.starManager.getStar(STAR_INDEX.EARTH);
if (!earthStar) {
  errors.push("FATAL: 地球 (index=4) 不存在！");
}

// Initial state check
console.log("--- 初始状态检查 ---");
console.log(`地球人口: ${earth.population}`);
console.log(`地球经济: ${earth.economy}`);
console.log(`地球资源: ${earth.resource}`);
console.log(`闲散工人: ${earth.idlePopulation}`);
console.log(`初始文明等级: ${earth.getCiviLevelLabel()}`);
console.log(`三体友好度: ${game.alienCiviManager.aliens.get('三体')?.friendshipType}`);
console.log(`智子封锁: ${game.isSophonBlocked()}`);
console.log("");

// Check initial bugs
if (earth.population <= 0) errors.push("INIT: 地球人口初始为0");
if (earth.idlePopulation <= 0) warnings.push("INIT: 闲散工人为0");
if (!earthStar?.hasStope && !earthStar?.hasFactory && !earthStar?.hasCity) {
  console.log("注意: 地球初始状态无任何建筑设施\n");
}

// Phase 2: Run 50 turns with basic strategy
console.log("--- Phase 2: 50回合基础发展 ---");
results.push(snapshot(game, 0));

for (let t = 1; t <= 50; t++) {
  // Strategy: build infrastructure ASAP
  const es = game.starManager.getStar(STAR_INDEX.EARTH);
  if (es && !es.hasStope && earth.economy >= 30) {
    earth.economy -= 30;
    es.hasStope = true;
  }
  if (es && !es.hasFactory && earth.economy >= 50) {
    earth.economy -= 50;
    es.hasFactory = true;
  }
  if (es && !es.hasCity && earth.economy >= 80) {
    earth.economy -= 80;
    es.hasCity = true;
  }
  
  safeRunRound(game);
  results.push(snapshot(game, t));
  
  if (game.isGameOver) {
    console.log(`游戏在第 ${t} 回合结束: ${game.gameOverReason}`);
    break;
  }
}

const last50 = results[results.length - 1];
console.log(`50回合后 - 经济:${last50.economy} 资源:${last50.resource} 人口:${last50.population} 文化:${last50.culture}`);
console.log(`完成科技: ${last50.techsCompleted} 文明等级: ${last50.civiLevel}`);
console.log(`斗亡主义: ${last50.treachery} 威慑度: ${last50.deterrence}`);
console.log("");

// Phase 3: Run to turn 150 with alliances
console.log("--- Phase 3: 外交与科技发展 (51-150回合) ---");
const startTurn = results.length;
for (let t = startTurn; t <= 150 && !game.isGameOver; t++) {
  // Apply some diplomacy every 10 turns
  if (t % 10 === 0) {
    for (const [name, alien] of game.alienCiviManager.aliens) {
      if (!alien.isDieOut() && alien.friendshipType < FriendshipType.FRIEND && alien.diplomacyCooldown <= 0) {
        game.conductDiplomacy(name, 'negotiate');
      }
    }
  }
  
  safeRunRound(game);
  if (t % 10 === 0) {
    results.push(snapshot(game, t));
  }
  if (game.isGameOver) {
    console.log(`游戏在第 ${t} 回合结束: ${game.gameOverReason}`);
    break;
  }
}

results.push(snapshot(game, game.year));
const last150 = results[results.length - 1];
console.log(`150回合后 - 经济:${last150.economy} 资源:${last150.resource} 人口:${last150.population}`);
console.log(`完成科技: ${last150.techsCompleted} 文明等级: ${last150.civiLevel}`);
console.log(`斗亡主义: ${last150.treachery} 威慑度: ${last150.deterrence}`);
console.log("");

// Phase 4: Run to game end or 400 turns
console.log("--- Phase 4: 长时运行至结束 (最多400回合) ---");
const finalStart = game.year;
for (let t = finalStart; t <= 400 && !game.isGameOver; t++) {
  safeRunRound(game);
  if (t % 25 === 0) {
    results.push(snapshot(game, t));
  }
  if (game.isGameOver) break;
}

results.push(snapshot(game, game.year));

console.log("\n========== 最终结算 ==========");
if (game.isGameOver) {
  console.log(`游戏结束: ${game.gameOverReason}`);
  console.log(`胜利类型: ${game.victoryType}`);
} else {
  console.log(`游戏未结束，最终回合: ${game.year}`);
}
console.log(`最终经济: ${earth.economy}`);
console.log(`最终文化: ${earth.culture}`);
console.log(`最终人口: ${earth.population}`);
console.log(`最终军力: ${earth.army}`);
console.log(`逃亡主义: ${earth.treachery}`);
console.log(`威慑度: ${earth.deterrenceValue}`);
console.log(`文明等级: ${earth.getCiviLevelLabel()}`);

// Tech completion check
console.log("\n--- 科技完成情况 ---");
let totalTechs = 0;
let finishedTechs = 0;
for (const [type, tree] of earth.tecTreeManager.trees) {
  for (const [name, node] of tree.nodes) {
    totalTechs++;
    if (node.finished) finishedTechs++;
  }
}
console.log(`科技总完成: ${finishedTechs}/${totalTechs}`);

// Alien status
console.log("\n--- 异星文明状态 ---");
for (const [name, alien] of game.alienCiviManager.aliens) {
  console.log(`  ${name}: 人口=${alien.population} 资源=${alien.resource} 军力=${alien.army} 关系=${alien.friendshipType} 已灭=${alien.isDieOut()}`);
}

// Resource growth analysis
console.log("\n--- 资源增长曲线 ---");
const milestones = [10, 25, 50, 100, 150, 200];
for (const m of milestones) {
  const found = results.find(r => r.turn >= m);
  if (found) {
    console.log(`  Turn ${found.turn}: 经济=${found.economy} 资源=${found.resource} 人口=${found.population} 文化=${found.culture}`);
  }
}

// Save/Load test
console.log("\n--- 存档往返测试 ---");
const beforeSave = { ...last150 };
GameInstance.saveGame();
const loadSuccess = GameInstance.loadGame();
if (loadSuccess) {
  const afterLoad = snapshot(GameInstance.get(), game.year);
  const diffs: string[] = [];
  for (const key of Object.keys(beforeSave) as (keyof TurnSnapshot)[]) {
    if (beforeSave[key] !== afterLoad[key]) {
      diffs.push(`${key}: ${beforeSave[key]} -> ${afterLoad[key]}`);
    }
  }
  if (diffs.length > 0) {
    console.log("存档往返差异:");
    diffs.forEach(d => console.log(`  ${d}`));
    errors.push(`存档往返: ${diffs.length} 项差异`);
  } else {
    console.log("存档往返测试通过 - 所有状态一致");
  }
} else {
  console.log("存档读取失败");
  errors.push("存档往返: 读取失败");
}

// Error report
console.log("\n========== 错误报告 ==========");
if (errors.length === 0 && warnings.length === 0) {
  console.log("无错误或警告");
} else {
  console.log(`错误 (${errors.length}):`);
  errors.forEach(e => console.log(`  [ERR] ${e}`));
  console.log(`警告 (${warnings.length}):`);
  warnings.forEach(w => console.log(`  [WARN] ${w}`));
}

// Summary
console.log("\n========== 游玩体验总结 ==========");
const finalSnap = results[results.length - 1];
const firstSnap = results[0];

console.log(`总回合数: ${game.year}`);
console.log(`经济增长: ${firstSnap.economy} -> ${finalSnap.economy} (${finalSnap.economy - firstSnap.economy})`);
console.log(`人口增长: ${firstSnap.population} -> ${finalSnap.population} (${finalSnap.population - firstSnap.population})`);
console.log(`文化增长: ${firstSnap.culture} -> ${finalSnap.culture} (${finalSnap.culture - firstSnap.culture})`);
console.log(`军力增长: ${firstSnap.army} -> ${finalSnap.army} (${finalSnap.army - firstSnap.army})`);
console.log(`逃亡主义: ${firstSnap.treachery} -> ${finalSnap.treachery}`);
console.log(`科技完成: ${finalSnap.techsCompleted}/${totalTechs}`);

export { results, errors, warnings };