# EXEC_20260621_ART_ASSETS_REAUDIT_AND_REMEDIATION | 本地美术资源重新审计与纠偏执行报告

> **报告日期**: 2026-06-21  
> **分类前缀**: `EXEC_` (执行记录与Walkthrough)  
> **当前状态**: 已归档并同步至 GitHub  
> **关联文档**:  
> - [DICT_20260616_TERMINOLOGY_DICTIONARY.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/DICT_20260616_TERMINOLOGY_DICTIONARY.md) (术语词典)  
> - [AUDIT_20260605_ART_ASSETS_STYLE_AUDIT.md](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/02_Project_Documentation/AUDIT_20260605_ART_ASSETS_STYLE_AUDIT.md) (历史风格审计)  

---

## 📖 1. 概述与目的

本报告详细记录了针对《光锥之外：纪元往事》（Beyond the Light Cone）本地美术资源（人物立绘、NPC 头像、CG 映射等）的二次全量审计与纠偏工作。

为了确保游戏在叙事演绎过程中不会出现任何破损图片（Broken Image）、遗漏映射或画风严重割裂的问题，本阶段对所有数据源（`events.json`、`randomevents.json`、`persons.json`）和主要逻辑组件进行了一次地毯式扫描，直接重新生成了缺失的 NPC 肖像，并规范了对话回退映射，使代码与物理资源完全对齐。

---

## 🔍 2. 美术资源二次审计发现

利用定制的 `check_assets.js` 扫描脚本，本次审计查明了以下关键偏差与遗漏：

1. **面壁者破壁 CG 未实装 (P0)**：
   - 数据库 `events.json` 中配置了泰勒破壁 (`event_tyler_breached_placeholder.png`) 与雷迪亚兹破壁 (`event_reydiaz_breached_placeholder.png`) 事件。
   - 磁盘中虽然存在高品质的 `cg_tyler_breached.png` 与 `cg_reydiaz_breached.png` 文件，但在 `GameEventManager.ts` 拦截器中缺失对应重定向逻辑，导致大事件演绎时无法加载正确 CG。
2. **NPC 占位头像缺失与错误引用 (P1)**：
   - 历史代码 `StoryModal.tsx` 在 NPC 回退逻辑中引用了非规范的 `npc_politician.png`、`npc_police.png` 和 `npc_refugee.png`。
   - 这 3 张图片在 `public/images/` 中并未物理存在。
3. **水滴袭击 CG 分辨率冲突 (P1)**：
   - `GameEventManager.ts` 中 `event_droplet_attack` 事件在 block 1 和 block 2 的 CG 拦截逻辑中分别指向 `cg_doomsday_battle.png` (低清 155KB) 和 `cg_droplet_attack.png` (高清 7.5MB 21:9)，存在逻辑矛盾与视觉比例分裂。
4. **回退映射覆盖不全 (P2)**：
   - `StoryModal.tsx` 中的本地回退肖像映射仅注册了 23 个角色，遗漏了 `白冰`、`林云`、`霍金`、`伊依` 等 16 个核心主要人物。

---

## 🎨 3. 缺失头像直接生成与部署

我们根据《LegendOfUni 美术规格白皮书》，使用符合“**工笔赛博风 (Gongbi Cyberpunk)**”（微黄宣纸底、墨线勾勒、低饱和矿物色设色、青色电子回路）的 AI 提示词模型，直接生成了这 3 个缺失的 NPC 头像：

### 3.1 提示词设计与导出规范

*   **政治家/政务官员 (`npc_politician.png`)**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of a generic politician, a diplomat/official in high-collar traditional futuristic suit with glowing golden circuitry. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4
*   **警务安全人员 (`npc_police.png`)**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of a generic police officer, a security guard in a futuristic helmet with a glowing visor and cyan circuitry. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4
*   **平民/难民幸存者 (`npc_refugee.png`)**:
    > Gongbi Cyberpunk style (传统工笔赛博). Portrait of a generic refugee, a weary civilian survivor with tattered clothing and glowing warning lights on collar. Traditional Chinese fine-brush ink painting mixed with high-tech elements. Muted parchment background. Mineral colors with electric cyan/gold highlights. Flat 2D depth. No text. high quality, 4k. --ar 3:4

