import { TecTreeType } from "../types/enums";
import { GameInstance } from "../core/Game";

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
      this.container.innerHTML = `<p style="color: red;">该科技树尚未初始化。</p>`;
      return;
    }

    let html = `<div class="tech-tree-grid">`;
    
    // 扁平化展示所有节点
    tree.nodes.forEach((node, name) => {
      let statusClass = "";
      if (node.finished) statusClass = "finished";
      else if (node.inResearch) statusClass = "researching";

      const progress = node.finished ? 100 : (node.currentWorkload / node.totalWorkload) * 100;

      html += `
        <div class="tech-node ${statusClass}" data-tech="${name}" data-tutorial-id="tech-node-${name}">
          <h4>${name}</h4>
          <p>前置: ${node.parentName || '无'}</p>
          <p>花费: ${node.cost} | 总量: ${node.totalWorkload}</p>
          <div class="progress-bar-bg">
            <div class="progress-bar-fill" style="width: ${progress}%"></div>
          </div>
          <p style="margin-top: 8px; font-size: 0.75rem;">${node.tip}</p>
        </div>
      `;
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
        alert("前置科技尚未完成！");
        return;
      }
    }

    // 开始研发
    if (!node.inResearch) {
      if (game.earthCivi.economy >= node.cost) {
        game.earthCivi.economy -= node.cost;
        node.inResearch = true;
        this.render(this.container, type); // Re-render
      } else {
        alert("经济不足！");
      }
    }
  }
}
