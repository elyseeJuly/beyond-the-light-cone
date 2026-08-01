# 宇宙群英传 (Legend of Uni) — 全功能系统测试用例

> 版本：Web 重构版 (03_Web_Rebuild)
> 测试范围：全部 12 大功能系统，覆盖正常流程 / 边界条件 / 异常路径
> 原则：测试过程不对游戏源码做任何修改

---

## 目录

1. [经济与资源生产链系统](#1-经济与资源生产链系统)
2. [科技树系统](#2-科技树系统)
3. [军事与战斗系统](#3-军事与战斗系统)
4. [异星文明 AI 系统](#4-异星文明-ai-系统)
5. [外交系统](#5-外交系统)
6. [事件叙事系统](#6-事件叙事系统)
7. [胜利与失败条件系统](#7-胜利与失败条件系统)
8. [纪元与文明等级系统](#8-纪元与文明等级系统)
9. [面壁者与执剑人系统](#9-面壁者与执剑人系统)
10. [角色管理系统](#10-角色管理系统)
11. [存档与读档系统](#11-存档与读档系统)
12. [UI 交互系统](#12-ui-交互系统)

---

## 1. 经济与资源生产链系统

### 1.1 工人分配

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ECON-001 | 默认工人分配比例计算 | 游戏初始状态，idlePopulation=65 | 执行一回合 runARound | miningWorkers=21, factoryWorkers=21, cultureWorkers=21, idleWorkers=2（舍入误差） | | |
| ECON-002 | 修改采矿比例至 60 | 通过代码设置 miningRatio=60, factoryRatio=15, cultureRatio=15 | 执行一回合 | 分配按新比例生效 | | |
| ECON-003 | 零工人时的分配行为 | idlePopulation=0 | 执行一回合 | 所有工人分配为0，不产生异常 | | |
| ECON-004 | 工人分配分母硬编码验证 | 修改ratio使总和 ≠ 90 | 检查分配逻辑 | 分母为硬编码90，分配失真——这是一个已知BUG(B-11) | | |

### 1.2 采矿产出

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ECON-005 | 基础采矿产出 | 地球有采矿场，workersPerStope=7，无部长 | 执行一回合 | 产出 ≈ floor(7 * 2 / 2) = 7 | | |
| ECON-006 | 部长加成采矿 | 指派 economy 属性为 100 的部长到经济部门 | 执行一回合 | leaderBonus=5，产出增加 | | |
| ECON-007 | 星矿科技加成 | 完成星矿I科技 | 执行一回合 | miningWeight 从2变为3 | | |
| ECON-008 | 星矿III最高产出 | 完成星矿III科技 | 执行一回合 | miningWeight=5，产出大幅提升 | | |
| ECON-009 | 逃亡主义削弱采矿 | treachery=50 | 执行一回合 | 产出乘以 max(1, 50)/100 = 0.5 | | |
| ECON-010 | 资源枯竭保护 | star.currentResource=3 | 执行一回合 | 产出上限 = min(产出, 100, 3)，实际产出 ≤ 3 | | |
| ECON-011 | 多采矿场累积 | 建造2个采矿场 | 执行一回合 | 每个采矿场的产出累加到总资源 | | |

### 1.3 工厂产出（资源→经济转化）

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ECON-012 | 基础工厂产出 | 有工厂，workersPerFactory=7，resource≥200 | 执行一回合 | 产出 ≈ floor(7 * 2 / 2) = 7经济，消耗14资源 | | |
| ECON-013 | 资源不足时的产出截断 | resource=5 | 执行一回合 | add = floor(5/2) = 2，扣4资源 | | |
| ECON-014 | 行星发动机I型5倍产能 | 完成行星发动机I型科技 | 执行一回合 | add *= 5 | | |
| ECON-015 | 无发动机时单厂上限100 | 未完成行星发动机I型 | 执行一回合 | 单个工厂产出上限=100 | | |
| ECON-016 | 部长经济加成 | 指派 economy=90 的部长 | 执行一回合 | leaderBonus = floor(90/30) = 3 | | |

### 1.4 文化产出

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ECON-017 | 基础文化产出 | cultureWorkers=21，无部长 | 执行一回合 | cultureGain ≈ floor(21 * 2 / 20) = 2 | | |
| ECON-018 | 思想钢印科技加成 | 完成思想钢印I | 执行一回合 | weight 从2变为3 | | |
| ECON-019 | 部长社交加成 | 指派 social=100 的部长 | 执行一回合 | leaderBonus = floor(100/5) = 20 | | |
| ECON-020 | 文化单回合上限 | 所有加成后 cultureGain > 100 | 执行一回合 | 上限钳制为100 | | |

### 1.5 人口增长

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ECON-021 | 无城市时人口增长 | 无太空城市 | 执行一回合 | 增长 = 1 | | |
| ECON-022 | 有城市时的人口增长 | 有1座城市 | 执行一回合 | baseGrowth = max(1, floor(5 * 2/2) * 1) = 5 | | |
| ECON-023 | 多城市累积 | 有3座城市 | 执行一回合 | baseGrowth = 1 * 5 * 3 = 15 | | |
| ECON-024 | 殖民城科技加速 | 完成殖民城III | 执行一回合 | growthWeight=5 | | |
| ECON-025 | 人口上限截断 | currentPopulation 接近 populationLimit | 执行一回合 | 增长后不超过 populationLimit | | |
| ECON-026 | 人力资源部长加成 | 指派 leadership=80 的部长 | 执行一回合 | 额外增长 = floor(80 * 0.2) = 16 | | |
| ECON-027 | idleWorkers 与人口增长同步 | 人口增长被 limit 截断 | 执行一回合 | idleWorkers 是否能正确同步？已知BUG(B-13)：idleWorkers 可能超过总人口限制 | | |

---

## 2. 科技树系统

### 2.1 五条科技树初始化

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| TECH-001 | 物理学科技树节点数 | 游戏初始化后 | 检查 PHYSICS 树 | 应有 19+ 个节点 | | |
| TECH-002 | 航天工程科技树节点数 | 游戏初始化后 | 检查 AEROSPACE 树 | 应有 23+ 个节点 | | |
| TECH-003 | 军事科技树节点数 | 游戏初始化后 | 检查 MILITARY 树 | 应有 10+ 个节点 | | |
| TECH-004 | 信息技术科技树节点数 | 游戏初始化后 | 检查 INFORMATION 树 | 应有 14+ 个节点 | | |
| TECH-005 | 星际文明科技树节点数 | 游戏初始化后 | 检查 INTERSTELLAR 树 | 应有 9+ 个节点 | | |
| TECH-006 | 黑域生成双重节点 | 游戏初始化后 | 检查 PHYSICS 和 INTERSTELLAR 树中的黑域生成 | 两棵树中都有，已知事实(B-42) | | |

### 2.2 科技研发流程

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| TECH-007 | 开始研究一个科技 | 经济≥科技花费，前置科技已完成 | 点击科技节点 | node.inResearch = true，经济扣除 | | |
| TECH-008 | 前置科技未完成时阻止研究 | 前置科技未完成 | 点击科技节点 | 显示"前置科技未完成"，无法研究 | | |
| TECH-009 | 经济不足时阻止研究 | 经济 < cost | 点击科技节点 | 显示经济不足提示 | | |
| TECH-010 | 每回合科技进度推进 | 有科技 inResearch=true | 执行一回合 | currentWorkload += progress | | |
| TECH-011 | 科技完成判定 | currentWorkload >= totalWorkload | 执行一回合后 | node.finished = true, inResearch = false | | |
| TECH-012 | 智子封锁下的科研效率 | year >= 10，三体未灭，无反制科技 | 执行一回合 | progress = max(1, floor(progress / 10)) | | |
| TECH-013 | 550W量子计算机反制智子 | 完成550W量子计算机 | 执行一回合 | isSophonBlocked() 返回 false | | |
| TECH-014 | 智子工程反制智子 | 完成智子工程 | 执行一回合 | isSophonBlocked() 返回 false | | |
| TECH-015 | 部长科学加成 | 指派 science=200 的部长 | 执行一回合 | scienceBonus = floor(200/10) = 20 | | |
| TECH-016 | 无部长时的科技进度 | 无部长 | 执行一回合 | scienceBonus = 0，基础进度 = 10 | | |
| TECH-017 | 科技进度上限 | progress > 100 | 执行一回合 | 上限钳制为 100 | | |

### 2.3 跨科技树查询

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| TECH-018 | isTecFinished 检查 | 已完成某个科技 | 调用 isTecFinished(type, name) | 返回 true | | |
| TECH-019 | isTecFinishedAnywhere 跨树 | 在 PHYSICS 中完成黑域生成 | 调用 isTecFinishedAnywhere("黑域生成") | 返回 true（在任意树中完成即可） | | |
| TECH-020 | 未完成科技查询 | 科技未研究 | 调用 isTecFinished | 返回 false | | |

---

## 3. 军事与战斗系统

### 3.1 舰队创建与派遣

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| COMBAT-001 | 建造舰队 | 经济 ≥ 100 | 点击建造舰队 | 经济 -100，记录历史（BUG: 未实际创建舰队对象） | | |
| COMBAT-002 | 派遣舰队 | 舰队已存在 | 点击派遣到目标星球 | 创建新 Fleet 对象，eta=3 | | |
| COMBAT-003 | 舰队派遣源星球硬编码 | 选择火星后派遣 | 点击派遣 | 舰队仍从地球出发（sourceStarIndex 硬编码） | | |
| COMBAT-004 | 舰队到达时间递减 | fleet.eta = 3 | 每个回合 | eta 每回合 -1 | | |
| COMBAT-005 | 舰队到达触发战斗 | fleet.eta = 1 | 执行一回合 | eta → 0，触发 combat | | |

### 3.2 舰队 vs 军营战斗

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| COMBAT-006 | 攻击方战力计算 | 舰队含 10 艘恒星级战舰 | 调用 calculateFleetPower | 基础 = 10 * 80 * 15 = 12000，含 leader 加成 | | |
| COMBAT-007 | 水滴型战舰高倍率 | 舰队含水滴 | 调用 calculateFleetPower | 单位倍率 x20 | | |
| COMBAT-008 | 防守方战力计算 | 军营 500 士兵 + 武器 | 调用 calculateBarbackPower | 基础 = 500 * 2 + weapons 战力 | | |
| COMBAT-009 | 攻击方掷骰伤害 | 第1轮攻击 | resolveFleetVsBarback | 伤害 = floor(atkPower * (0.8~1.2) * 1.0) | | |
| COMBAT-010 | 防守方掷骰伤害 | 第1轮防守 | resolveFleetVsBarback | 伤害 = floor(defPower * (0.75~1.25)) | | |
| COMBAT-011 | 攻击方第5轮加成 | 第5轮 | resolveFleetVsBarback | 攻击方伤害乘数 = 1.5 | | |
| COMBAT-012 | 僵局判定（攻方胜） | 5轮后双方存活，ratio > 1.3 | resolveFleetVsBarback | 攻击方获胜 | | |
| COMBAT-013 | 僵局判定（守方胜） | 5轮后双方存活，ratio ≤ 1.3 | resolveFleetVsBarback | 防守方获胜 | | |
| COMBAT-014 | 一方HP归零即时判负 | 某方HP≤0 | resolveFleetVsBarback | 即时判负，不继续后续轮次 | | |

### 3.3 舰队 vs 舰队战斗（未使用）

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| COMBAT-015 | resolveFleetVsFleet 存在性 | - | 搜索代码调用 | 确认该方法从未被调用(B-35) | | |

---

## 4. 异星文明 AI 系统

### 4.1 异星文明初始化

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-001 | 五个异星文明加载 | 游戏初始化 | 检查 alienCiviManager.aliens | 三体/歌者/边缘世界/魔戒/归零者 | | |
| ALIEN-002 | 三体文明属性 | 游戏初始化 | 检查三体 | 人口200, 资源1000, 猎手型人格 | | |
| ALIEN-003 | 归零者属性 | 游戏初始化 | 检查归零者 | 人口1000, 资源3000（最强文明） | | |
| ALIEN-004 | 异星星球初始化 | 游戏初始化 | 检查 starIndices | 每个异星有 1000+ 偏移的星球索引 | | |
| ALIEN-005 | 异星经济成长 | 执行多个回合 | 观察 economy 变化 | 每回合 resource + rand(10), army +2 | | |
| ALIEN-006 | 异星人口增长 | 执行多个回合 | 观察 population | 12% 概率 + [5,14] 人口 | | |

### 4.2 猎手型 (三体) AI

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-007 | 威慑值低于90时攻击 | deterrence < 90 | 多回合观察 | 18% 概率发动攻击 | | |
| ALIEN-008 | 威慑值高于90时跳过 | deterrence >= 90 | 多回合观察 | 不发动攻击 | | |
| ALIEN-009 | 威慑/广播纪元30%跳过 | epoch=DETERRENCE or BROADCAST | 攻击条件满足时 | 30% 概率额外跳过 | | |
| ALIEN-010 | 攻击冷却机制 | 刚发动一次攻击 | 观察 attackCooldown | 5-10 回合冷却 | | |

### 4.3 清理者型 (歌者) AI

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-011 | 威慑低于70时攻击 | deterrence < 70 | 多回合观察 | 12% 概率攻击 | | |
| ALIEN-012 | 威慑高于70时跳过 | deterrence >= 70 | 多回合观察 | 不攻击 | | |
| ALIEN-013 | 攻击冷却 | 刚攻击完 | 观察 | 3-6 回合冷却 | | |

### 4.4 扩张型 (边缘世界) AI

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-014 | 殖民无人星球 | 存在未归属星球 | 多回合观察 | 14% 概率殖民 | | |
| ALIEN-015 | 威慑低于80时扩张 | deterrence < 80 | 正常扩张 | 扩张行为正常 | | |

### 4.5 防御型 (魔戒/归零者) AI

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-016 | 每回合军力增长 | 游戏正常进行 | 多回合观察 | 每回合 +5 army | | |
| ALIEN-017 | 不主动攻击 | 各种威慑值下 | 观察 | 只有5%概率的日志(不实际攻击) | | |

### 4.6 机会型 AI

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-018 | 友好时索要援助 | friendship=FRIEND | 多回合观察 | 8% 概率索要地球10%经济 | | |
| ALIEN-019 | 威慑低于50时进攻 | deterrence < 50 | 多回合观察 | 25% 概率进攻 | | |

### 4.7 异星攻击后果

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| ALIEN-020 | 异星攻击地球获胜 | 异星舰队到达，战斗胜利 | 触发 combat | 地球归属变更，人口降至30% | | |
| ALIEN-021 | 异星占领后GameOver检查 | 地球被占领 | 检查 isGameOver | BUG(B-20): 未立即检查，需等到下回合 | | |

---

## 5. 外交系统

### 5.1 友好度状态

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| DIPLO-001 | 默认友好度为中立 | 游戏初始化 | 检查 friendshipType | 三体=VERYANGRY（敌人），其他=NEUTRAL | | |
| DIPLO-002 | 五级友好度范围 | - | 所有操作 | VERYANGRY / ANGRY / NEUTRAL / FRIEND / VERYFRIEND | | |
| DIPLO-003 | 友好度钳制下限 | 尝试使 friendship < VERYANGRY | 通过效果 | 钳制为 VERYANGRY | | |
| DIPLO-004 | 友好度钳制上限 | 尝试使 friendship > VERYFRIEND | 通过效果 | 钳制为 VERYFRIEND | | |

### 5.2 外交行动

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| DIPLO-005 | 谈判提升关系 | cooldown=0, 目标文明未灭 | conductDiplomacy("三体", "negotiate") | friendship +1 | | |
| DIPLO-006 | 贸易交换资源 | cooldown=0, economy≥30 | conductDiplomacy("歌者", "trade") | economy -30, resource +50 | | |
| DIPLO-007 | 挑衅降低关系 | cooldown=0 | conductDiplomacy("边缘世界", "provoke") | friendship -1 | | |
| DIPLO-008 | 结盟条件 | friendship >= FRIEND, cooldown=0 | conductDiplomacy("归零者", "ally") | 结盟成功 | | |
| DIPLO-009 | 结盟条件不满足 | friendship < FRIEND | conductDiplomacy("三体", "ally") | 返回"关系不够友好" | | |
| DIPLO-010 | 外交冷却中 | cooldown > 0 | 任何外交行动 | 返回"外交冷却中" | | |
| DIPLO-011 | 对已灭文明外交 | 文明已灭 | 任何外交行动 | 返回"[文明名]已灭绝" | | |
| DIPLO-012 | 冷却递减 | cooldown = 3 | 执行一回合 | cooldown → 2 | | |

---

## 6. 事件叙事系统

### 6.1 固定年份事件

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EVENT-001 | year=0 初始事件 | year=0 | 执行 checkEvents | 触发联合政府开幕事件 | | |
| EVENT-002 | year=2 古筝行动 | year=2 | 执行 checkEvents | 触发史强对话 | | |
| EVENT-003 | year=10 智子封锁 | year=10 | 执行 checkEvents | 触发智子宣告 | | |
| EVENT-004 | year=50 月球危机 | year=50 | 执行 checkEvents | 触发月球危机事件 | | |
| EVENT-005 | year=300 流浪地球 | year=300 | 执行 checkEvents | 触发流浪地球事件 | | |
| EVENT-006 | 事件不重复触发 | 事件已触发 | 再次达到该年份 | hasTriggered=true，不再触发 | | |

### 6.2 随机事件

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EVENT-007 | 随机事件产生 | 游戏进行中 | 执行多个回合 | 有概率触发随机事件 | | |
| EVENT-008 | 随机事件按概率筛选 | 多个随机事件可用 | checkRandomEvents | 满足概率条件的事件被选中 | | |
| EVENT-009 | 纪元条件匹配 | epoch=CRISIS, 事件要求 WANDERING | checkRandomEvents | 匹配 CRISIS/DETERRENCE 皆可触发 | | |
| EVENT-010 | 纪元不匹配时跳过 | epoch=GALAXY, 事件要求 CRISIS | checkRandomEvents | 事件被过滤 | | |
| EVENT-011 | 随机事件科技需求 | 事件要求特定科技未完成 | checkRandomEvents | 事件被过滤 | | |

### 6.3 条件过滤事件

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EVENT-012 | 面壁者选拔触发 | year=10-50, CRISIS, culture≥30 | getFilteredEventsForTurn | 触发 wallfacer_election | | |
| EVENT-013 | 威慑体系建立 | year≥50, 黑暗森林威慑科技, deterrence≥50 | getFilteredEventsForTurn | 触发 deterrence_establishment | | |
| EVENT-014 | 智子封锁事件 | year 10-200, CRISIS, 无 sophon_broken flag | getFilteredEventsForTurn | 触发 sophon_blockade | | |
| EVENT-015 | 流浪地球大辩论 | year≥100, 行星发动机基础 | getFilteredEventsForTurn | 触发 wandering_earth_decision | | |
| EVENT-016 | 逃亡主义叛乱 | year≥60, treachery≥30, CRISIS | getFilteredEventsForTurn | 触发 rebellion_crisis | | |
| EVENT-017 | 智子反制突破 | year≥30, 550W量子计算机完成 | getFilteredEventsForTurn | 触发 sophon_countermeasure | | |
| EVENT-018 | 条件过滤事件冷却 | 某事件刚触发，有 cooldownYears | 检查是否再次触发 | 冷却期内不触发 | | |
| EVENT-019 | 概率条件过滤 | 某事件 probability < 1 | 多次检查 | 按概率触发 | | |

### 6.4 事件效果应用

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EVENT-020 | ECO_GAIN 效果 | 事件效果=ECO_GAIN | applyEventEffect | economy + 50 | | |
| EVENT-021 | CUL_GAIN 效果 | 事件效果=CUL_GAIN | applyEventEffect | culture + 30 | | |
| EVENT-022 | POP_GAIN 效果 | 事件效果=POP_GAIN | applyEventEffect | population + 20 | | |
| EVENT-023 | SUB_TREACHERY 效果 | treachery > 0 | applyEventEffect | treachery - 15 (min at 0) | | |
| EVENT-024 | MOON_CRISIS 资源足够 | resource >= 500 | applyEventEffect | resource - 500 | | |
| EVENT-025 | MOON_CRISIS 资源不足 | resource < 500 | applyEventEffect | population = floor(population / 2) | | |
| EVENT-026 | WANDERING_EARTH 需要发动机 | 无行星发动机科技 | applyEventEffect | 可能无效果（需特定科技） | | |

### 6.5 Flag 因果链

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EVENT-027 | addFlag | 事件选项设置 flag | 执行选项 | flag 被加入 flags Set | | |
| EVENT-028 | hasFlag 检查 | flag 已设置 | hasFlag("flag_name") | 返回 true | | |
| EVENT-029 | 基于 flag 的条件过滤 | 某条件事件需要特定 flag | 条件检查 | checkFilterConditions 正确评估 reqFlag/reqNotFlag | | |
| EVENT-030 | removeFlag | flag 存在 | removeFlag("flag_name") | flag 被移除 | | |

---

## 7. 胜利与失败条件系统

### 7.1 流浪胜利

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WIN-001 | 流浪胜利条件满足 | 行星发动机III型 + 新家园选址 | checkVictoryConditions | victoryType = WANDERING, isGameOver = true | | |
| WIN-002 | 流浪条件部分满足 | 仅有行星发动机III型，无新家园选址 | checkVictoryConditions | 不触发胜利 | | |

### 7.2 数字永生胜利

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WIN-003 | 数字方舟完成 | 数字方舟科技 finished=true | checkVictoryConditions | victoryType = DIGITAL | | |
| WIN-004 | 数字方舟未完成 | 相关科技未完成 | checkVictoryConditions | 不触发 | | |

### 7.3 威慑胜利

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WIN-005 | 威慑纪元胜利 | epoch >= DETERRENCE, 有执剑人, population > 0 | checkVictoryConditions | victoryType = DETERRENCE | | |
| WIN-006 | 无执剑人时威慑胜利 | epoch >= DETERRENCE, swordholder = null | checkVictoryConditions | 不触发 | | |

### 7.4 征服胜利

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WIN-007 | 所有异星文明灭绝 | isAllCiviConquered() = true | checkVictoryConditions | victoryType = CONQUEST | | |
| WIN-008 | 部分文明仍存活 | isAllCiviConquered() = false | checkVictoryConditions | 不触发 | | |

### 7.5 黑域胜利

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WIN-009 | 黑域生成完成 | 黑域生成科技 finished=true | checkVictoryConditions | victoryType = DARK_DOMAIN | | |
| WIN-010 | 黑域未完成 | 黑域生成未完成 | checkVictoryConditions | 不触发 | | |

### 7.6 失败条件

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| FAIL-001 | 逃亡主义失控 | treachery >= 100 | checkVictoryConditions | isGameOver=true, reason 包含"逃亡主义" | | |
| FAIL-002 | 人口归零 | population <= 0 | checkVictoryConditions | isGameOver=true, reason 包含"文明灭绝" | | |
| FAIL-003 | 太阳氦闪 | year > 400, epoch < GALAXY | checkVictoryConditions | isGameOver=true, reason 包含"太阳氦闪" | | |
| FAIL-004 | 纪元已到银河纪元 | year > 400, epoch >= GALAXY | checkVictoryConditions | 不触发氦闪失败 | | |

---

## 8. 纪元与文明等级系统

### 8.1 纪元转换

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EPOCH-001 | 危机纪元 | year 1-200 | year递增 | epoch = CRISIS | | |
| EPOCH-002 | 转入威慑纪元 | year 200→201 | runARound | epoch = DETERRENCE, 触发 epoch-changed 事件 | | |
| EPOCH-003 | 转入广播纪元 | year 260→261 | runARound | epoch = BROADCAST | | |
| EPOCH-004 | 转入掩体纪元 | year 268→269 | runARound | epoch = BUNKER | | |
| EPOCH-005 | 转入银河纪元 | year 330→331 | runARound | epoch = GALAXY | | |
| EPOCH-006 | 纪元边界 year=200 | year=200 | runARound | 仍为 CRISIS（year<=200） | | |
| EPOCH-007 | 纪元边界 year=201 | year=201 | runARound | 变为 DETERRENCE（year>=201） | | |

### 8.2 文明等级

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| EPOCH-008 | 文明等级 L0 - 荒蛮 | culture < 70 | check civiLevel | level = 0, label = "荒蛮" | | |
| EPOCH-009 | 文明等级 L1 - 起源 | culture=70 | updateCiviLevel | level = 1, label = "起源", army +20 | | |
| EPOCH-010 | 文明等级 L2 - 风暴 | culture=200 | updateCiviLevel | level = 2, label = "风暴", army +20 | | |
| EPOCH-011 | 文明等级 L3 - 逐鹿 | culture=500 | updateCiviLevel | level = 3, label = "逐鹿", army +20 | | |
| EPOCH-012 | 文明等级 L4 - 霸王 | culture=1000 | updateCiviLevel | level = 4, label = "霸王", army +20 | | |
| EPOCH-013 | 文明升级触发历史日志 | culture 突破阈值 | updateCiviLevel | 日志记录升级信息 | | |

---

## 9. 面壁者与执剑人系统

### 9.1 面壁者管理

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WALL-001 | 添加面壁者 | wallfacers.size < 4 | addWallfacer("罗辑") | wallfacers 包含"罗辑", availablePersons 不包含"罗辑" | | |
| WALL-002 | 移除面壁者 | "罗辑" 在 wallfacers 中 | removeWallfacer("罗辑") | wallfacers 不含"罗辑", availablePersons 恢复"罗辑" | | |
| WALL-003 | 面壁者上限 | wallfacers.size = 4 | 尝试添加第5位 | 添加按钮不显示或被阻止 | | |
| WALL-004 | 检查是否为面壁者 | "罗辑" 在 wallfacers | isWallfacer("罗辑") | 返回 true | | |
| WALL-005 | 非面壁者检查 | "章北海" 不在 wallfacers | isWallfacer("章北海") | 返回 false | | |
| WALL-006 | 面壁者与执剑人冲突 | 同一人既是面壁者又是执剑人 | 撤销面壁者 | 执剑人是否也被释放？BUG: 可能状态不一致 | | |

### 9.2 执剑人管理

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WALL-007 | 任命执剑人 | swordholder = null | 设置 swordholder = "罗辑" | swordholder = "罗辑" | | |
| WALL-008 | 更换执剑人 | swordholder = "罗辑" | 设置为"程心" | 先释放旧任再接新任 | | |
| WALL-009 | 威慑值计算 | 有执剑人 | 读取 deterrenceValue | 基于执剑人 leadership 等属性计算 | | |
| WALL-010 | 执剑人对威慑胜利的影响 | epoch >= DETERRENCE | checkVictoryConditions | 有执剑人→触发威慑胜利 | | |

### 9.3 终极广播

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| WALL-011 | 点击终极广播 | 游戏进行中 | 点击广播按钮 | 确认对话框 → 确认后触发结局 | | |
| WALL-012 | 终极广播后果 | 确认广播 | 执行广播 | 当前只是 alert + reload，未进入 EndGameScreen (BUG) | | |

---

## 10. 角色管理系统

### 10.1 人物加载与属性

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| CHAR-001 | 35名角色加载 | 游戏初始化 | personManager.init() | persons Map.size = 35 | | |
| CHAR-002 | 关键角色存在 | 游戏初始化 | getPerson("罗辑") | 返回 Person 对象，属性完整 | | |
| CHAR-003 | 关键角色存在 | 游戏初始化 | getPerson("章北海") | 返回 Person 对象 | | |
| CHAR-004 | 关键角色存在 | 游戏初始化 | getPerson("程心") | 返回 Person 对象 | | |
| CHAR-005 | 人物7维属性 | 获取任意角色 | 检查属性 | 有 treachery/science/art/economy/army/leadership/social | | |
| CHAR-006 | 获取不存在人物 | name = "不存在" | getPerson("不存在") | 返回 undefined | | |
| CHAR-007 | 获取全部人物 | - | getAllPersons() | 返回 35 个 Person 对象数组 | | |

### 10.2 人物分配

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| CHAR-008 | 分配部长 | person 在 availablePersons 中 | 设置 dept.leaderName | dept.leaderName 被设置 | | |
| CHAR-009 | 可用人员列表维护 | person 被分配 | 检查 availablePersons | BUG(B-31): availablePersons 从未被移除 | | |
| CHAR-010 | 人员头像加载 | faceFile 指定图片名 | 部门面板渲染 | 头像图片正常显示 | | |
| CHAR-011 | 人员重复分配 | person 已任部长 | 再次分配到其他部门 | 是否能阻止？代码中无此防护 | | |

---

## 11. 存档与读档系统

### 11.1 保存游戏

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| SAVE-001 | 正常保存 | 游戏进行中 | GameInstance.saveGame() | localStorage 写入存档数据 | | |
| SAVE-002 | 排除运行时状态 | isProcessing=true, currentEvent 非空 | saveGame | 存档不包含 currentEvent/eventQueue/isProcessing | | |
| SAVE-003 | Map 序列化 | departments Map 非空 | saveGame | 序列化为 {dataType:'Map', value:[...entries]} | | |
| SAVE-004 | Set 序列化 | flags/wallfacers 非空 | saveGame | 序列化为 {dataType:'Set', value:[...array]} | | |
| SAVE-005 | localStorage 不可用 | 隐私模式禁用 localStorage | saveGame | 应有错误处理，提示用户 | | |
| SAVE-006 | 存档数据大小 | 游戏进行多回合后 | saveGame | 检查 localStorage 占用空间 | | |

### 11.2 读取游戏

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| SAVE-007 | 正常读取 | 有有效存档 | GameInstance.loadGame() | 返回 true，游戏状态恢复 | | |
| SAVE-008 | 无存档时读取 | localStorage 无存档 | loadGame() | 返回 false | | |
| SAVE-009 | 存档损坏 | 手动篡改 localStorage | loadGame() | 返回 false，无崩溃 | | |
| SAVE-010 | 原型链恢复 | 读取存档后 | 调用 earthCivi.runARound() | 方法正常执行，原型链已恢复 | | |
| SAVE-011 | 外星文明状态恢复 | 读取存档后 | 检查 alienCiviManager.aliens | 所有 AlienCivilization 对象恢复 | | |
| SAVE-012 | 科技树状态恢复 | 读取存档后 | 检查 tecTreeManager.trees | 所有 TecTree 对象恢复 | | |
| SAVE-013 | 事件触发器状态恢复 | 读取存档后 | 检查 eventManager | triggeredFilteredIds Set 恢复，但 filteredEvents 被重新创建 (BUG-B-08) | | |
| SAVE-014 | 读档后继续游戏 | 读取存档 | 点击下一回合 | 游戏正常推进，不卡死 | | |

---

## 12. UI 交互系统

### 12.1 顶部 HUD

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-001 | 纪元/年份显示 | 游戏初始化 | 查看 TopHUD | 显示"危机纪元" + year | | |
| UI-002 | 资源数值显示 | 游戏初始化 | 查看 TopHUD | 人员/经济/文化/军力/资源/逃亡/威慑 全部显示 | | |
| UI-003 | 资源变化浮动数字 | 经济增加 | 查看漂浮动画 | 绿色 "+N" 上浮消失 | | |
| UI-004 | 资源减少浮动数字 | 经济减少 | 查看漂浮动画 | 红色 "-N" 上浮消失（当前实现为橙色） | | |
| UI-005 | 下一回合按钮 | 无事件时 | 点击按钮 | runARound 执行，按钮短暂禁用 | | |
| UI-006 | 下一回合按钮事件队列 | currentEvent 非空 | 点击按钮 | 按钮禁用状态 | | |
| UI-007 | 强制同步状态 | 游戏卡住 | 点击强制同步 | 重置 isProcessing/currentEvent/eventQueue | | |

### 12.2 左侧导航

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-008 | 星图/科技树切换 | activeView='starmap' | 点击科技树 | activeView='techtree', 显示 TecTreeView | | |
| UI-009 | 科技树默认分支 | 切换到科技树 | 查看 | 默认显示 PHYSICS 树(B-50: 硬编码) | | |
| UI-010 | 智子封锁警告条 | isSophonBlocked()=true | 查看LeftHub | 红色警告条显示 | | |
| UI-011 | 智子封锁解除 | 完成智子反制科技 | 查看LeftHub | 警告条消失 | | |
| UI-012 | 部门按钮点击 | 点击宇宙社会学 | 点击 | 打开 WallfacerPanel | | |
| UI-013 | 部门按钮点击 | 点击经济部门 | 点击 | 打开 DepartmentPanel，显示相关信息 | | |

### 12.3 右侧详情面板

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-014 | 选中星球显示信息 | 点击星球 | 查看RightInspector | 显示星名/归属/资源/人口/设施状态 | | |
| UI-015 | 建造采矿场 | 经济≥30，无采矿场 | 点击建造 | 经济-30，hasStope=true | | |
| UI-016 | 建造采矿场经济不足 | 经济<30 | 点击建造 | alert 提示 | | |
| UI-017 | 建造加工厂 | 经济≥50，无工厂 | 点击建造 | 经济-50，hasFactory=true | | |
| UI-018 | 建造太空城市 | 经济≥80，无城市 | 点击建造 | 经济-80，hasCity=true | | |
| UI-019 | 建造舰队（React版） | 经济≥100 | 点击建造舰队 | 经济-100，记录历史（未创建舰队对象 - BUG） | | |
| UI-020 | 派遣舰队 | 舰队存在 | 点击派遣 | 创建 Fleet 对象，目标木星(index=5)，ETA=3 | | |
| UI-021 | UIManager版设施建造 | 旧版UI | 点击建造 | 直接设置 hasXxx=true，无经济检查(OOM BUG) | | |

### 12.4 星图渲染

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-022 | 太阳系星球渲染 | 游戏初始化 | 查看星图 | 太阳在中心，8大行星有轨道 | | |
| UI-023 | 星球轨道动画 | 观察星图 | 等待数秒 | 星球沿椭圆轨道运动 | | |
| UI-024 | 鼠标悬停效果 | 鼠标移到星球上 | 查看星球 | 出现光环和名称标签 | | |
| UI-025 | 点击选中星球 | 点击某星球 | 查看右侧面板 | RightInspector 更新显示 | | |
| UI-026 | Zoom In 按钮 | 点击 Zoom In | 查看 | BUG: 按钮未绑定事件处理函数 | | |
| UI-027 | Zoom Out 按钮 | 点击 Zoom Out | 查看 | BUG: 按钮未绑定事件处理函数 | | |
| UI-028 | Reset View 按钮 | 点击 Reset View | 查看 | BUG: 按钮未绑定事件处理函数 | | |
| UI-029 | 远星不可见 | index > 8 的星球 | 查看星图 | 不渲染（设计：仅太阳系可见） | | |
| UI-030 | Canvas resize | 调整窗口大小 | 查看星图 | Canvas 应适配新尺寸 | | |

### 12.5 叙事模态框

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-031 | 事件对话框弹出 | 触发事件 | 查看屏幕 | StoryModal 弹出，显示事件标题 | | |
| UI-032 | 打字机效果 | 对话框显示 | 观察文字 | 逐字显示，30ms 间隔 | | |
| UI-033 | 点击加速显示 | 打字机进行中 | 点击对话框 | 全文立即显示 | | |
| UI-034 | 对话节点推进 | 全文显示后 | 点击 | 进入下一个对话节点 | | |
| UI-035 | 选项分支显示 | 最后一个对话节点后 | 等待 | 显示选择按钮 | | |
| UI-036 | 选项执行 | 点击选项 | 点击 | choice.action() 执行，事件关闭 | | |
| UI-037 | 角色头像显示 | 对话中有 avatarUrl | 查看 | 头像图片显示在对话框内 | | |
| UI-038 | 选项action异常保护 | action 抛出异常 | 点击选项 | 模态框不应卡住（需检查 try/catch） | | |

### 12.6 结束画面

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-039 | EndGameScreen 触发 | isGameOver=true | 查看屏幕 | EndGameScreen 渲染，显示原因 | | |
| UI-040 | 历史日志打字机 | EndGameScreen 显示后 | 等待 | 最近 15 条历史逐条显示 | | |
| UI-041 | 重新开始 | EndGameScreen 显示 | 点击重新开始 | window.location.reload() | | |
| UI-042 | 游戏结束原因显示 | isGameOver=true | 查看 | 显示 gameOverReason 文本 | | |

### 12.7 系统菜单

| 用例编号 | 测试场景 | 前置条件 | 操作步骤 | 预期结果 | 实际结果 | 状态 |
|----------|----------|----------|----------|----------|----------|------|
| UI-043 | 打开系统菜单 | 游戏进行中 | 点击设置按钮 | SystemMenuPanel 显示 | | |
| UI-044 | 保存按钮 | 系统菜单中 | 点击保存 | saveGame() 执行，alert 提示成功 | | |
| UI-045 | 读取按钮 | 系统菜单中 | 点击读取 | 确认 → loadGame() 执行 | | |
| UI-046 | 主题切换 | 系统菜单中 | 点击主题切换 | dark 类名 toggle | | |
| UI-047 | 重新开始 | 系统菜单中 | 点击重新开始 | 确认 → reset() + reload() | | |

---

## 附录 A：发现的已知缺陷汇总

以下缺陷在代码分析阶段确认，测试时需验证是否仍然存在：

| 编号 | 系统 | 严重度 | 描述 |
|------|------|--------|------|
| B-03 | 存档 | 高 | Object.assign 浅拷贝导致原型链丢失 |
| B-11 | 经济 | 高 | 工人分配分母硬编码为 90 |
| B-17 | 外星 | 高 | 异星攻击 sourceStarIndex 永远传 0 |
| B-20 | 外星 | 高 | 异星占领地球后未立即检查 GameOver |
| B-32 | 战斗 | 高 | 攻防伤害计算公式不对称 |
| B-36 | 事件 | 高 | 无条件冷却事件只触发一次 |
| B-01 | 游戏 | 中 | Game.filteredEvents 冗余字段 |
| B-02 | 事件 | 中 | ADDTREACHERY 命名与实际行为相反 |
| B-08 | 存档 | 中 | loadGame 后 eventManager.init() 覆盖 filteredEvents |
| B-27 | 建筑 | 中 | Building.ts 模块完全未被使用 |
| B-45 | 武器 | 中 | 武器建造/升级逻辑不存在 |
| B-50 | UI | 中 | TecTreeView 硬编码 PHYSICS |
| B-51 | UI | 中 | 全局异常处理未清理事件队列 |
| B-26 | 星图 | 低 | 随机生成逻辑尚未实现 |
| B-29 | 部门 | 低 | calculateDepartmentEfficiency 从未被调用 |
| B-35 | 战斗 | 低 | resolveFleetVsFleet 从未被调用 |
| B-47 | 枚举 | 低 | DiplomacyState 枚举未使用 |

---

## 附录 B：测试环境与执行说明

### 测试环境
- 浏览器：最新版 Chrome / Firefox / Safari
- 游戏版本：Web 重构版 (03_Web_Rebuild)
- 测试工具：手动测试 + 浏览器 DevTools Console
- 数据来源：`03_Web_Rebuild/src/data/` 下的 JSON 数据文件

### 测试执行方式
1. 启动本地开发服务器：`cd 03_Web_Rebuild && npm run dev`
2. 打开浏览器 DevTools Console
3. 通过 `window.game` 全局变量访问游戏实例
4. 使用 Console 执行查询和状态检查（不得修改游戏代码）

### Console 快捷命令参考

```javascript
const game = window.game;
const earth = game.earthCivi;

// 查看状态
console.log('Year:', game.year);
console.log('Epoch:', game.epoch);
console.log('Pop:', earth.population);
console.log('Econ:', earth.economy);
console.log('Deterrence:', earth.deterrenceValue);

// 检查科技
game.tecTreeManager.isTecFinishedAnywhere('行星发动机I型');

// 检查事件
game.eventManager.filteredEvents;

// 强制执行一回合
game.runARound();

// 保存/读档
GameInstance.saveGame();
GameInstance.loadGame();
```

---

> 文档生成日期：2026-05-17
> 总计测试用例：150+ 条，覆盖 12 大功能系统