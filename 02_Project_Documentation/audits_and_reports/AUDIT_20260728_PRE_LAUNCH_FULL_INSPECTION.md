# Beyond the Light Cone v1.0.7 上线前全检报告（复核修订）

**日期**：2026-07-28  
**范围**：`v1.0.6..HEAD`、本地代码门禁、Cloudflare Workers Static Assets 配置与构建产物。  
**复核说明**：本版替换原先将静态推断写成 Cloudflare 上线阻断的结论；未执行生产部署，也不以本地检查替代生产可用性证据。

---

## 📌 执行摘要

- **结论：🟡 有条件通过。** 本地 `npm test`、`npm run typecheck`、`npm run lint` 均成功；Cloudflare 静态资产 dry-run 成功读取 `03_Web_Rebuild/dist` 的 183 个文件。
- **本地阻断项：0。** 没有证据支持“当前 Worker 导致整站回环/500”或“`_headers` 格式错误”的原结论。
- **生产边界：** 生产 URL、最近一次 Cloudflare 部署日志和浏览器冒烟仍是生产上线的最终证据；本报告未重新部署生产环境。
- **建议优先级：** 发布前做一次已部署站点的首页、深链刷新与安全头抽查；其余为下一迭代的安全加固、测试与文档一致性工作，而非本地 No-Go。

---

## 1. Cloudflare 部署复核

### 1.1 已验证事实

| 项目 | 复核结果 | 证据 |
|---|---|---|
| 静态资产配置 | ✅ 本地可解析 | `wrangler deploy --dry-run --config 03_Web_Rebuild/wrangler.jsonc` 成功读取 183 个 `dist` 文件，无 `_headers` / `_redirects` 报错。 |
| SPA 回退 | ✅ 已配置 | 根与 Web 配置均为 `assets.not_found_handling: "single-page-application"`；`dist/_redirects` 不存在。 |
| `_headers` | ✅ 当前格式有效 | `/*` 是全路径匹配规则，不是 C 风格注释；构建产物与 `public/_headers` 一致。 |
| Worker 对正常页面的影响 | ❌ 未证明是阻断 | 静态资产匹配优先于 Worker；该兼容日期下 SPA 导航优先由资产回退处理。原报告没有生产复现或失败日志。 |
| `env.ASSETS` | ⚠️ 不能直接替换 | 当前配置没有 `assets.binding: "ASSETS"`，dry-run 亦显示 `No bindings found`；仅将 `fetch(request)` 改为 `env.ASSETS.fetch(request)` 会引入未定义绑定风险。 |

### 1.2 对原部署结论的更正

1. **撤销 P0：`src/worker.js` 透传导致整站回环/不可达。**
   - `src/worker.js` 确实包含 `return fetch(request)`，但配置同时启用了 Workers Static Assets。对首页、已存在的 JS/CSS/图片等正常应用请求，静态资产层先处理；SPA 导航由资产回退处理。
   - 未命中的非导航请求是否受 Worker `fetch()` 行为影响，需要结合真实路由、origin 和生产日志验证。没有该证据时，不能认定整站 500，也不能标为 SSRF 或开放代理漏洞。
   - 如果未来需要 Worker 处理动态路由，应先显式配置 `assets.binding: "ASSETS"`，再以预览环境验证 `env.ASSETS.fetch(request)`；本次不建议仅据静态推断修改 Worker。

2. **撤销 P1：`public/_headers` 使用 C 风格注释、必须改为 `#`。**
   - 文件第一行 `/*` 是 Cloudflare 的路径模式，后续行是该路径的响应头；文件中不存在 `/* ... */` 注释。
   - 当前 dry-run 已证明该产物可被 Wrangler 读取。历史的裸通配符配置问题已在此前提交中修复为以 `/` 开头的路径模式，不能把历史故障重新归因到当前文件。
   - CSP、HSTS 等属于可评估的安全策略；它们不是当前 `_headers` 格式错误，也没有证据表明缺失会使当前发布失败。

3. **更正日期判断。** `compatibility_date: "2026-07-03"` 在本报告日期 2026-07-28 时是过去日期，不是未来日期。

