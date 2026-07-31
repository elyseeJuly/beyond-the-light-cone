import { TecTreeType } from "../types/enums";
import { GameInstance } from "../core/Game";
import { t } from "../utils/i18n";

export class TecTreeView {
  private container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  public render(container: HTMLElement, type: TecTreeType) {
    this.container = container;
    const game = GameInstance.get();
    const tree = game.earthCivi.tecTreeManager.trees.get(type);

    if (!tree) {
      this.container.innerHTML = t("<p style=\"color: red;\">{param0}</p>", { param0: t("该科技树尚未初始化。") });
      return;
    }

    let html = `<div class="tech-tree-grid">`;
    
    // 扁平化展示所有节点
    tree.nodes.forEach((node, name) => {
      let statusClass = "";
      if (node.finished) statusClass = "finished";
      else if (node.inResearch) statusClass = "researching";

      const progress = node.finished ? 100 : (node.currentWorkload / node.totalWorkload) * 100;

      html += t("\n        <div class=\"tech-node {param0}\" data-tech=\"{param1}\" data-tutorial-id=\"tech-node-{param2}\">\n          <h4>{param3}</h4>\n          <p>{param4}: {param5}</p>\n          <p>{param6}: {param7} | {param8}: {param9}</p>\n          <div class=\"progress-bar-bg\">\n            <div class=\"progress-bar-fill\" style=\"width: {param10}%\"></div>\n          </div>\n          <p style=\"margin-top: 8px; font-size: 0.75rem;\">{param11}</p>\n        </div>\n      ", { param0: statusClass, param1: name, param2: name, param3: t(name), param4: t("前置"), param5: t(node.parentName || t("无")), param6: t("花费"), param7: node.cost, param8: t("总量"), param9: node.totalWorkload, param10: progress, param11: t(node.tip) });
    });

    html += `</div>`;
    this.container.innerHTML = html;

    // 绑定点击事件
    const nodes = this.container.querySelectorAll(".tech-node");
    nodes.forEach(nodeEl => {
      nodeEl.addEventListener("click", (e) => {
        const techName = (e.currentTarget as HTMLElement).getAttribute("data-tech");
        if (techName) this.handleNodeClick(type, techName);
      });
    });
  }

  private handleNodeClick(type: TecTreeType, name: string) {
    const game = GameInstance.get();
    const tree = game.earthCivi.tecTreeManager.trees.get(type);
    if (!tree) return;
    
    const node = tree.nodes.get(name);
    if (!node || node.finished) return;

    // 简单的前置检查
    if (node.parentName) {
      const parent = tree.nodes.get(node.parentName);
      if (!parent || !parent.finished) {
        alert(t("前置科技尚未完成！"));
        return;
      }
    }

    // 开始研发
    if (!node.inResearch) {
      if (game.earthCivi.economy >= node.cost) {
        // 依据 SPEC_20260712_AP_SYSTEM_REDESIGN：指派科研消耗 20 AP（AI 模式半价）
        const apOk = game.earthCivi.setResearchTarget(type, name, true);
        if (!apOk) {
          alert(t("执政指令点不足，无法启动新科研！"));
          return;
        }
        game.earthCivi.economy -= node.cost;
        node.inResearch = true;
        this.render(this.container, type); // Re-render
      } else {
        alert(t("经济不足！"));
      }
    }
  }
}
