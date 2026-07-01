# 宇宙群英传 完整代码架构重构方案

> **文档编号**: SPEC_20260612_COMPREHENSIVE_ARCHITECTURE_REFACTORING
> **制定日期**: 2026-06-12
> **分类前缀**: `SPEC_` (规格说明与架构蓝图)
> **基于基线**: 267 测试全量通过 | 分支覆盖率 > 60% | 阶段 A/B/C 已完成
> **目标**: 整合 UEE 叙事引擎、补全测试体系、完善架构分层、保障桌面端分发

---

## 目录

- [第一章：现状评估与重构目标](#第一章现状评估与重构目标)
- [第二章：目标架构总览](#第二章目标架构总览)
- [第三章：UEE 叙事引擎层重构](#第三章uee-叙事引擎层重构)
- [第四章：核心系统层重构](#第四章核心系统层重构)
- [第五章：UI/表现层重构](#第五章ui表现层重构)
- [第六章：数据与配置层重构](#第六章数据与配置层重构)
- [第七章：测试体系完整重构](#第七章测试体系完整重构)
- [第八章：桌面端分发架构](#第八章桌面端分发架构)
- [第九章：开发阶段与里程碑](#第九章开发阶段与里程碑)
- [第十章：AI 协作约束与红线](#第十章ai-协作约束与红线)

---

## 第一章：现状评估与重构目标

### 1.1 当前架构概述

```
src/
├── core/           # 核心游戏逻辑层 (22 个文件)
│   ├── Game.ts              — 游戏主循环、回合推进、存档/读档
│   ├── EarthCivilization.ts — 地球文明（资源、部门、面壁者、执剑人）
│   ├── AlienCivilization.ts — 外星文明（AI 行为树）
│   ├── GameEventManager.ts  — 事件管理器（固定 + 随机 + 条件）
│   ├── EventCadence.ts      — 事件触发节奏控制
│   ├── CombatEngine.ts      — 战斗引擎
│   ├── DigitalLife.ts       — 数字生命系统
│   ├── PlanetEngine.ts      — 行星发动机系统
│   ├── PersonManager.ts     — 人物管理
│   ├── TecTreeManager.ts    — 科技树管理
│   ├── StarManager.ts       — 星系管理
│   ├── StarGenerator.ts     — 星系生成器
│   ├── WeaponManager.ts     — 武器管理
│   ├── AlienCiviManager.ts  — 外星文明管理
│   └── ... (Fleet, Building, Barback, etc.)
├── types/          # 类型定义 (enums.ts, narrative.ts)
├── components/     # React 组件层 (17 个文件)
│   ├── App.tsx, TopHUD, LeftHub, RightInspector
│   ├── StarMap, BattleScreen, DiplomacyPanel
│   ├── StoryModal, FleetModal, EndGameScreen
│   ├── ending/ (4 个结局组件)
│   └── common/ (ErrorBoundary)
├── ui/             # UI 辅助层 (6 个文件)
│   ├── StarMapRenderer, UIManager, MainLayout
│   └── WallfacerPanel, DepartmentPanel, TecTreeView, etc.
├── data/           # 数据层 (10 个 JSON)
│   ├── events.json, randomevents.json, persons.json
│   ├── wallfacers.json, epochs.json, diplomacy.json
│   └── stars.json, aliens.json, weapons.json, timeline.json
├── config/         # 配置层 (endingConfig.ts, starIndices.ts)
├── test/           # 测试层 (14 个文件, 267 测试)
├── utils/          # 工具层 (assetUrl.ts, random.ts)
└── styles/         # 样式 (index.css)
```

### 1.2 已完成的修复（截至 2026-06-12）

| 领域 | 完成项 | 验证 |
|------|--------|------|
| 事件系统 | 删除 cooldownYears、废弃 WANDERING、修正人物纪元 | ✅ 267 tests |
| 存档/读档 | 触发器持久化、哈希校验、ticker 恢复 | ✅ SaveLoad.test.ts |
| 核心子系统 | 数字生命、行星发动机、外交面板 | ✅ Subsystems.test.ts |
| 配置外部化 | wallfacers.json, epochs.json, diplomacy.json | ✅ 文件存在 |
| 战斗系统 | BattleScreen + 武器类型 + 回合可视化 | ✅ CombatEngine.test.ts |
| 纪元驱动 | 文化值驱动纪元切换 | ✅ Game.test.ts |
| 迭代 A/B/C | 执剑人交接、存档哈希、粒子动效、音效总线 | ✅ 267 tests |
| 星图 | 外太空 83 颗星自动生成 | ✅ StarGenerator |
| 事件时间线 | 6 个新增里程碑 + 时序匹配 | ✅ GameEventManager.test.ts |

### 1.3 待完成的核心工作

| 优先级 | 工作项 | 来源文档 |
|--------|--------|---------|
| P0 | UEE 通用事件引擎 v1.0 集成 | SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1 |
| P0 | Tag 系统 + TagManager | 同上 |
| P0 | 生态链/涟漪效应系统 | 同上 |
| P0 | 动态编年史/历史生成系统 | 同上 |
| P0 | 氛围/反向滤镜系统 | 同上 |
| P1 | 测试体系扩展（覆盖率 60% → 80%） | 本文档 |
| P1 | 架构分层解耦（依赖注入容器） | 本文档 |
| P2 | 阶段 D：Tauri 桌面端打包 | SPEC_20260603_REVISED_ITERATION_PLAN |
| P2 | Steamworks SDK 桥接 | 同上 |
| P2 | 切片叙事内容扩充 | SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1 |

### 1.4 重构目标

```
当前状态 ──────────────────────────────────> 目标状态
267 tests, 60% coverage           →   400+ tests, 80% coverage
线性事件系统                        →   UEE 八层事件引擎
无 Tag/记忆系统                     →   TagManager + 世界记忆
硬编码氛围/滤镜                      →   Atmosphere 状态机
静态 timeline.json                  →   动态编年史生成
纯 Web 应用                          →   Tauri 桌面端 + Steam 分发
Game 单例重度耦合                    →   依赖注入 + 模块解耦
```

---

## 第二章：目标架构总览

### 2.1 分层架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    表现层 (Presentation Layer)               │
│  React Components | Canvas Renderer | Framer Motion | Audio │
├─────────────────────────────────────────────────────────────┤
│                    叙事引擎层 (Narrative Engine Layer)        │
│  UEE Layer 6-8: Atmosphere | Slice Narrative | History Gen  │
├─────────────────────────────────────────────────────────────┤
│                    事件系统层 (Event System Layer)            │
│  UEE Layer 3-5: Event Gen | Relations | Ecology Chain       │
├─────────────────────────────────────────────────────────────┤
│                    世界状态层 (World State Layer)             │
│  UEE Layer 1-2: State | Tag/Memory | TagManager             │
├─────────────────────────────────────────────────────────────┤
│                    核心模拟层 (Core Simulation Layer)         │
│  Game | EarthCivi | AlienCivi | Combat | Tech | Economy     │
├─────────────────────────────────────────────────────────────┤
│                    数据与配置层 (Data & Config Layer)         │
│  JSON Configs | Save/Load | Hash Validation | Schema        │
├─────────────────────────────────────────────────────────────┤
│                    基础设施层 (Infrastructure Layer)          │
│  DI Container | EventBus | RNG | Logger | Asset Pipeline    │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 新增模块清单

| 模块名 | 层归属 | 文件路径 | 说明 |
|--------|--------|---------|------|
| `TagManager` | 世界状态层 | `src/core/TagManager.ts` | 管理 worldTags、characterTags、regionTags、orgTags |
| `AtmosphereEngine` | 表现层 | `src/core/AtmosphereEngine.ts` | 氛围状态机，驱动 UI 滤镜/色调/噪音 |
| `EcologyChain` | 事件系统层 | `src/core/EcologyChain.ts` | 生态链涟漪效应，多级事件链式传导 |
| `RelationNetwork` | 事件系统层 | `src/core/RelationNetwork.ts` | 角色关系网络（盟友/宿敌/背叛） |
| `HistoryGenerator` | 叙事引擎层 | `src/core/HistoryGenerator.ts` | 动态编年史生成，自动写入 timeline |
| `SliceNarrativeEngine` | 叙事引擎层 | `src/core/SliceNarrativeEngine.ts` | 切片叙事，将宏观事件具象化 |
| `DIContainer` | 基础设施层 | `src/core/DIContainer.ts` | 依赖注入容器，替代 Game 单例耦合 |
| `EventBus` | 基础设施层 | `src/core/EventBus.ts` | 全局事件总线，解耦模块间通信 |
| `SaveManager` | 数据层 | `src/core/SaveManager.ts` | 独立存档管理器（从 Game.ts 剥离） |
| `AudioManager` | 表现层 | `src/core/AudioManager.ts` | 独立音频管理器（从 BgmPlayer 剥离） |

### 2.3 模块依赖关系

```
DIContainer (基础设施)
  ├── Game (核心模拟)
  │     ├── EarthCivilization
  │     │     ├── PersonManager
  │     │     ├── TecTreeManager
  │     │     ├── DigitalLife
  │     │     └── PlanetEngine
  │     ├── AlienCiviManager
  │     │     └── AlienCivilization (×N)
  │     ├── StarManager
  │     ├── CombatEngine
  │     └── WeaponManager
  ├── GameEventManager (事件系统)
  │     ├── EventCadence
  │     ├── TagManager (NEW)
  │     ├── EcologyChain (NEW)
  │     └── RelationNetwork (NEW)
  ├── AtmosphereEngine (NEW, 表现层)
  ├── HistoryGenerator (NEW, 叙事引擎)
  │     └── SliceNarrativeEngine (NEW)
  ├── SaveManager (NEW, 从 Game 剥离)
  ├── AudioManager (NEW, 从 BgmPlayer 剥离)
  └── EventBus (NEW, 全局通信)
```

---

## 第三章：UEE 叙事引擎层重构

### 3.1 概述

基于 [SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1.md) 的设计，将当前线性事件系统重构为八层 UEE 架构。核心哲学：**状态产生行为，行为产生事件，事件留下历史，历史改变状态。**

### 3.2 Layer 1-2: 世界状态层 + Tag 记忆系统

#### TagManager 设计

```typescript
// 文件：src/core/TagManager.ts

export interface WorldTag {
  id: string;
  name: string;           // e.g. "资源枯竭边缘", "科技爆发期"
  intensity: number;       // 0-100, 标签强度
  firstAppliedYear: number;
  lastReinforcedYear: number;
  source: string;          // 触发来源：事件ID或系统名称
}

export interface CharacterTag {
  personName: string;
  tagId: string;           // e.g. "逃亡派", "人类叛徒", "为人类做贡献"
  value: number;           // 0-100
  appliedYear: number;
}

export class TagManager {
  public worldTags: Map<string, WorldTag> = new Map();
  public characterTags: Map<string, CharacterTag[]> = new Map();
  public regionTags: Map<string, WorldTag[]> = new Map();
  public orgTags: Map<string, WorldTag[]> = new Map();

  // 应用标签，自动合并相同标签（增强强度）
  applyWorldTag(tag: Omit<WorldTag, 'firstAppliedYear' | 'lastReinforcedYear'>, year: number): void;
  
  // 衰减标签（随时间弱化）
  decayTags(currentYear: number): void;
  
  // 查询标签是否存在及强度
  hasTag(tagId: string, minIntensity?: number): boolean;
  getTagIntensity(tagId: string): number;
  
  // 角色标签（聚焦于"角色与人类社会的宏观关系"）
  applyCharacterTag(personName: string, tag: CharacterTag): void;
  getCharacterStance(personName: string): string; // 返回角色立场
  
  // 序列化支持
  toJSON(): object;
  static fromJSON(data: object): TagManager;
}
```

**Tag 分类体系**（遵循三体原著精神）：

| 类别 | 示例 Tag | 触发条件 |
|------|---------|---------|
| 世界状态 | `资源枯竭` `科技爆发` `人口危机` `威慑稳固` | 数值阈值触发 |
| 社会状态 | `民心不稳` `逃亡主义蔓延` `ETO 残余` `新降临派` | 事件链沉淀 |
| 军事状态 | `太空军建成` `水滴威慑` `二向箔预警` | 里程碑事件 |
| 角色立场 | `为人类做贡献` `脱离社会` `逃亡派` `人类叛徒` | 角色行为/事件 |

**约束**：
- **E2 扩展**：角色标签不建立"好感度矩阵"，仅标记"角色与人类社会的宏观关系"
- **E4 扩展**：Tag 的生成必须有明确的状态来源，禁止凭空添加

### 3.3 Layer 3-5: 事件生成层 + 关系网络 + 生态链

#### 事件生成公式重构

```typescript
// 文件：src/core/EventCadence.ts — 扩展 scoreEvent()

// 旧公式：laneWeight * eventWeight * severity
// 新公式：StateWeight + TagWeight + RelationWeight + TimeWeight

export function scoreEventUEE(
  event: GameEvent,
  game: Game,
  tagManager: TagManager,
  relationNetwork: RelationNetwork
): number {
  let score = 0;
  const meta = event.cadenceMeta;
  if (!meta) return 1;

  // 1. 状态权重 (StateWeight) — 数值越极端，权重越高
  const e = game.earthCivi;
  if (meta.reqStateMin) {
    for (const [key, threshold] of Object.entries(meta.reqStateMin)) {
      const current = (e as any)[key] || 0;
      score += Math.max(0, (current - threshold) / threshold) * 10;
    }
  }
  if (meta.reqStateMax) {
    for (const [key, threshold] of Object.entries(meta.reqStateMax)) {
      const current = (e as any)[key] || 0;
      score += Math.max(0, (threshold - current) / threshold) * 10;
    }
  }

  // 2. Tag 权重 (TagWeight) — 匹配的标签越多，权重越高
  if (meta.reqTags) {
    for (const tagId of meta.reqTags) {
      const intensity = tagManager.getTagIntensity(tagId);
      score += intensity * 0.5;
    }
  }

  // 3. 关系权重 (RelationWeight)
  if (meta.reqRelation) {
    score += relationNetwork.getRelationScore(meta.reqRelation) * 5;
  }

  // 4. 时间权重 (TimeWeight) — 越久未触发，权重越高
  const lastTriggered = game.eventManager.randomEventTriggerCounts.get(event.id || event.name) || 0;
  if (lastTriggered === 0) {
    score += 20; // 从未触发过的事件优先
  }

  return score;
}
```

#### EcologyChain 生态链系统

```typescript
// 文件：src/core/EcologyChain.ts

export interface ChainStep {
  id: string;
  name: string;
  conditionEventId: string;    // 前序事件ID
  triggerDelay: number;         // 延迟回合数
  resultEventId: string;        // 结果事件ID
  producedTags: string[];       // 产生的 Tag
  probability: number;          // 触发概率
}

export class EcologyChain {
  public chains: ChainStep[] = [];

  constructor() {
    this.initChains();
  }

  private initChains(): void {
    // 示例：配给减少 → 民心不稳 → 地下骚乱 → 核心危机
    this.chains = [
      {
        id: 'ration_to_riot',
        name: '配给减少引发的社会动荡链',
        conditionEventId: 'random_resource_rationing',
        triggerDelay: 3,
        resultEventId: 'random_underground_riot',
        producedTags: ['民心不稳', '地下帮派'],
        probability: 0.6
      },
      {
        id: 'riot_to_crisis',
        name: '地下骚乱升级为殖民危机',
        conditionEventId: 'random_underground_riot',
        triggerDelay: 5,
        resultEventId: 'random_colony_crisis',
        producedTags: ['社会分裂'],
        probability: 0.4
      },
      // ... 更多链式事件
    ];
  }

  // 检查是否有链式反应应该触发
  checkChainReactions(
    recentlyTriggeredEventId: string,
    tagManager: TagManager,
    currentYear: number
  ): ChainStep[] {
    return this.chains.filter(chain => {
      if (chain.conditionEventId !== recentlyTriggeredEventId) return false;
      return Math.random() < chain.probability;
    });
  }
}
```

#### RelationNetwork 关系网络

```typescript
// 文件：src/core/RelationNetwork.ts

export interface CharacterRelation {
  personA: string;
  personB: string;
  relationType: 'ALLY' | 'RIVAL' | 'BETRAYER' | 'MENTOR' | 'NEUTRAL';
  establishedYear: number;
  intensity: number; // 0-100
}

export class RelationNetwork {
  public relations: CharacterRelation[] = [];

  // 建立关系
  establishRelation(relation: CharacterRelation): void;
  
  // 事件影响关系
  modifyRelationByEvent(personA: string, personB: string, delta: number): void;
  
  // 查询两角色关系
  getRelation(personA: string, personB: string): CharacterRelation | null;
  
  // 获取某角色的所有关系
  getPersonRelations(personName: string): CharacterRelation[];
  
  // 计算关系评分（用于事件权重）
  getRelationScore(query: { personA: string, type: string }): number;
}
```

**约束**：
- **E2 扩展**：关系网络严格遵循原著，聚焦"角色与人类社会的宏观关系"，不盲目扩张"好感度矩阵"
- 角色存在的核心目的是服务于文明存续的宏大命题

### 3.4 Layer 6: 表现层 — Atmosphere 氛围引擎

```typescript
// 文件：src/core/AtmosphereEngine.ts

export type AtmosphereState = 
  | 'NORMAL'       // 正常
  | 'TENSE'        // 紧张（危机累积）
  | 'CRITICAL'     // 危急（资源濒临崩溃）
  | 'DARK'         // 黑暗（威慑失效/二向箔逼近）
  | 'HOPEFUL'      // 希望（科技突破/新星系抵达）
  | 'TRANSCENDENT'; // 超越（数字永生/银河纪元）

export interface AtmosphereConfig {
  state: AtmosphereState;
  backgroundColor: string;    // 全局背景色调
  uiTint: string;             // UI 面板色调
  noiseLevel: number;         // 背景噪点强度 (0-1)
  scanlineOpacity: number;    // 扫描线透明度
  vignetteIntensity: number;  // 暗角强度
  transitionMs: number;       // 过渡动画时长
}

export class AtmosphereEngine {
  public currentState: AtmosphereState = 'NORMAL';
  private configMap: Record<AtmosphereState, AtmosphereConfig>;

  constructor() {
    this.configMap = {
      NORMAL: {
        state: 'NORMAL',
        backgroundColor: '#0a0a1a',
        uiTint: 'rgba(0, 229, 255, 0.05)',
        noiseLevel: 0.02,
        scanlineOpacity: 0.03,
        vignetteIntensity: 0.1,
        transitionMs: 2000
      },
      TENSE: {
        state: 'TENSE',
        backgroundColor: '#1a0a0a',
        uiTint: 'rgba(255, 87, 34, 0.08)',
        noiseLevel: 0.05,
        scanlineOpacity: 0.05,
        vignetteIntensity: 0.2,
        transitionMs: 1500
      },
      CRITICAL: {
        state: 'CRITICAL',
        backgroundColor: '#1a0000',
        uiTint: 'rgba(255, 0, 0, 0.12)',
        noiseLevel: 0.1,
        scanlineOpacity: 0.08,
        vignetteIntensity: 0.35,
        transitionMs: 1000
      },
      DARK: {
        state: 'DARK',
        backgroundColor: '#000010',
        uiTint: 'rgba(0, 0, 0, 0.5)',
        noiseLevel: 0.15,
        scanlineOpacity: 0.12,
        vignetteIntensity: 0.5,
        transitionMs: 3000
      },
      HOPEFUL: {
        state: 'HOPEFUL',
        backgroundColor: '#0a1a2a',
        uiTint: 'rgba(0, 200, 255, 0.1)',
        noiseLevel: 0.01,
        scanlineOpacity: 0.02,
        vignetteIntensity: 0.05,
        transitionMs: 2000
      },
      TRANSCENDENT: {
        state: 'TRANSCENDENT',
        backgroundColor: '#0a0a2a',
        uiTint: 'rgba(100, 0, 255, 0.15)',
        noiseLevel: 0.03,
        scanlineOpacity: 0.04,
        vignetteIntensity: 0.15,
        transitionMs: 4000
      }
    };
  }

  // 根据世界状态自动判定氛围
  evaluateState(tagManager: TagManager, earthCivi: any): AtmosphereState {
    const tags = tagManager.worldTags;
    const e = earthCivi;

    if (tags.has('数字天国') && tags.get('数字天国')!.intensity > 80) return 'TRANSCENDENT';
    if (tags.has('二向箔逼近') && tags.get('二向箔逼近')!.intensity > 50) return 'DARK';
    if (e.population < 10 || e.economy < 20) return 'CRITICAL';
    if (tags.has('民心不稳') || e.treachery > 50) return 'TENSE';
    if (tags.has('科技突破') || tags.has('新星系抵达')) return 'HOPEFUL';
    return 'NORMAL';
  }

  getConfig(): AtmosphereConfig {
    return this.configMap[this.currentState];
  }
}
```

### 3.5 Layer 7-8: 切片叙事 + 历史生成

#### SliceNarrativeEngine

```typescript
// 文件：src/core/SliceNarrativeEngine.ts

export interface SliceNarrative {
  eventId: string;           // 关联的宏观事件
  characterName: string;     // 小人物姓名
  characterRole: string;     // 社会角色
  scene: string;             // 场景描述
  innerMonologue: string;    // 内心独白
  impact: string;            // 对小人物的影响
}

export class SliceNarrativeEngine {
  private slices: Map<string, SliceNarrative[]> = new Map();

  // 注册切片叙事
  registerSlice(eventId: string, slice: SliceNarrative): void;

  // 获取事件的切片叙事
  getSlices(eventId: string): SliceNarrative[];

  // 自动生成切片叙事（基于 Tag 和随机模板）
  generateSlice(eventId: string, tagManager: TagManager): SliceNarrative;
}
```

#### HistoryGenerator 动态编年史

```typescript
// 文件：src/core/HistoryGenerator.ts

export interface TimelineEntry {
  year: number;
  epochName: string;
  entryType: 'MILESTONE' | 'EVENT' | 'TAG_APPLIED' | 'TAG_REMOVED' | 'CRISIS' | 'VICTORY';
  title: string;
  description: string;
  relatedTags: string[];
  relatedPersons: string[];
}

export class HistoryGenerator {
  public entries: TimelineEntry[] = [];

  // 记录里程碑事件
  recordMilestone(year: number, epochName: string, title: string, description: string): void;

  // 记录 Tag 变化
  recordTagChange(year: number, epochName: string, tagId: string, applied: boolean): void;

  // 记录危机
  recordCrisis(year: number, epochName: string, title: string, description: string): void;

  // 生成编年史文本
  generateChronicle(): string;

  // 导出为 timeline.json 兼容格式
  exportToTimeline(): object;

  // 序列化
  toJSON(): object;
  static fromJSON(data: object): HistoryGenerator;
}
```

**约束**：
- **E6 扩展**：`HistoryGenerator.entries` 必须在存档中持久化
- 时间线即编年史，不再单独开辟独立"历史面板"，融合到现有 `timeline.json` 骨架

---

## 第四章：核心系统层重构

### 4.1 依赖注入容器 (DIContainer)

**问题**：当前 `Game` 类通过 `GameInstance` 单例全局访问，导致所有模块强耦合到 `Game`，难以单元测试、难以替换、难以并行开发。

**方案**：引入轻量级依赖注入容器。

```typescript
// 文件：src/core/DIContainer.ts

export class DIContainer {
  private services: Map<string, any> = new Map();
  private factories: Map<string, () => any> = new Map();

  register<T>(key: string, instance: T): void {
    this.services.set(key, instance);
  }

  registerFactory<T>(key: string, factory: () => T): void {
    this.factories.set(key, factory);
  }

  resolve<T>(key: string): T {
    if (this.services.has(key)) return this.services.get(key);
    if (this.factories.has(key)) {
      const instance = this.factories.get(key)!();
      this.services.set(key, instance);
      return instance;
    }
    throw new Error(`Service "${key}" not registered in DI container.`);
  }
}

// 全局实例（渐进迁移用）
export const AppContainer = new DIContainer();
```

**迁移路径**：
1. 阶段一：在 `AppContainer` 中注册所有核心服务
2. 阶段二：`Game` 通过 `AppContainer` 获取依赖而非直接 `new`
3. 阶段三：所有组件通过 `AppContainer.resolve()` 获取服务，不再依赖 `GameInstance.get()`

### 4.2 EventBus 全局事件总线

```typescript
// 文件：src/core/EventBus.ts

export type EventHandler = (...args: any[]) => void;

export class EventBus {
  private handlers: Map<string, Set<EventHandler>> = new Map();

  on(event: string, handler: EventHandler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, new Set());
    this.handlers.get(event)!.add(handler);
  }

  off(event: string, handler: EventHandler): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, ...args: any[]): void {
    this.handlers.get(event)?.forEach(handler => handler(...args));
  }

  // 用于 React 组件监听
  emitToWindow(event: string, detail?: any): void {
    window.dispatchEvent(new CustomEvent(event, { detail }));
    this.emit(event, detail);
  }
}

// 标准化事件名称
export const GameEvents = {
  TURN_START: 'game:turn:start',
  TURN_COMPLETE: 'game:turn:complete',
  EPOCH_CHANGED: 'game:epoch:changed',
  EVENT_TRIGGERED: 'game:event:triggered',
  TAG_APPLIED: 'game:tag:applied',
  TAG_REMOVED: 'game:tag:removed',
  ATMOSPHERE_CHANGED: 'game:atmosphere:changed',
  BATTLE_START: 'game:battle:start',
  BATTLE_END: 'game:battle:end',
  PERSON_UNLOCKED: 'game:person:unlocked',
  SAVE_COMPLETED: 'game:save:completed',
  LOAD_COMPLETED: 'game:load:completed',
  GAME_OVER: 'game:over',
  AUDIO_PLAY: 'audio:play',
  AUDIO_STOP: 'audio:stop',
} as const;
```

### 4.3 SaveManager 独立存档管理器

**问题**：`Game.ts` 中的 `saveGame`/`loadGame` 静态方法耦合了序列化逻辑与游戏状态管理。

**方案**：独立的 `SaveManager` 类。

```typescript
// 文件：src/core/SaveManager.ts

export class SaveDataCorruptedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SaveDataCorruptedError';
  }
}

export class SaveManager {
  private static readonly STORAGE_KEY = 'Beyond-the-Light-Cone_Save';
  private static readonly SAVE_VERSION = 3;

  static save(game: any): void {
    const data = JSON.stringify(game, Game.replacer);
    const hash = SaveManager.computeHash(data);
    const savePackage = {
      version: SaveManager.SAVE_VERSION,
      timestamp: Date.now(),
      hash,
      data: JSON.parse(data)
    };
    localStorage.setItem(SaveManager.STORAGE_KEY, JSON.stringify(savePackage));
  }

  static load(): any {
    const raw = localStorage.getItem(SaveManager.STORAGE_KEY);
    if (!raw) return null;

    try {
      const savePackage = JSON.parse(raw);
      if (savePackage.version !== SaveManager.SAVE_VERSION) {
        throw new SaveDataCorruptedError('存档版本不兼容');
      }

      const dataStr = JSON.stringify(savePackage.data);
      const computedHash = SaveManager.computeHash(dataStr);
      if (computedHash !== savePackage.hash) {
        throw new SaveDataCorruptedError('存档哈希校验失败，数据可能已被篡改');
      }

      return savePackage.data;
    } catch (e) {
      if (e instanceof SaveDataCorruptedError) throw e;
      throw new SaveDataCorruptedError('存档解析失败');
    }
  }

  private static computeHash(str: string): number {
    // DJB2 哈希算法
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash >>> 0;
  }

  static deleteSave(): void {
    localStorage.removeItem(SaveManager.STORAGE_KEY);
  }
}
```

### 4.4 模块间通信重构

**迁移策略**：渐进式重构，保持向后兼容。

```
当前（紧耦合）：                     目标（松耦合）：
┌──────┐                            ┌──────────┐
│ Game │ ←── 所有模块直接引用        │ DIContainer │
└──────┘                            └──────────┘
    │                               /    |    \
    ├── EarthCivilization           Game  EventBus  SaveManager
    ├── AlienCivilization                 /    |    \
    ├── GameEventManager           Earth  Alien  Events
    ├── PersonManager
    └── ...所有其他模块
```

---

## 第五章：UI/表现层重构

### 5.1 AtmosphereProvider 全局氛围组件

```typescript
// 文件：src/components/AtmosphereProvider.tsx

import React, { createContext, useContext, useEffect, useState } from 'react';
import { AtmosphereEngine, AtmosphereConfig } from '../core/AtmosphereEngine';

const AtmosphereContext = createContext<AtmosphereConfig | null>(null);

export const AtmosphereProvider: React.FC<{ engine: AtmosphereEngine; children: React.ReactNode }> = ({ engine, children }) => {
  const [config, setConfig] = useState<AtmosphereConfig>(engine.getConfig());

  useEffect(() => {
    const handler = () => setConfig(engine.getConfig());
    window.addEventListener('game:atmosphere:changed', handler);
    return () => window.removeEventListener('game:atmosphere:changed', handler);
  }, [engine]);

  return (
    <AtmosphereContext.Provider value={config}>
      <div style={{
        transition: `all ${config.transitionMs}ms ease-in-out`,
        boxShadow: `inset 0 0 ${config.vignetteIntensity * 100}px rgba(0,0,0,${config.vignetteIntensity})`,
      }}>
        {children}
      </div>
    </AtmosphereContext.Provider>
  );
};

export const useAtmosphere = () => useContext(AtmosphereContext);
```

### 5.2 组件树变更

```diff
 App.tsx
+  <AtmosphereProvider engine={atmosphereEngine}>
+    <ErrorBoundary>
       <TopHUD />
       <LeftHub />
       <StarMap />
       <RightInspector />
       <BattleScreen />
       <DiplomacyPanel />
       <StoryModal />
       <FleetModal />
       <EndGameScreen />
       <AnnouncementBoard />
       <BgmPlayer />
+      <AtmosphereOverlay />  {/* 全局噪点/扫描线效果 */}
+    </ErrorBoundary>
+  </AtmosphereProvider>
```

### 5.3 TimelineComparisonPanel 升级

将现有的 `TimelineComparisonPanel.tsx` 与 `HistoryGenerator` 集成，实现动态编年史展示：

- 左列：原著时间线（静态 `timeline.json`）
- 右列：玩家时间线（动态生成的 `HistoryGenerator.entries`）
- 差异高亮：玩家偏离原著路径时标注

---

## 第六章：数据与配置层重构

### 6.1 数据文件完整性

| 文件 | 当前状态 | 重构目标 |
|------|---------|---------|
| `events.json` | ✅ 9 个里程碑事件 | 扩展到 15+ 个（含新增 UEE 触发条件） |
| `randomevents.json` | ✅ 148 个事件 | 添加 `reqTags`、`reqState`、`ecologicalChain` 字段 |
| `persons.json` | ✅ 30+ 角色 | 添加 `deathEpoch`、`canonicalStance` 字段 |
| `wallfacers.json` | ✅ 已存在 | 添加 `defectionThreshold` |
| `epochs.json` | ✅ 已存在 | 添加 `atmosphereState` 默认值 |
| `diplomacy.json` | ✅ 已存在 | 添加 `relationImpactOnTags` 映射 |
| `stars.json` | ✅ 83 颗星 | 添加 `starType`、`habitability` 字段 |
| `timeline.json` | ✅ 存在 | 升级为动态编年史骨架 |
| `ecologyChains.json` | 🆕 新增 | 生态链配置 |
| `atmosphere.json` | 🆕 新增 | 氛围配置映射 |

### 6.2 数据 Schema 验证

```typescript
// 文件：src/test/data/DataSchema.test.ts — 扩展

// 新增验证项：
// 1. 所有事件的 reqTags 引用的 tag 在 TagManager 中已注册
// 2. 所有 ecologyChains 的 conditionEventId 和 resultEventId 存在
// 3. 所有事件的 epoch 标签在 epochs.json 中定义
// 4. 所有 persons 的 faceFile 指向存在的图片文件
// 5. 所有事件的 speakerName 在 persons.json 或 NPC 分类中存在
```

---

## 第七章：测试体系完整重构

### 7.1 当前测试状况

```
当前：14 个测试文件 | 267 个测试 | 分支覆盖率 > 60%
目标：22+ 个测试文件 | 400+ 个测试 | 分支覆盖率 > 80%
```

### 7.2 测试分层架构

```
┌─────────────────────────────────────────────┐
│  E2E 测试 (Headless Autoplay)               │
│  全自动挂机 500 回合回归测试                  │
├─────────────────────────────────────────────┤
│  集成测试 (Integration Tests)                │
│  模块间交互：存档往返、事件链、战斗流程        │
├─────────────────────────────────────────────┤
│  单元测试 (Unit Tests)                       │
│  每个类/方法的独立测试                       │
├─────────────────────────────────────────────┤
│  数据 Schema 测试 (Data Validation)           │
│  JSON 文件完整性、引用一致性、量纲校验          │
├─────────────────────────────────────────────┤
│  快照测试 (Snapshot Tests)                   │
│  关键 UI 组件的渲染快照                       │
└─────────────────────────────────────────────┘
```

### 7.3 新增测试文件清单

| 文件 | 覆盖模块 | 预估测试数 | 优先级 |
|------|---------|-----------|--------|
| `test/core/TagManager.test.ts` | TagManager | 25+ | P0 |
| `test/core/AtmosphereEngine.test.ts` | AtmosphereEngine | 15+ | P0 |
| `test/core/EcologyChain.test.ts` | EcologyChain | 20+ | P0 |
| `test/core/HistoryGenerator.test.ts` | HistoryGenerator | 15+ | P0 |
| `test/core/RelationNetwork.test.ts` | RelationNetwork | 15+ | P0 |
| `test/core/SliceNarrativeEngine.test.ts` | SliceNarrativeEngine | 10+ | P1 |
| `test/core/EventBus.test.ts` | EventBus | 15+ | P0 |
| `test/core/DIContainer.test.ts` | DIContainer | 10+ | P0 |
| `test/core/SaveManager.test.ts` | SaveManager | 12+ | P0 |
| `test/core/AudioManager.test.ts` | AudioManager | 8+ | P1 |
| `test/integration/UEE_FullFlow.test.ts` | UEE 全流程集成 | 20+ | P0 |
| `test/integration/EventChain.test.ts` | 事件链集成 | 15+ | P1 |
| `test/components/AtmosphereProvider.test.tsx` | 氛围组件 | 8+ | P1 |
| `test/components/BattleScreen.test.tsx` | 战斗界面 | 10+ | P1 |
| `test/components/DiplomacyPanel.test.tsx` | 外交面板 | 10+ | P1 |
| `test/e2e/Autoplay500.test.ts` | 500 回合挂机 | 5+ | P2 |
| **总计（新增）** | | **~213+** | |

### 7.4 测试用例设计规范

#### 7.4.1 TagManager 测试

```typescript
describe('TagManager', () => {
  describe('applyWorldTag', () => {
    it('应用新标签');
    it('相同标签自动合并强度');
    it('标签强度上限 100');
    it('标签强度下限 0');
  });
  describe('decayTags', () => {
    it('标签随时间衰减');
    it('强度低于阈值自动移除');
    it('里程碑标签不衰减');
  });
  describe('hasTag', () => {
    it('存在且强度足够的标签返回 true');
    it('强度不足返回 false');
    it('不存在的标签返回 false');
  });
  describe('序列化', () => {
    it('toJSON / fromJSON 往返一致');
    it('存档/读档后标签完整恢复');
  });
});
```

#### 7.4.2 UEE 全流程集成测试

```typescript
describe('UEE Full Flow Integration', () => {
  it('资源枯竭 → Tag 产生 → 事件权重提升 → 涟漪事件触发 → 历史记录');
  it('面壁者叛变 → 角色 Tag 标记 → 关系网络变更 → 后续事件受影响');
  it('氛围状态随世界状态自动切换');
  it('生态链：配给减少 → 3 回合后 → 地下骚乱 → 5 回合后 → 殖民危机');
  it('编年史自动记录所有里程碑、Tag 变化、危机');
});
```

#### 7.4.3 快照测试

```typescript
describe('BattleScreen Snapshot', () => {
  it('攻击方受损时卡片震颤 + 红色闪烁');
  it('防御方获胜时显示胜利动画');
  it('水滴攻击呈现特殊视觉效果');
});
```

### 7.5 覆盖率目标

| 模块 | 当前覆盖率 | 目标覆盖率 |
|------|-----------|-----------|
| `core/` 核心逻辑 | ~65% | **85%** |
| `core/TagManager` (NEW) | 0% | **90%** |
| `core/AtmosphereEngine` (NEW) | 0% | **85%** |
| `core/EcologyChain` (NEW) | 0% | **85%** |
| `core/HistoryGenerator` (NEW) | 0% | **80%** |
| `components/` | ~30% | **60%** |
| `data/` Schema 验证 | ~50% | **90%** |
| **总体** | **~62%** | **~80%** |

### 7.6 CI/CD 流水线

```yaml
# .github/workflows/test.yml (更新)
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run typecheck        # 红线 1: TypeScript 编译
      - run: npx vitest run --coverage # 红线 2: 全量测试 + 覆盖率
      - run: npm run build            # 红线 3: 生产构建
      - run: npm run lint             # 红线 4: ESLint 静态分析
      - name: Coverage Gate
        run: |
          COVERAGE=$(node -e "const r=require('./coverage/coverage-summary.json');console.log(r.total.branches.pct)")
          if (( $(echo "$COVERAGE < 75" | bc -l) )); then
            echo "Branch coverage $COVERAGE% is below 75% threshold"
            exit 1
          fi
```

---

## 第八章：桌面端分发架构

### 8.1 Tauri 集成方案

基于 [AUDIT_20260603_GODOT_MIGRATION_FEASIBILITY.md](file:///Users/quantumrose/Documents/Emberois/LengendOfUni-rebuild/02_Project_Documentation/AUDIT_20260603_GODOT_MIGRATION_FEASIBILITY.md) 的结论：**继续 Web 重构版 + Tauri 桌面壳**是最优技术路线。

```
项目根目录
├── 03_Web_Rebuild/          # 现有 Web 重构版
│   └── dist/                # Vite 构建产物
├── src-tauri/               # 🆕 Tauri Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs          # Rust 入口
│   │   ├── steamworks.rs    # Steam SDK 桥接
│   │   └── commands.rs      # Rust → JS 命令
│   └── icons/               # 应用图标
├── package.json             # 添加 tauri 脚本
└── README.md
```

### 8.2 构建配置

```json
// package.json 新增 scripts
{
  "scripts": {
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build",
    "tauri:build:win": "tauri build --target x86_64-pc-windows-msvc",
    "tauri:build:mac": "tauri build --target aarch64-apple-darwin"
  }
}
```

### 8.3 Steamworks 桥接预留

```rust
// src-tauri/src/steamworks.rs (预留接口)

use steamworks::{Client, SingleClient};

pub struct SteamBridge {
    client: Option<Client>,
    single: Option<SingleClient>,
}

impl SteamBridge {
    pub fn init(app_id: u32) -> Result<Self, String> {
        // 初始化 Steam API
    }

    pub fn unlock_achievement(&self, achievement_id: &str) -> bool {
        // 解锁成就
    }

    pub fn set_stat(&self, stat_id: &str, value: i32) -> bool {
        // 设置统计
    }

    pub fn get_cloud_save_path(&self) -> Option<String> {
        // 获取云存档路径
    }
}
```

### 8.4 成就系统设计

| 成就 ID | 名称 | 触发条件 |
|---------|------|---------|
| `ACH_FIRST_WALLFACER` | 面壁者 | 面壁计划启动 |
| `ACH_DETERRENCE_ESTABLISHED` | 威慑纪元 | 黑暗森林威慑建立 |
| `ACH_WANDERING_EARTH` | 流浪地球 | 行星发动机全部建成并启航 |
| `ACH_DIGITAL_SINGULARITY` | 数字天国 | 95% 人口意识上传 |
| `ACH_GALAXY_ERA` | 银河纪元 | 抵达银河纪元 |
| `ACH_CONQUEST_VICTORY` | 征服者 | 征服胜利 |
| `ACH_SURVIVAL_500` | 幸存者 | 存活 500 回合 |
| `ACH_ALL_TECHS` | 全知者 | 研究所有科技 |

---

## 第九章：开发阶段与里程碑

### 9.1 阶段总览

```
阶段 0: 基础设施重构 (Week 1-2)
  └─ DIContainer, EventBus, SaveManager, AudioManager

阶段 1: UEE Layer 1-2 (Week 2-3)
  └─ TagManager, 世界状态层, 数据 Schema 扩展

阶段 2: UEE Layer 3-5 (Week 3-4)
  └─ 事件生成公式, EcologyChain, RelationNetwork

阶段 3: UEE Layer 6-8 (Week 4-5)
  └─ AtmosphereEngine, SliceNarrative, HistoryGenerator

阶段 4: 测试体系扩展 (Week 5-6)
  └─ 新增 15+ 测试文件, 覆盖率 80%+, CI/CD 流水线

阶段 5: UI 集成 (Week 6-7)
  └─ AtmosphereProvider, 组件升级, 动态编年史 UI

阶段 6: 桌面端分发 (Week 7-8)
  └─ Tauri 集成, Steamworks 桥接, 成就系统

阶段 7: 打磨与发布 (Week 8-9)
  └─ 性能优化, 最终审计, 打包发布
```

### 9.2 里程碑 M1-M7

| 里程碑 | 验收标准 | 红线 |
|--------|---------|------|
| M0: 基础设施 | DIContainer + EventBus + SaveManager 独立运行 | npm run typecheck 通过 |
| M1: Tag 系统 | TagManager 全部功能 + 25+ 测试 | 分支覆盖率 > 60% |
| M2: 生态链 | 事件评分公式升级 + EcologyChain 运行 | 所有现有测试仍通过 |
| M3: 氛围引擎 | 5 种氛围状态自动切换 | 氛围切换无闪烁 |
| M4: 测试体系 | 400+ 测试, 覆盖率 > 80% | npx vitest run --coverage 通过 |
| M5: UI 集成 | 所有新组件渲染正确 | npm run build 通过 |
| M6: 桌面端 | Tauri 构建成功, .exe/.app 可运行 | tauri build 通过 |
| M7: 发布就绪 | 全量审计通过, 无 P0 问题 | 最终红线三合一 |

---

## 第十章：AI 协作约束与红线

### 10.1 继承约束（从 RPLAN_20260602 继承）

以下规则永久有效，新增模块也必须遵守：

- **E1**: 事件一次触发铁律（禁止 cooldownYears）
- **E2**: 人物纪元存活性检查（扩展：包含 Tag 标记的角色立场）
- **E3**: 数值量纲约束（扩展：生态链事件也需遵守）
- **E4**: 纪元标签精确性（禁止 WANDERING）
- **E5**: 头像资源映射规范
- **E6**: 存档/读档完整性（扩展：TagManager、HistoryGenerator、AtmosphereEngine 状态必须持久化）
- **E7**: 修改前读取完整上下文
- **E8**: 测试覆盖要求
- **E9**: 禁止引入新问题

### 10.2 新增 UEE 约束

| 规则 | 内容 |
|------|------|
| **E10** | **Tag 必须有来源**：任何 Tag 的产生必须由明确的世界状态变化或事件触发，禁止凭空添加 |
| **E11** | **生态链不可跳跃**：禁止数值下降直接触发危机事件，必须经过生态链传导 |
| **E12** | **关系网络聚焦宏观**：角色关系仅标记"角色与人类社会的宏观关系"，不建立好感度矩阵 |
| **E13** | **氛围切换有过渡**：Atmosphere 状态切换必须使用 CSS transition，时长 ≥ 1000ms |
| **E14** | **编年史完整性**：所有里程碑、Tag 变化、危机必须写入编年史，存档时必须持久化 |
| **E15** | **模块解耦原则**：新增模块通过 DIContainer 注册，禁止直接 new Game() 或 GameInstance.get() |

### 10.3 红线命令（三合一 + 扩展）

```bash
# 必须全部通过，缺一不可
cd 03_Web_Rebuild

# 红线 1: TypeScript 编译
npm run typecheck

# 红线 2: 全量测试 + 覆盖率 ≥ 75%
npx vitest run --coverage

# 红线 3: 生产构建
npm run build

# 红线 4: ESLint 静态分析
npm run lint

# 红线 5 (桌面端): Tauri 构建
npm run tauri:build
```

### 10.4 代码审查检查清单

任何 AI 提交代码前必须自检：

```
□ 是否新增了 DI 注册？检查 DIContainer 注册顺序
□ 是否新增了运行时状态？检查 SaveManager 序列化覆盖
□ 是否新增了 Tag？检查 TagManager 中 Tag 来源明确
□ 是否新增了事件？检查 E1-E4 约束
□ 是否新增了生态链？检查 E11 约束
□ 是否新增了测试？检查覆盖率是否提升
□ 是否修改了 Game.ts？检查是否破坏了现有行为
□ 是否运行了三合一红线？检查全部通过
```

---

## 附录 A：文件变更清单

### 新增文件

| 文件 | 层 | 说明 |
|------|-----|------|
| `src/core/TagManager.ts` | 世界状态层 | Tag 记忆系统 |
| `src/core/AtmosphereEngine.ts` | 表现层 | 氛围状态机 |
| `src/core/EcologyChain.ts` | 事件系统 | 生态链涟漪 |
| `src/core/RelationNetwork.ts` | 事件系统 | 关系网络 |
| `src/core/HistoryGenerator.ts` | 叙事引擎 | 动态编年史 |
| `src/core/SliceNarrativeEngine.ts` | 叙事引擎 | 切片叙事 |
| `src/core/DIContainer.ts` | 基础设施 | 依赖注入 |
| `src/core/EventBus.ts` | 基础设施 | 事件总线 |
| `src/core/SaveManager.ts` | 数据层 | 独立存档管理 |
| `src/core/AudioManager.ts` | 表现层 | 独立音频管理 |
| `src/components/AtmosphereProvider.tsx` | UI | 氛围 Provider |
| `src/data/ecologyChains.json` | 数据 | 生态链配置 |
| `src/data/atmosphere.json` | 数据 | 氛围配置 |
| `src/test/core/TagManager.test.ts` | 测试 | TagManager 测试 |
| `src/test/core/AtmosphereEngine.test.ts` | 测试 | 氛围引擎测试 |
| `src/test/core/EcologyChain.test.ts` | 测试 | 生态链测试 |
| `src/test/core/HistoryGenerator.test.ts` | 测试 | 编年史测试 |
| `src/test/core/RelationNetwork.test.ts` | 测试 | 关系网络测试 |
| `src/test/core/SliceNarrativeEngine.test.ts` | 测试 | 切片叙事测试 |
| `src/test/core/EventBus.test.ts` | 测试 | 事件总线测试 |
| `src/test/core/DIContainer.test.ts` | 测试 | DI 容器测试 |
| `src/test/core/SaveManager.test.ts` | 测试 | 存档管理测试 |
| `src/test/core/AudioManager.test.ts` | 测试 | 音频管理测试 |
| `src/test/integration/UEE_FullFlow.test.ts` | 测试 | UEE 全流程 |
| `src/test/integration/EventChain.test.ts` | 测试 | 事件链集成 |
| `src/test/components/AtmosphereProvider.test.tsx` | 测试 | 氛围组件测试 |
| `src-tauri/` (整个目录) | 桌面端 | Tauri 项目 |

### 修改文件

| 文件 | 变更 |
|------|------|
| `src/core/Game.ts` | 接入 DIContainer、EventBus、SaveManager；添加 TagManager/AtmosphereEngine/HistoryGenerator 回合处理 |
| `src/core/GameEventManager.ts` | 接入 EcologyChain、RelationNetwork；升级 checkRandomEvents 使用 UEE 评分公式 |
| `src/core/EventCadence.ts` | 新增 scoreEventUEE 函数 |
| `src/core/EarthCivilization.ts` | 接入 TagManager（状态变化产生 Tag） |
| `src/App.tsx` | 包裹 AtmosphereProvider |
| `src/types/narrative.ts` | 新增 WorldTag、CharacterTag、SliceNarrative、TimelineEntry 等类型 |
| `src/data/randomevents.json` | 添加 reqTags、reqState、ecologicalChain 字段 |
| `src/data/persons.json` | 添加 deathEpoch、canonicalStance 字段 |
| `src/data/epochs.json` | 添加 atmosphereState 映射 |
| `src/data/diplomacy.json` | 添加 relationImpactOnTags |
| `src/data/stars.json` | 添加 starType、habitability |
| `package.json` | 添加 tauri 依赖和脚本 |

---

## 附录 B：遗漏补充项

以下是在全面审查中发现的、之前的审计和修复方案中未充分覆盖的事项：

1. **Worker 分配 UI 缺少视觉反馈**：当前 `RightInspector.tsx` 的 Slider 已实现，但缺少分配后的百分比预览和劳动力短缺警告色
2. **科技树解锁通知**：当科技研究完成时，仅在 TopHUD 资源变化中体现，缺少独立的"科技解锁"弹窗通知
3. **外星文明外交冷却时间 UI**：`DiplomacyPanel.tsx` 已实现，但冷却时间显示为纯数字，缺少进度条可视化
4. **舰队移动路径可视化**：当前舰队从 A 星到 B 星是瞬移，缺少移动路径线条和到达倒计时
5. **结局条件提前提示**：玩家在接近胜利/失败条件时缺少预警（如"人口低于 10 将触发文明灭绝"）
6. **随机事件多样性监控**：缺少统计面板显示"已触发事件数 / 总事件数"的百分比
7. **性能监控**：大后期（500+ 回合）时存档体积可能膨胀，需要定期修剪历史记录
8. **无障碍访问**：缺少键盘快捷键、屏幕阅读器支持、高对比度模式
9. **多语言基础架构**：虽然当前仅支持中文，但代码中硬编码了大量中文字符串，缺少 i18n 抽象层
10. **数据热重载**：策划调整 JSON 数据后需要刷新页面，缺少开发模式下的热重载支持

---

> **文档状态**: 已归档
> **下次审查**: 阶段 0 完成后
> **编制依据**: SPEC_20260612_UNIVERSAL_EVENT_ENGINE_V1 + SPEC_20260603_REVISED_ITERATION_PLAN + AUDIT_20260605_REVISED_ITERATION_STATUS + EXEC_20260602_REMEDIATION_REPORT + EXEC_20260608_EVENT_AUDIT_WALKTHROUGH + EXEC_20260605_ITERATION_STAGES_ABC_REPORT + AUDIT_20260603_GODOT_MIGRATION_FEASIBILITY + SPEC_20260519_DOCUMENTATION_STANDARDS