### 1.3 发布与回滚的正确边界

- 根目录的 Cloudflare 命令为 `npm run deploy:cf`；GitHub Pages 的 `deploy` 脚本定义在 `03_Web_Rebuild/package.json`，不能在根目录直接执行 `npm run deploy`。
- `wrangler rollback` 可作为已发布 Workers 版本的首选回滚方式。若要从历史代码重建，必须先检出对应提交或 tag，再构建和部署；“覆盖旧 dist 后重新 build”会覆盖该旧 dist，不能构成回滚。
- GitHub Pages 是独立站点，不会自动接管 Cloudflare 流量；除非存在已验证的 DNS/路由切换方案，否则不能作为即时切流预案。

---

## 2. 代码与发布发现（按真实优先级）

| 优先级 | 发现 | 复核结论 | 建议 |
|---|---|---|---|
| P2 | `CHANGELOG.md` 的 v1.0.7 条目包含 `v1.0.6..HEAD` 之外的教程/移动端改动 | ✅ 成立 | 发版前仅保留当前热修复实际涉及的智脑事件清理与讣告门控等改动。 |
| P2 | `runAIBrain` 的 `currentEvent` 修复没有针对性回归断言 | ✅ 成立，但当前全量测试通过 | 增加事件 action 不调用 `applyEventEffect` 时，`currentEvent === null` 且 `hasEvent === false` 的回归用例。 |
| P2 | `reconcilePersonDeaths` 对同年死亡角色的讣告条件可能在多次结算中重复触发 | ⚠️ 值得补集成测试 | 用真实 `runARound` 路径验证后再决定是否增加已播报标记。 |
| P3 | `vite.config.ts` 启用 sourcemap，产物中存在 `.map` 文件 | ✅ 成立 | 按调试需求与公开源码策略决定是否在生产构建关闭或限制访问。 |
| P3 | 多处 `innerHTML` 拼接与本地存档数据并存 | ⚠️ 安全加固项，未证明外部攻击链 | 先明确存档导入、同源脚本与用户数据的威胁模型；对可外部控制文本优先使用 `textContent` 或统一转义。 |
| P3 | 遥测 payload 的版本号仍为 `0.9.0-beta` | ✅ 代码陈旧，但当前端点为空会提前返回 | 启用遥测前同步版本号；不作为当前线上信息泄露。 |
| P3 | CI 使用未锁定的 Tauri CLI | ✅ 供应链可改进项 | 后续将 CLI 与 Actions 固定到审查过的版本/提交。 |

**不纳入本次上线阻断的事项：** Tauri 专项安全评审、严格 CSP 迁移、localStorage 兼容层收敛、全量 innerHTML 重构、遥测启用设计。它们需要单独范围和测试，不能在没有攻击链或运行时失败证据时替代当前发布结论。

---

## 3. 发布前最小验证清单

1. 保持现有部署配置不因本报告的已撤销结论而修改。
2. 对当前生产或 preview 地址验证：首页加载、任一深链刷新、`/assets/*`、Service Worker 更新与关键安全头。
3. 若部署日志出现新的 Cloudflare 错误，以该次完整日志和涉及的实际文件为准，再进行针对性修复。
4. 发布说明与 `v1.0.6..HEAD` diff 对齐。

---

## 4. 验证记录与局限

- 已执行：`npm test`、`npm run typecheck`、`npm run lint`（均成功）；Cloudflare 静态资产 dry-run（成功）。
- 未执行：真实生产部署、生产 URL 浏览器检查、线上安全头抓取、在线 CVE 扫描、Tauri 桌面端安全评审。
- 因此，本报告确认“当前本地不存在所述 Cloudflare 配置阻断”，但不把本地成功描述为新的生产发布成功。

---

> 本报告为对 2026-07-28 原审计结论的证据化修订。此前关于 Worker 整站回环、`_headers` 注释格式错误、`env.ASSETS` 单行修复、未来兼容日期，以及 GitHub Pages 自动切流的描述均不应继续作为发布决策依据。
