// AP 系统规则模拟器
// 规则：AP 不自动恢复到上限，只有任命部长才在下回合恢复加成
// 验证：是否会死锁、不同部长数量下的可操作空间

const AP_MAX = 100;
const DEPT_MAX = 11;
const AP_PER_DEPT = 5;        // 每位部长每回合恢复 +5
const BASE_RECOVERY = 0;      // 用户规则：不直接回复全部
const CULTURE_GROWTH_PER_TURN = 2;  // 每回合文化自然增长
const CULTURE_BONUS_DIVISOR = 100; // floor(culture/100)

// 操作消耗
const COST = {
  adjustRatio: 10,    // 调整工种比例
  setResearch: 20,    // 指派科研
  buildFleet: 30,     // 建造星舰编队
  dispatchFleet: 10,  // 派遣舰队
  assignMinister: 5,  // 任命部长
};

// AI 智脑折扣
const AI_DISCOUNT = 0.5;

// 纪元加成
const EPOCH_BONUS = {
  golden: 0,      // 黄金岁月
  crisis: 10,     // 危机纪元
  deterrence: 20, // 威慑纪元
  broadcast: 0,   // 广播纪元
  bunker: -10,    // 掩体纪元
  galaxy: 0,      // 银河纪元
};

/**
 * 模拟单局游戏
 * @param {object} opts
 * @param {number} opts.epochs        模拟总回合数
 * @param {number} opts.startDepts    初始已任命部长数
 * @param {number[]} opts.appointPlan  每回合任命的部长数（追加）
 * @param {boolean} opts.aiBrain      是否开启 AI 智脑
 * @param {string} opts.epoch         纪元 key
 * @param {function} opts.actionPolicy 每回合操作策略，返回操作列表
 */
function simulate(opts) {
  const {
    epochs = 30,
    startDepts = 0,
    appointPlan = [],
    aiBrain = false,
    epoch = 'crisis',
    actionPolicy = defaultActionPolicy,
  } = opts;

  let apCurrent = AP_MAX;
  let depts = startDepts;
  let culture = 0;
  const log = [];

  for (let turn = 1; turn <= epochs; turn++) {
    // 1. 回合开始：恢复 AP
    const deptBonus = depts * AP_PER_DEPT;
    const cultureBonus = Math.floor(culture / CULTURE_BONUS_DIVISOR);
    const epochBonus = EPOCH_BONUS[epoch] || 0;
    const recovery = BASE_RECOVERY + deptBonus + cultureBonus + epochBonus;
    const beforeRecover = apCurrent;
    apCurrent = Math.min(AP_MAX, apCurrent + recovery);

    // 2. 任命部长（按计划）
    const appointNow = appointPlan[turn - 1] || 0;
    for (let i = 0; i < appointNow && depts < DEPT_MAX; i++) {
      const cost = aiBrain ? Math.floor(COST.assignMinister * AI_DISCOUNT) : COST.assignMinister;
      if (apCurrent >= cost) {
        apCurrent -= cost;
        depts++;
      }
    }

    // 3. 文化自然增长
    culture += CULTURE_GROWTH_PER_TURN;

    // 4. 执行玩家操作策略
    const actions = actionPolicy({ turn, apCurrent, depts, culture, aiBrain });
    let totalSpent = 0;
    const executed = [];
    for (const action of actions) {
      const cost = aiBrain ? Math.floor(COST[action] * AI_DISCOUNT) : COST[action];
      if (apCurrent >= cost) {
        apCurrent -= cost;
        totalSpent += cost;
        executed.push(action);
      }
    }

    log.push({
      turn,
      apBeforeRecover: beforeRecover,
      recovery,
      apAfterRecover: apCurrent + totalSpent,
      depts,
      deptBonus,
      cultureBonus,
      epochBonus,
      apFinal: apCurrent,
      executed,
      totalSpent,
    });
  }

  return log;
}

/**
 * 默认操作策略：每回合尽量做"标准动作"
 * - 调 1 次工种比例
 * - 换 1 次科研
 * - 建造舰队（如果 AP 充足）
 */
function defaultActionPolicy({ apCurrent, aiBrain }) {
  const actions = [];
  const factor = aiBrain ? AI_DISCOUNT : 1;
  // 优先级：科研 > 工种 > 舰队
  if (apCurrent >= COST.setResearch * factor) actions.push('setResearch');
  if (apCurrent >= COST.adjustRatio * factor) actions.push('adjustRatio');
  if (apCurrent >= COST.buildFleet * factor) actions.push('buildFleet');
  return actions;
}

/**
 * 早期开局策略：集中 AP 任命部长
 */
function earlyGameRush({ apCurrent, depts }) {
  const actions = [];
  // 早期优先任命部长
  if (depts < 5 && apCurrent >= COST.assignMinister) {
    actions.push('assignMinister');
  }
  // 剩余 AP 调工种
  if (apCurrent - COST.assignMinister >= COST.adjustRatio) {
    actions.push('adjustRatio');
  }
  return actions;
}

/**
 * 中期发展策略：均衡微操
 */
