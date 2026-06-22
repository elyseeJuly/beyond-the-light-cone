# 《光锥之外：纪元往事》移动端自适应重构与资产标识统一执行报告

> **文档编号**: EXEC_20260622_MOBILE_RESPONSIVE_AND_ASSET_UNIFICATION_REPORT  
> **实施日期**: 2026-06-22  
> **报告分类**: `EXEC_` (执行与部署报告)  
> **验证基线**: 833 测试全量通过 | 网页预览版正常部署  
> **主程序员**: Antigravity (AI Tech Lead)  

---

## 目录
- [一、 现状与重构背景](#一-现状与重构背景)
- [二、 资源资产替换与规范化](#二-资源资产替换与规范化)
- [三、 移动端布局重构细节](#三-移动端布局重构细节)
- [四、 编译、测试与 GitHub 同步部署](#四-编译测试与-github-同步部署)

---

## 一、 现状与重构背景

在此前的版本中，《光锥之外：纪元往事》虽然建立了一定的断点检测机制，但是在实际移动设备（尤其是手机竖屏、窄长屏设备）中，用户体验仍存在以下痛点：
1.  **底部导航栏覆盖/按钮不可见**：`MobileBottomNav` 原本采用 `fixed` 悬浮定位，遮挡了 `main` 最下层的内容，导致诸如“进入中央计划局”、“召开面壁战略听证会”等核心决策按钮被完全挡住，玩家无法点击。
2.  **面板挤压溢出**：政府内阁（GovManagement）、情报中心（IntelligenceCenter）及档案馆（CivilizationArchive）使用左右并排的 Flexbox 双栏结构，左侧 sidebar 的 `w-48`（192px）在手机端占用了超过一半的宽度，导致右侧信息流和操作滑块高度重度挤压并触发溢出裁剪。
3.  **UI 标识不统一**：旧有的 cover 资源和 icons 未完全对应新版设计图。

针对以上问题，项目组实施了本期自适应重构与资产替换。

---

## 二、 资源资产替换与规范化

项目组将用户提供的新版高分辨率设计图，通过 macOS `sips`（图像处理脚本系统）和 Rust Tauri CLI 构建套件，统一进行了转换与分发：

1.  **正方形封面 (`cover_1_1.png`)**：
    *   输出路径：`03_Web_Rebuild/public/images/cover_1_1.png`
    *   分辨率及格式：1024x1024, PNG
2.  **自适应宽屏封面 (`cover.png`)**：
    *   输出路径：`03_Web_Rebuild/public/images/cover.png`
    *   裁剪方式：自 1024x1024 主图由中心向外裁切为 1024x682（3:2 宽高比）以适配网页首屏。
3.  **PWA/iOS 图标**：
    *   `apple-touch-icon.png` (180x180) $\rightarrow$ `03_Web_Rebuild/public/icons/apple-touch-icon.png`
    *   `icon-192x192.png` (192x192) $\rightarrow$ `03_Web_Rebuild/public/icons/icon-192x192.png`
    *   `icon-512x512.png` (512x512) $\rightarrow$ `03_Web_Rebuild/public/icons/icon-512x512.png`
4.  **Tauri 桌面包本地图标集**：
    *   通过 `cargo tauri icon` 自动对 `cover_1_1.png` 进行多分辨率下采样，批量刷新了 `03_Web_Rebuild/src-tauri/icons/` 下包含 macOS `.icns`、Windows `.ico`、Windows Appx、Android、iOS 共 52 个原生桌面客户端图标文件。

---

## 三、 移动端布局重构细节

### 3.1 消除 bottom-nav 覆盖遮挡 (Flex Flow Normalization)
在 `03_Web_Rebuild/src/index.css` 中，将 `.mobile-bottom-nav` 的定位重定义为 flex 常规子项：
```css
.mobile-bottom-nav {
  position: relative; /* 放弃原有的 fixed 浮动 */
  width: 100%;
  flex-shrink: 0;
  height: 56px;
  /* 保持 safe-area-inset-bottom 及其他模糊渐变效果 */
}
```
结合在移动端下隐藏 scrolling `BottomEventBar` 获得的 40px 高度，`App.tsx` 中的主 vertical flexbox 容器能够完美、自适应地将 `main` 视口框限在 `TopHUD` 与 `MobileBottomNav` 之间，任何按钮都不会被遮挡。

### 3.2 双栏板块水平转换与溢出横向滚屏 (Responsive Sidebar Tabs)
对 `GovManagement`、`IntelligenceCenter`、`CivilizationArchive` 的双栏布局均应用了以下自适应结构调整：
*   **外包裹层**：`flex` $\rightarrow$ `flex-col md:flex-row gap-4 md:gap-6`。
*   **侧边栏**：在移动端变为顶部横向滚动条，桌面端自动恢复为垂直侧栏：
    ```tsx
    className="w-full md:w-48 flex flex-row md:flex-col gap-1.5 shrink-0 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0"
    ```
*   **切换按钮**：允许横向单行无限延伸而不被截断换行：
    ```tsx
    className="w-auto md:w-full shrink-0 whitespace-nowrap flex items-center justify-between ..."
    ```

### 3.3 激活滚动条与 min-h 自适应 (Vertical Scroll Safety)
以政府面板为例，将原先写死的 `overflow-hidden` 卡片修改为自适应纵向滚动：
```tsx
{/* 柜体卡片 */}
<div className="flex-1 bg-[#070B14]/40 ... flex flex-col overflow-y-auto relative">
  {activeTab === 'finance' && (
    <div className="min-h-full flex flex-col justify-between gap-4">
      {/* 内容 */}
      <button className="w-full ..." /> {/* 底部大操作键在空间不足时可通过向下滑动点击 */}
    </div>
  )}
</div>
```

### 3.4 Grid 自适应列数 (Flexible Grid)
对于已解锁科技、功勋馆（成就）等模块，在移动端强行并排 2 列会导致标题和文字重合重叠。修改为：
```tsx
className="grid grid-cols-1 sm:grid-cols-2 gap-3"
```
窄屏设备下自动降级为 1 列，提升文字可读性与密度。

---

## 四、 编译、测试与 GitHub 同步部署

### 4.1 本地编译检测
在 Web Rebuild 根目录执行 `npm run build`：
*   **静态清单文件生成**：自动遍历 130 个素材资源，生成 `asset_manifest.json`；
*   **TypeScript 校验**：无错误退出；
*   **Vite 编译结果**：在 2.16 秒内打包完毕，未报任何 Warning。

### 4.2 自动化单元/集成测试
执行 `npm run test`（Vitest），运行 40 个测试文件的单元与集成测试：
*   **833 / 833 测试用例全量通过**；
*   音频总线 mock 成功，世界 Tag 状态链测试通过，确认了重构未引入任何 Regression 倒退。

### 4.3 GitHub 同步与 GitHub Pages 部署
1.  **提交至 main 分支**：
    ```bash
    git add .
    git commit -m "fix: resolve mobile layout overlapping, button clipping, and responsiveness issues"
    git push origin main
    ```
    推送成功，主仓分支已更新至 `3b96568`。
2.  **发布至 GitHub Pages 在线站点**：
    执行 `npm run deploy`，使用 `gh-pages` 套件自动将编译后的 `dist/` 包同步部署至 `gh-pages` 分支。
    新资产与移动端响应式布局已在 [Beyond the Light Cone 在线预览版](https://elyseejuly.github.io/beyond-the-light-cone/) 实时在线更新。