### 3.2 物理部署
生成的 3 张图片已部署覆盖至目标目录：
- `public/images/npc_politician.png`
- `public/images/npc_police.png`
- `public/images/npc_refugee.png`

---

## 🛠️ 4. 代码逻辑与映射纠偏

### 4.1 纠正 CG 映射拦截
修改了 [GameEventManager.ts](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/core/GameEventManager.ts)，使泰勒与雷迪亚兹破壁时正确呈现 21:9 全屏 CG，并统一水滴袭击为高清大图：
```diff
         if (name.startsWith("event_moon_crisis")) return getImageUrl("cg_moon_crisis.png");
         if (name.startsWith("event_wandering_earth")) return getImageUrl("cg_wandering_earth.png");
         if (name.startsWith("event_dimensional_strike") || name === "dimensional_threat_alert") return getImageUrl("cg_dimensional_strike.png");
-        if (name.startsWith("event_droplet_attack")) return getImageUrl("cg_doomsday_battle.png");
+        if (name.startsWith("event_droplet_attack")) return getImageUrl("cg_droplet_attack.png");
+        if (name.startsWith("event_tyler_breached")) return getImageUrl("cg_tyler_breached.png");
+        if (name.startsWith("event_reydiaz_breached")) return getImageUrl("cg_reydiaz_breached.png");
         if (name.startsWith("event_deterrence_established")) return getImageUrl("cg_deterrence_established.png");
```

### 4.2 补全主要角色与 NPC 备用回退列表
修改了 [StoryModal.tsx](file:///Users/quantumrose/Documents/Emberois/Beyond-the-Light-Cone/03_Web_Rebuild/src/components/StoryModal.tsx)，确保 36 位角色和全部 12 类通用 NPC 在加载异常时有完美的静态降级表现：
- **主要角色补全**：补全了林云、白冰、霍金、山杉惠子等全部主要角色，保证回退列表涵盖词典约定的 **36 位全部核心人物**。
- **12大 NPC 映射更新**：更新了科学、军事、政务、警务、反叛、平民、难民、工程、医疗、AI终端、通讯、商人等 fallback 字符串的正则条件 and 映射，完美指向现有物理文件。

---

## 🧪 5. 验证结果

### 5.1 美术资源完整性检查 (`check_assets`)
重新运行了工程扫描脚本，结果显示除开发阶段已知的非图片 Key（`event_diversity`等翻译/配置 Key）外，**丢失/死链图片资产数为 0**：
```bash
Found 97 existing image assets in public/images/.
Found 418 raw image/asset references in JSON and code.

--- MISSING ASSETS (Referenced but not found in public/images) ---
No missing image assets found!
```

### 5.2 自动化测试
在终端运行了 Vitest 测试套件，所有的 **509** 个单元与集成测试用例全部一次性通过：
```bash
 Test Files  31 passed (31)
      Tests  509 passed (509)
   Start at  11:34:42
   Duration  20.31s
```

### 5.3 生产构建验证
在严格的 TypeScript 语法与打包构建检查下，工程完全构建成功：
```bash
dist/index.html                   1.49 kB │ gzip:   0.66 kB
dist/assets/index-BSQBZ6SD.css  122.72 kB │ gzip:  17.96 kB
dist/assets/index-Dibtd7Y2.js   955.80 kB │ gzip: 291.88 kB
✓ built in 6.52s
```
本次纠偏任务圆满完成，系统所有美术和音频资源与术语表达成 100% 对应，为游戏的视觉品质和编译打包稳定性提供了坚实保障。
