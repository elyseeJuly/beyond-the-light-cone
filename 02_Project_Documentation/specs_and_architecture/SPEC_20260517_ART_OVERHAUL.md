# 《宇宙群英传》工笔赛博视觉重构与美术资产白皮书
# LegendOfUni "Gongbi Cyberpunk" Art Overhaul Documentation

本技术文档详细记录了《宇宙群英传 (LegendOfUni)》重构版从早期混乱杂驳的旧资产体系，全面进化为以**“工笔赛博 (Gongbi Cyberpunk)”**为统领的高保真、数字化纸张水墨视觉系统的全套开发过程。

---

## 🎨 一、 核心视觉理念：工笔赛博 (Gongbi Cyberpunk)

> [!NOTE]
> **设计纲领**：将中国传统工笔画（精细勾勒的墨线、温润典雅的矿物设色、微微泛黄的宣纸底纹）与科幻未来主义（全息扫描线、荧光电子回路、深空星图、青金配色）完美融合，在数字视听中表达《三体》极具东方哲学色彩的大尺度宇宙图景。

### 1. 人物设计原则 (Character Design System)
*   **墨线勾勒 (Fine-Brush Inkwork)**：边缘线清晰致密，富有传统毛笔笔锋的变化与顿挫。
*   **设色温润 (Muted Colors)**：排除高饱和度的现代合成色，使用朱砂、石青、石绿等传统国画矿物色作为主基调。
*   **电子点缀 (Cybernetic Schematic)**：人物躯体、服饰上嵌入发光的集成电路、虚线圆弧全息环，以冷色调（青色/金色）为主。
*   **材质底蕴 (Paper Texture)**：背景透出微弱的天然宣纸/竹质纤维纹理。

---

## 📸 二、 人物资产重组与风格归一 (Character Portfolio Unification)

在重构初期，部分角色立绘由于生成参数偏差，呈现出过重的真人写实感或现代原画感，与游戏整体的国风墨感相冲突。为此，我们执行了**全域美术审计与二次重绘**。

### 1. 核心Protagonists全域重绘
重写并统一了以下八位主宰级角色的立绘资产，确保其线条、色调与材质完全一致：
*   **罗辑 (Luo Ji)**：手执引力波发射器，面带悲悯与决绝，墨线细腻。
*   **叶文洁 (Ye Wenjie)**：晚年睿智冷漠的学者气质，背景辅以红岸基地抛物线全息网。
*   **大史 / 史强 (Da Shi)**：豪迈粗犷，边缘墨线加粗以显力道，夹克下透出淡蓝色警用辅助仪。
*   **章北海 (Zhang Beihai)**：冷峻沉稳的太空军官，目光锁定深空，伴有微弱的全息准星。
*   **程心 (Cheng Xin)**：充满理想主义的光芒，柔和的工笔线条配合散落的量子星屑。
*   **维德 (Wade)**：刚毅冷酷，面部阴影极深，身披淡金色电子护甲，表现“前进！前进！不择手段！”的铁血决心。
*   **云天明 (Yun Tianming)**：在深空中孤独漂流，伴随着麦粒与三维展开的全息泡。
*   **智子 (Sophon)**：日本和服与机械关节的绝对工笔碰撞，冷金属与红木质感并存。

### 2. 最终部署资产路径一览
所有标准高清资产（35个角色）已部署于 `03_Web_Rebuild/public/images/`，包括：
*   `unified_luoji_1778921262534.png`
*   `unified_yewenjie_1778921299091.png`
*   `unified_dashi_1778921331273.png`
*   `unified_beihai_1778921366897.png`
*   `unified_chengxin_1778921400346.png`
*   `unified_wade_1778921437022.png`
*   `unified_tianming_1778921470963.png`
*   `unified_sophon_1778921509458.png`

---

## 🌌 三、 宏大叙事环境资产 (Event Scenery)

为取代原版过时的 `.bmp` 文件，并丰富弹窗事件的视觉维度，特别引入了四幅具有强烈叙事压迫感与唯美工笔感的宏大环境资产：

1.  **危机纪元开启 (Crisis Start)**
    *   *视觉*：巨大的三体智子在地球外轨道进行低维展开，将太空遮蔽，地球的蓝色弧线与金色电子脉冲在展开的镜面上交织。
    *   *文件名*：`event_crisis_start_1778921554350.png`
2.  **古筝行动 (Guzheng Action)**
    *   *视觉*：巴拿马运河上，由汪淼研制的超轻纳米丝“飞刃”在晨曦中拉开。审判日号巨轮平滑地被切割成数截，钢板断裂处飞溅出暗红色的高热火花。
    *   *文件名*：`event_guzheng_1778921589210.png`
3.  **月球危机 (Moon Crisis)**
    *   *视觉*：月球解体时，巨大的碎块带着重力锁定的拖尾坠向地球，地球表面的环形防御天线网发出虚幻的亮青色扫描线。
    *   *文件名*：`event_moon_crisis_1778921627726.png`