function midGame({ apCurrent, aiBrain }) {
  const actions = [];
  const factor = aiBrain ? AI_DISCOUNT : 1;
  if (apCurrent >= COST.adjustRatio * factor) actions.push('adjustRatio');
  if (apCurrent >= COST.setResearch * factor) actions.push('setResearch');
  if (apCurrent >= COST.dispatchFleet * factor) actions.push('dispatchFleet');
  return actions;
}

// ============= 运行模拟场景 =============

console.log('='.repeat(80));
console.log('AP 系统规则模拟验证');
console.log('规则：基础恢复=0，仅部长加成(+5/位)+文化加成+纪元加成');
console.log('='.repeat(80));

const scenarios = [
  {
    name: '场景 A：0 部长，纯手动，危机纪元',
    opts: { epochs: 15, startDepts: 0, epoch: 'crisis', actionPolicy: defaultActionPolicy },
  },
  {
    name: '场景 B：1 部长开局，纯手动，危机纪元',
    opts: { epochs: 15, startDepts: 1, epoch: 'crisis', actionPolicy: defaultActionPolicy },
  },
  {
    name: '场景 C：3 部长开局，纯手动，危机纪元',
    opts: { epochs: 15, startDepts: 3, epoch: 'crisis', actionPolicy: defaultActionPolicy },
  },
  {
    name: '场景 D：11 部长全满，纯手动，威慑纪元',
    opts: { epochs: 15, startDepts: 11, epoch: 'deterrence', actionPolicy: midGame },
  },
  {
    name: '场景 E：0 部长开局，早期集中任命（每回合任命 1 位）',
    opts: {
      epochs: 20,
      startDepts: 0,
      epoch: 'crisis',
      appointPlan: Array(11).fill(1),  // 前 11 回合每回合任命 1 位
      actionPolicy: earlyGameRush,
    },
  },
  {
    name: '场景 F：0 部长 + AI 智脑（半价消耗）',
    opts: { epochs: 15, startDepts: 0, aiBrain: true, epoch: 'crisis', actionPolicy: defaultActionPolicy },
  },
  {
    name: '场景 G：3 部长 + AI 智脑，威慑纪元',
    opts: { epochs: 15, startDepts: 3, aiBrain: true, epoch: 'deterrence', actionPolicy: midGame },
  },
  {
    name: '场景 H：掩体纪元（-10 加成），5 部长',
    opts: { epochs: 15, startDepts: 5, epoch: 'bunker', actionPolicy: midGame },
  },
];

for (const scenario of scenarios) {
  console.log('\n' + '-'.repeat(80));
  console.log(`▶ ${scenario.name}`);
  console.log('-'.repeat(80));

  const log = simulate(scenario.opts);

  // 输出表头
  console.log(
    '回合 | 恢复前 | 恢复量 | 部长 | 部长加成 | 文化 | 纪元 | 恢复后 | 操作 | 花费 | 期末AP'
  );
  console.log('-'.repeat(80));

  let totalActions = 0;
  let zeroApTurns = 0;
  let zeroActionTurns = 0;

  for (const row of log) {
    const actionStr = row.executed.length > 0 ? row.executed.join(',') : '（无）';
    console.log(
      `${String(row.turn).padStart(2)} | ${String(row.apBeforeRecover).padStart(6)} | ${String(row.recovery).padStart(6)} | ${String(row.depts).padStart(4)} | ${String(row.deptBonus).padStart(8)} | ${String(row.cultureBonus).padStart(4)} | ${String(row.epochBonus).padStart(4)} | ${String(row.apAfterRecover).padStart(6)} | ${actionStr.padEnd(28)} | ${String(row.totalSpent).padStart(4)} | ${String(row.apFinal).padStart(6)}`
    );
    totalActions += row.executed.length;
    if (row.apFinal === 0) zeroApTurns++;
    if (row.executed.length === 0) zeroActionTurns++;
  }

  // 统计分析
  const finalAp = log[log.length - 1].apFinal;
  const avgActions = (totalActions / log.length).toFixed(2);
  console.log('-'.repeat(80));
  console.log(`📊 统计：`);
  console.log(`   期末 AP: ${finalAp}`);
  console.log(`   期末部长数: ${log[log.length - 1].depts}/${DEPT_MAX}`);
  console.log(`   平均每回合操作数: ${avgActions}`);
  console.log(`   AP 归零回合数: ${zeroApTurns}/${log.length}`);
  console.log(`   零操作回合数: ${zeroActionTurns}/${log.length}`);
  
  // 风险判定
  const risks = [];
  if (zeroActionTurns > log.length / 2) risks.push('⚠️ 过半回合无法操作，玩家体验极差');
  if (zeroActionTurns === log.length) risks.push('❌ 完全死锁：全程无法执行任何操作');
  if (avgActions < 1) risks.push('⚠️ 平均每回合操作不足 1 次，策略空间过小');
  if (finalAp === 0 && log[log.length - 1].depts === 0) risks.push('⚠️ 0 部长时 AP 永久归零');
  
  if (risks.length === 0) {
    console.log(`   ✅ 无明显风险`);
  } else {
    console.log(`   风险提示：`);
    risks.forEach(r => console.log(`   ${r}`));
  }
}

console.log('\n' + '='.repeat(80));
console.log('结论与建议');
console.log('='.repeat(80));
