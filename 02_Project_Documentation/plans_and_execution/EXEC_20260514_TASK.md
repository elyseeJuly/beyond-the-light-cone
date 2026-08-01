# 宇宙群英传重构开发任务清单

- [x] P0: 核心缺陷修复与枚举扩展
    - [x] Bug #1: 全局单例空指针风险 (`LengendOfUni.h`)
    - [x] Bug #2: 迭代器失效 (`EarthCivilization.cpp` 的 Remove 方法)
    - [x] Bug #3: 无限循环风险 (`StarManager.cpp` 初始化)
    - [x] Bug #4: 数组越界风险 (`AlienCivilization.cpp` 选择武器)
    - [x] 枚举扩展 (`define.h` 增加科技树、纪元、性格等枚举)
- [x] P1: INI数据层更新
    - [x] 扩展 `person.ini` (新增三体角色)
    - [x] 扩展 `alien.ini` (外星文明性格)
- [x] P2: 科技树重构 (5棵新树)
    - [x] 重写 `TecTreeManager::Init`
- [x] P3: 基础机制 (纪元/性格/封锁)
- [x] P4: 面壁者/执剑人系统
- [x] P5: AI特殊武器与威胁评估
- [x] P6: 事件链系统 (月球危机/流浪地球)
- [x] P7: 行星发动机与数字生命
- [x] P8: 多元胜利条件
- [x] P9: UI美术与主题切换
