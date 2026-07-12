#!/usr/bin/env node
/**
 * 纪元级因果链一致性审计自动化脚本
 *
 * 用途：
 *   - 读取 AUDIT_BASELINE 与已完成的 EPOCH_AUDIT_MODEL_<纪元名>
 *   - 按统一模型对各纪元执行取证、登记候选问题、输出 EPOCH_EVIDENCE_<纪元名>
 *   - 供主审在新窗口中快速恢复审计上下文
 *
 * 用法：
 *   node scripts/audit-epoch.mjs <纪元名> [--phase model|evidence|final]
 *
 * 示例：
 *   node scripts/audit-epoch.mjs 危机纪元 --phase evidence
 *   node scripts/audit-epoch.mjs 威慑纪元 --phase model
 *
 * 输出：
 *   - 控制台打印审计上下文摘要
 *   - 在 02_Project_Documentation/ 下生成/更新对应阶段文档骨架
 *
 * 注意：
 *   本脚本只做上下文恢复与文档骨架生成，不执行代码修改，不判定 Bug 等级。
 *   主审仍需结合子代理取证结果人工填写证据与结论。
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..');
const DOC_DIR = resolve(ROOT, '..', '02_Project_Documentation');

// 纪元索引映射（与 epochs.json 一致）
const EPOCH_MAP = {
  '黄金岁月': 0,
  '危机纪元': 1,
  '威慑纪元': 2,
  '广播纪元': 3,
  '掩体纪元': 4,
  '银河纪元': 5,
  '星屑纪元': 6,
};

// 纪元代码名（与 GameEventManager.ts:750 一致）
const EPOCH_CODE_NAMES = ['GOLDEN', 'CRISIS', 'DETERRENCE', 'BROADCAST', 'BUNKER', 'GALAXY', 'STARDUST'];

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: node scripts/audit-epoch.mjs <纪元名> [--phase model|evidence|final]');
    process.exit(1);
  }
  const epochName = args[0];
  const phaseArg = args.find(a => a.startsWith('--phase='));
  const phase = phaseArg ? phaseArg.split('=')[1] : (args.find(a => a === '--phase') ? args[args.indexOf('--phase') + 1] : 'model');
  return { epochName, phase: phase || 'model' };
}

function loadBaseline() {
  const baselinePath = resolve(DOC_DIR, 'AUDIT_20260712_BASELINE.md');
  if (!existsSync(baselinePath)) {
    console.warn(`[警告] 未找到基线文档: ${baselinePath}`);
    console.warn('请先完成第一阶段全局审计基线。');
    return null;
  }
  return readFileSync(baselinePath, 'utf-8');
}

function findExistingModel(epochName) {
  // 查找已完成的 EPOCH_AUDIT_MODEL_<纪元名>
  const patterns = [
    `EPOCH_AUDIT_MODEL_${epochName}.md`,
    `AUDIT_${new Date().getFullYear()}_EPOCH_MODEL_${epochName}.md`,
  ];
  for (const p of patterns) {
    const full = resolve(DOC_DIR, p);
    if (existsSync(full)) return { path: full, content: readFileSync(full, 'utf-8') };
  }
  // 模糊查找
  const files = readdirSync(DOC_DIR).filter(f => f.includes('EPOCH_AUDIT_MODEL') && f.includes(epochName));
  if (files.length > 0) {
    const full = resolve(DOC_DIR, files[0]);
    return { path: full, content: readFileSync(full, 'utf-8') };
  }
  return null;
}

function findExistingEvidence(epochName) {
  const files = readdirSync(DOC_DIR).filter(f => f.includes('EPOCH_EVIDENCE') && f.includes(epochName));
  if (files.length > 0) {
    return { path: resolve(DOC_DIR, files[0]), content: readFileSync(resolve(DOC_DIR, files[0]), 'utf-8') };
  }
  return null;
}

function getEpochInfo(epochName) {
  const idx = EPOCH_MAP[epochName];
  if (idx === undefined) {
    console.error(`[错误] 未知纪元名: ${epochName}`);
    console.error(`支持的纪元: ${Object.keys(EPOCH_MAP).join(', ')}`);
    process.exit(1);
  }
  const codeName = EPOCH_CODE_NAMES[idx];
  // 读取 epochs.json
  const epochsPath = resolve(ROOT, 'src/data/epochs.json');
  const epochsData = JSON.parse(readFileSync(epochsPath, 'utf-8'));
  const epochData = epochsData.find(e => e.epoch === idx);
  return { idx, codeName, epochData };
}

function generateModelSkeleton(epochName, epochInfo, baseline) {
  const { idx, codeName, epochData } = epochInfo;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `# \`EPOCH_AUDIT_MODEL_${epochName}\`

> 纪元：${epochName}（${codeName}, epoch=${idx}）
> 阶段：纪元审计模型建立（未输出正式缺陷结论，未修改代码）
> 证据截止：${date}
> 基线引用：AUDIT_20260712_BASELINE.md

---

## 一、纪元状态卡

### 1.1 基础信息

| 属性 | 值 | 证据状态 |
|---|---|---|
| 纪元索引 | ${idx} | CONFIRMED（epochs.json） |
| 纪元名称 | ${epochName} / ${codeName} | CONFIRMED |
| 文化阈值 | minCulture=${epochData.minCulture}, maxCulture=${epochData.maxCulture} | CONFIRMED |
| 入口门控 FLAG | （待取证） | （待填写） |
| timeline.json gameYearRange | （待取证） | （待填写） |
| events.json 实际年份范围 | （待取证） | （待填写） |

### 1.2 入口条件
（待取证）

### 1.3 上一纪元输出状态
（待取证）

### 1.4 内部阶段
（待取证）

### 1.5 出口条件
（待取证）

### 1.6 下一纪元输入状态
（待取证）

### 1.7 可能触发的结局
（待取证）

---

## 二、核心实体清单
（待取证）

## 三、初步因果链草图
（待取证）

## 四、核心状态读写链
（待取证）

## 五、待取证问题
（待取证）

## 六、当前未确认范围
（待取证）

---

**EPOCH_AUDIT_MODEL_${epochName} 建立完成。未输出正式缺陷结论，未修改代码。**
`;
}

function generateEvidenceSkeleton(epochName, epochInfo) {
  const { idx, codeName } = epochInfo;
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `# \`EPOCH_EVIDENCE_${epochName}\`

> 纪元：${epochName}（${codeName}, epoch=${idx}）
> 阶段：完整取证（补齐证据，未输出最终报告，未修改代码）
> 证据截止：${date}
> 模型引用：EPOCH_AUDIT_MODEL_${epochName}

---

## 一、纪元入口证据
（待取证：检查对象/设计证据/代码证据/测试证据/正常路径/异常路径/证据闭合性）

## 二、时间线与内部阶段证据
（待取证）

## 三、人物状态证据
（待取证）

## 四、事件资格与触发证据
（待取证）

## 五、数值变化证据
（待取证）

## 六、Tag/Flag 生命周期证据
（待取证）

## 七、科技条件证据
（待取证）

## 八、纪元出口证据
（待取证）

## 九、结局逻辑证据
（待取证）

## 十、存档与回溯证据
（待取证）

---

## 汇总

### 完整事件清单
（待填写）

### 人物状态轨迹
（待填写）

### 数值状态账本
（待填写）

### Tag/Flag 生命周期表
（待填写）

### 科技依赖表
（待填写）

### 入口与出口证据
（待填写）

### 结局条件与竞争关系
（待填写）

### 候选问题清单
（待填写）

### 未确认项清单
（待填写）

---

**EPOCH_EVIDENCE_${epochName} 取证完成。未修改代码，未输出修复方案。**
`;
}

function main() {
  const { epochName, phase } = parseArgs();
  const epochInfo = getEpochInfo(epochName);

  console.log('=== 纪元级因果链一致性审计 ===');
  console.log(`纪元: ${epochName} (${epochInfo.codeName}, epoch=${epochInfo.idx})`);
  console.log(`阶段: ${phase}`);
  console.log(`文化阈值: ${epochInfo.epochData.minCulture} ~ ${epochInfo.epochData.maxCulture}`);
  console.log('');

  // 1. 加载基线
  const baseline = loadBaseline();
  if (baseline) {
    console.log('[OK] 基线文档已加载: AUDIT_20260712_BASELINE.md');
  }

  // 2. 查找已完成的模型
  const existingModel = findExistingModel(epochName);
  if (existingModel) {
    console.log(`[OK] 已找到审计模型: ${existingModel.path}`);
  } else {
    console.log('[提示] 未找到已完成的审计模型，将生成骨架。');
  }

  // 3. 查找已完成的取证
  const existingEvidence = findExistingEvidence(epochName);
  if (existingEvidence) {
    console.log(`[OK] 已找到取证文档: ${existingEvidence.path}`);
  } else {
    console.log('[提示] 未找到取证文档，将生成骨架。');
  }

  console.log('');
  console.log('=== 审计任务指引 ===');
  console.log('主审需按以下十项逐一取证：');
  const tenAspects = [
    '1. 纪元入口',
    '2. 时间线与内部阶段',
    '3. 人物状态',
    '4. 事件资格与触发',
    '5. 数值变化',
    '6. Tag/Flag 生命周期',
    '7. 科技条件',
    '8. 纪元出口',
    '9. 结局逻辑',
    '10. 存档与回溯',
  ];
  tenAspects.forEach(a => console.log(`  ${a}`));
  console.log('');
  console.log('每项必须回答：');
  console.log('  - 检查对象是什么');
  console.log('  - 设计证据在哪里');
  console.log('  - 代码证据在哪里');
  console.log('  - 测试证据在哪里');
  console.log('  - 正常路径是什么');
  console.log('  - 可能的异常路径是什么');
  console.log('  - 目前证据是否闭合');
  console.log('');
  console.log('候选问题登记格式：');
  console.log('  候选问题 ID：');
  console.log('  问题现象：');
  console.log('  涉及对象：');
  console.log('  当前证据：');
  console.log('  尚缺证据：');
  console.log('  可能影响：');
  console.log('  下一步验证：');
  console.log('');

  // 4. 生成对应阶段的骨架文档
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  let skeleton = '';
  let outputPath = '';

  if (phase === 'model') {
    if (existingModel) {
      console.log(`[跳过] 模型已存在: ${existingModel.path}`);
      console.log('如需重新生成，请先删除该文件。');
      return;
    }
    skeleton = generateModelSkeleton(epochName, epochInfo, baseline);
    outputPath = resolve(DOC_DIR, `AUDIT_${date}_EPOCH_MODEL_${epochName}.md`);
  } else if (phase === 'evidence') {
    if (existingEvidence) {
      console.log(`[跳过] 取证文档已存在: ${existingEvidence.path}`);
      console.log('如需重新生成，请先删除该文件。');
      return;
    }
    skeleton = generateEvidenceSkeleton(epochName, epochInfo);
    outputPath = resolve(DOC_DIR, `AUDIT_${date}_EPOCH_EVIDENCE_${epochName}.md`);
  } else if (phase === 'final') {
    console.log('[提示] final 阶段需主审人工编写最终报告，脚本不生成骨架。');
    return;
  } else {
    console.error(`[错误] 未知阶段: ${phase}（支持: model/evidence/final）`);
    process.exit(1);
  }

  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, skeleton, 'utf-8');
  console.log(`[OK] 骨架文档已生成: ${outputPath}`);
  console.log('');
  console.log('下一步：主审结合子代理取证结果填写文档内容。');
}

main();