4.  **流浪地球 (Wandering Earth)**
    *   *视觉*：地平线上并排耸立的宏伟巨型行星发动机，向着漆黑宇宙喷射出通天彻地的幽蓝色等离子等离子光柱。
    *   *文件名*：`event_wandering_earth_1778921665842.png`

---

## 💻 四、 视觉滤镜与动效工程 (UI / CSS Engineering)

为了让平面立绘在数字屏幕上“活”起来，我们基于 Tailwind CSS 设计了一套全局材质与动效库。

### 1. 宣纸水墨双重滤镜 (Paper & Vignette)
我们在头像容器上叠加了绝对定位的无交互混合图层，模拟物理质感：
```css
@utility paper-texture {
  @apply absolute inset-0 pointer-events-none mix-blend-multiply opacity-[0.03];
  background-image: url("https://www.transparenttextures.com/patterns/natural-paper.png");
}

@utility ink-vignette {
  @apply absolute inset-0 pointer-events-none;
  background: radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.2) 100%);
}
```

### 2. 墨散动画 (Ink Spread)
所有的剧情弹窗在打开时不再使用生硬的淡入，而是模拟一滴墨汁在宣纸上晕染开来的动态剪裁：
```css
@keyframes ink-spread {
  from { clip-path: circle(0% at 50% 50%); }
  to { clip-path: circle(150% at 50% 50%); }
}

.animate-ink-spread {
  animation: ink-spread 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

### 3. 全息双色边框流动 (Holographic Border Flow)
事件弹窗的边框通过伪元素添加了基于全息青（Cyan）与高能金（Gold）的旋转渐变流光，表达科技与传统的激烈交锋：
```css
.modal-box::before {
  content: "";
  position: absolute;
  top: -2px; left: -2px; right: -2px; bottom: -2px;
  background: linear-gradient(45deg, transparent, var(--color-cyber-teal), transparent, var(--color-cyber-gold), transparent);
  background-size: 400% 400%;
  z-index: -1;
  border-radius: inherit;
  opacity: 0.3;
  animation: border-flow 6s linear infinite;
}
```

---

## 🛠️ 五、 容错升级与工程整合 (Technical Integration)

### 1. 动态智能解析器 (Fuzzy Avatar Resolver)
由于历史遗留，随机事件库（`randomevents.json`）中包含着多种书写形式的角色头像引用（如 `.bmp` 后缀，老旧的 `.png`，甚至仅存名字拼音）。
为此，我们在 `GameEventManager.ts` 中升级了极具容错力的解析函数：
```typescript
  private mapAvatar(bmpName: string): string {
    if (!bmpName || bmpName === "default") return "/images/character_default.png";

    // 格式标准化清洗
    let name = bmpName.toLowerCase();
    name = name.replace("/images/", "");
    name = name.replace("character_", "");
    name = name.replace("unified_", "");
    name = name.replace(".png", "");
    name = name.replace(".bmp", "");
    name = name.split("_")[0]; // 去除时间戳后缀

    const mapping: Record<string, string> = {
      // 八大主角自动重定向到统一高清资产
      "dashi": "/images/unified_dashi_1778921331273.png",
      "shiqiang": "/images/unified_dashi_1778921331273.png",
      "sophon": "/images/unified_sophon_1778921509458.png",
      "zhizi": "/images/unified_sophon_1778921509458.png",
      "luoji": "/images/unified_luoji_1778921262534.png",
      "beihai": "/images/unified_beihai_1778921366897.png",
      "chengxin": "/images/unified_chengxin_1778921400346.png",
      "yewenjie": "/images/unified_yewenjie_1778921299091.png",
      "wade": "/images/unified_wade_1778921437022.png",
      "weide": "/images/unified_wade_1778921437022.png",
      "tianming": "/images/unified_tianming_1778921470963.png",
      // 辅助角色映射...
    };

    if (mapping[name]) return mapping[name];
    return "/images/character_default.png";
  }
```
**此设计的优势**：保证了底层 5000+ 行 JSON 事件库在**不修改任何旧数据**的情况下，自动升级渲染出最新的高清工笔赛博立绘，降低了重构摩擦力。

### 2. 补全系统缺省兜底 (Fallback Avatar)
生成并集成了 `character_default.png`（工笔全息 AI 界面），防止任何未知 speaker 触发时导致浏览器渲染 broken image。

### 3. 沙盘 procedurally-drawn 验证
对 `StarMapRenderer.ts` 的彻底审计表明，整个星图采用 HTML5 Canvas 纯算法绘制，完美避开了位图拉伸的像素纹理，支持无限层级缩放。

---

## 📈 六、 归档与云端同步 (Version Control Summary)

本套视觉大底与智能容错架构已完整部署：
- **本地环境**：所有新增 `.png` 图层、`StoryModal.tsx` 的水墨动效、`GameEventManager.ts` 智能映射模块均已写入本地工程。
- **构建测试**：通过本地 `npm run build` 静态类型检测与 Vite 构建打包，零警告，零编译报错。
- **云端同步**：已合入本地 git 并全量推送至云端 GitHub 仓库。

*本白皮书归档于项目本地目录 `02_Project_Documentation/ART_OVERHAUL_DOCUMENTATION.md`，可由后继工程师随时调阅审查。*
