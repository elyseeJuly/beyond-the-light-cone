import { t } from "../utils/i18n";

export class MainLayout {
  private container: HTMLElement;

  constructor(containerId: string) {
    const el = document.getElementById(containerId);
    if (!el) throw new Error(`Container #${containerId} not found`);
    this.container = el;
    this.render();
  }

  private render(): void {
    this.container.innerHTML = t("\n      <!-- Top Bar -->\n      <div class=\"top-bar glass-panel\">\n        <div class=\"epoch-display\" id=\"ui-epoch\">{param0}</div>\n        <div class=\"resource-stats\">\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">{param1}</span>\n            <span class=\"stat-value\" id=\"ui-population\">0</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">{param2}</span>\n            <span class=\"stat-value\" id=\"ui-economy\">0</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">{param3}</span>\n            <span class=\"stat-value\" id=\"ui-culture\">0</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">{param4}</span>\n            <span class=\"stat-value\" id=\"ui-army\">0</span>\n          </div>\n          <div class=\"stat-item\">\n            <span class=\"stat-label\">{param5}</span>\n            <span class=\"stat-value\" id=\"top-deterrence\" style=\"color: #FFD700;\">0</span>\n          </div>\n        </div>\n        <div class=\"top-menu\" style=\"display: flex; gap: 8px;\">\n          <button class=\"btn-glass\" id=\"btn-history\">{param6}</button>\n          <button class=\"btn-glass\" id=\"btn-system-menu\" style=\"font-size: 1.2rem; padding: 4px 12px; border-radius: 6px;\">⚙️</button>\n        </div>\n      </div>\n\n      <!-- Star Map Area -->\n      <div class=\"star-map-container\" id=\"star-map-container\">\n        <canvas id=\"star-canvas\"></canvas>\n      </div>\n\n      <!-- Right Panel -->\n      <div class=\"right-panel glass-panel\" id=\"right-panel\">\n        <div class=\"panel-header\" id=\"panel-title\">{param7}</div>\n        <div id=\"panel-content\" style=\"color: var(--text-secondary); font-size: 0.9rem;\">\n          {param8}\n        </div>\n      </div>\n\n      <!-- Bottom Bar -->\n      <div class=\"bottom-bar glass-panel\">\n        <div class=\"dept-controls\" id=\"dept-buttons-container\">\n          <button class=\"btn-glass\" data-dept=\"0\">{param9}</button>\n          <button class=\"btn-glass\" data-dept=\"1\">{param10}</button>\n          <button class=\"btn-glass\" data-dept=\"2\">{param11}</button>\n          <button class=\"btn-glass\" data-dept=\"3\">{param12}</button>\n          <button class=\"btn-glass\" data-dept=\"4\">{param13}</button>\n          <button class=\"btn-glass\" data-dept=\"5\">{param14}</button>\n          <button class=\"btn-glass\" data-dept=\"6\">{param15}</button>\n          <button class=\"btn-glass\" data-dept=\"7\">{param16}</button>\n          <button class=\"btn-glass\" data-dept=\"8\">{param17}</button>\n          <button class=\"btn-glass\" data-dept=\"9\">{param18}</button>\n          <button class=\"btn-glass\" data-dept=\"10\">{param19}</button>\n        </div>\n        <button class=\"btn-primary\" id=\"btn-next-turn\">{param20}</button>\n      </div>\n\n      <!-- Modal Container -->\n      <div id=\"modal-container\" class=\"modal-overlay hidden\">\n        <div class=\"modal-box glass-panel\">\n          <div class=\"modal-header\">\n            <h2 id=\"modal-title\">{param21}</h2>\n            <button class=\"btn-close\" id=\"btn-modal-close\">&times;</button>\n          </div>\n          <div class=\"modal-content\" id=\"modal-content\"></div>\n        </div>\n      </div>\n    ", {
      param0: t("危机纪元 0 年"),
      param1: t("人口"),
      param2: t("经济"),
      param3: t("文化"),
      param4: t("军力"),
      param5: t("威慑"),
      param6: t("历史记录"),
      param7: t("天体信息"),
      param8: t("请在左侧星图中选择天体以查看详情。"),
      param9: t("经济部"),
      param10: t("军事部"),
      param11: t("文化部"),
      param12: t("人力资源部"),
      param13: t("宇宙社会学"),
      param14: t("核技术"),
      param15: t("航天技术"),
      param16: t("质子技术"),
      param17: t("天体物理"),
      param18: t("文化研究所"),
      param19: t("经济研究所"),
      param20: t("下一回合"),
      param21: t("部门面板")
    });
  }
}
