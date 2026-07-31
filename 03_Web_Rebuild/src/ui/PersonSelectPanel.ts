import { GameInstance } from "../core/Game";
import { getImageUrl } from "../utils/assetUrl";
import { t } from "../utils/i18n";

export class PersonSelectPanel {
  private container: HTMLElement;
  private mounted: boolean = false;
  private onSelectCallback: ((personName: string) => void) | null = null;
  private sortCriteria: string = "";

  constructor() {
    // 创建一个专用的 DOM 容器插入 body
    this.container = document.createElement("div");
    this.container.id = "person-select-modal";
    this.container.className = "modal-overlay hidden";
    this.container.style.zIndex = "2000"; // 比部门面板高一层
    
    this.container.innerHTML = t("\n      <div class=\"modal-box glass-panel\" style=\"max-width: 800px; height: 70vh;\">\n        <div class=\"modal-header\">\n          <h2>{param0}</h2>\n          <button class=\"btn-close\" id=\"btn-person-modal-close\">&times;</button>\n        </div>\n        <div class=\"modal-content\" id=\"person-list-content\">\n          <!-- Person list renders here -->\n        </div>\n      </div>\n    ", { param0: t("指派人员") });
    
    const btnClose = this.container.querySelector("#btn-person-modal-close");
    if (btnClose) {
      btnClose.addEventListener("click", () => this.close());
    }
  }

  public open(sortCriteria: string, onSelect: (personName: string) => void) {
    if (!this.mounted) {
      document.body.appendChild(this.container);
      this.mounted = true;
    }
    this.sortCriteria = sortCriteria;
    this.onSelectCallback = onSelect;
    this.container.classList.remove("hidden");
    this.render();
  }

  public close() {
    this.container.classList.add("hidden");
    this.onSelectCallback = null;
  }

  private render() {
    const game = GameInstance.get();
    const content = this.container.querySelector("#person-list-content");
    if (!content) return;

    const availableNames = Array.from(game.personManager.availablePersons);
    
    if (availableNames.length === 0) {
      content.innerHTML = t("<p style=\"color: var(--text-secondary);\">{param0}</p>", { param0: t("当前没有可用的自由人员。") });
      return;
    }

    const availablePersons = availableNames.map(name => game.personManager.getPerson(name)).filter(p => p !== undefined && p.isAlive);

    availablePersons.sort((a: any, b: any) => {
      let scoreA = 0;
      let scoreB = 0;
      switch (this.sortCriteria) {
        case "0": // ECONOMY
          scoreA = a.economy; scoreB = b.economy; break;
        case "1": // ARMY
        case "6": // SPACEFIGHT
          scoreA = a.army; scoreB = b.army; break;
        case "8": // ASTROPHYSICS
        case "5": // NUCLEAR
        case "7": // PROTON
        case "10": // ECONOMYTEC
        case "9": // CULTURETEC
          scoreA = a.science; scoreB = b.science; break;
        case "2": // CULTURE
          scoreA = a.social; scoreB = b.social; break;
        case "3": // HUMANRES
          scoreA = a.leadership; scoreB = b.leadership; break;
        case "wallfacer":
          scoreA = a.leadership + a.art; scoreB = b.leadership + b.art; break;
        case "swordholder":
          scoreA = a.leadership; scoreB = b.leadership; break;
        default: break;
      }
      return scoreB - scoreA;
    });

    let html = `<div style="display: flex; flex-direction: column; gap: 12px;">`;
    
    availablePersons.forEach((p: any, index: number) => {
      if (!p) return;

      const isTopChoice = index === 0 && this.sortCriteria !== "";
      const topBadgeHtml = isTopChoice ? t("<span style=\"background: var(--color-primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 8px;\">{param0}</span>", { param0: t("最适合") }) : "";

      const avatarUrl = p.faceFile ? getImageUrl(p.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--color-primary);margin-right:12px;" />`
        : `<div style="width:48px;height:48px;border-radius:50%;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-right:12px;">${(t(p.name) || '?')[0]}</div>`;

      html += t("\n        <div class=\"person-card\" data-name=\"{param0}\" style=\"\n          display: flex; justify-content: space-between; align-items: center; \n          padding: 12px; background: var(--border-glass); border: 1px solid var(--border-glass-strong);\n          border-radius: 8px; cursor: pointer; transition: all 0.2s;\">\n          \n          <div style=\"display: flex; align-items: center; flex: 1;\">\n            {param1}\n            <div>\n              <h4 style=\"margin: 0 0 8px 0; color: var(--color-primary); display: flex; align-items: center;\">\n                {param2} {param3}\n              </h4>\n              <div style=\"display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.8rem; color: var(--text-secondary);\">\n                <span>{param4}: <b style=\"color:var(--text-primary)\">{param5}</b></span>\n                <span>{param6}: <b style=\"color:var(--text-primary)\">{param7}</b></span>\n                <span>{param8}: <b style=\"color:var(--text-primary)\">{param9}</b></span>\n                <span>{param10}: <b style=\"color:var(--text-primary)\">{param11}</b></span>\n              </div>\n            </div>\n          </div>\n          \n          <button class=\"btn-primary\" style=\"padding: 8px 16px; font-size: 0.9rem;\">{param12}</button>\n        </div>\n      ", { param0: p.name, param1: avatarHtml, param2: t(p.name), param3: topBadgeHtml, param4: t("科研"), param5: p.science, param6: t("领导"), param7: p.leadership, param8: t("经济"), param9: p.economy, param10: t("军事"), param11: p.army, param12: t("任命") });
    });

    html += `</div>`;
    content.innerHTML = html;

    // 绑定事件
    const cards = content.querySelectorAll(".person-card");
    cards.forEach(card => {
      card.addEventListener("click", (e) => {
        const name = (e.currentTarget as HTMLElement).getAttribute("data-name");
        if (name && this.onSelectCallback) {
          this.onSelectCallback(name);
          this.close();
        }
      });
      // 添加 Hover 效果
      card.addEventListener("mouseenter", (e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--color-primary-glass)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--color-primary)";
      });
      card.addEventListener("mouseleave", (e) => {
        (e.currentTarget as HTMLElement).style.background = "var(--border-glass)";
        (e.currentTarget as HTMLElement).style.borderColor = "var(--border-glass-strong)";
      });
    });
  }
}

// 导出一个全局单例
export const personSelectPanel = new PersonSelectPanel();
