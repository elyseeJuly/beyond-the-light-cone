import { GameInstance } from "../core/Game";
import { getImageUrl } from "../utils/assetUrl";

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
    
    this.container.innerHTML = `
      <div class="modal-box glass-panel" style="max-width: 800px; height: 70vh;">
        <div class="modal-header">
          <h2>指派人员</h2>
          <button class="btn-close" id="btn-person-modal-close">&times;</button>
        </div>
        <div class="modal-content" id="person-list-content">
          <!-- Person list renders here -->
        </div>
      </div>
    `;
    
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
      content.innerHTML = `<p style="color: var(--text-secondary);">当前没有可用的自由人员。</p>`;
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
      const topBadgeHtml = isTopChoice ? `<span style="background: var(--color-primary); color: white; padding: 2px 6px; border-radius: 4px; font-size: 0.7rem; font-weight: bold; margin-left: 8px;">最适合</span>` : "";

      const avatarUrl = p.faceFile ? getImageUrl(p.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid var(--color-primary);margin-right:12px;" />`
        : `<div style="width:48px;height:48px;border-radius:50%;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:1.2rem;margin-right:12px;">${p.name[0]}</div>`;

      html += `
        <div class="person-card" data-name="${p.name}" style="
          display: flex; justify-content: space-between; align-items: center; 
          padding: 12px; background: var(--border-glass); border: 1px solid var(--border-glass-strong);
          border-radius: 8px; cursor: pointer; transition: all 0.2s;">
          
          <div style="display: flex; align-items: center; flex: 1;">
            ${avatarHtml}
            <div>
              <h4 style="margin: 0 0 8px 0; color: var(--color-primary); display: flex; align-items: center;">
                ${p.name} ${topBadgeHtml}
              </h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; font-size: 0.8rem; color: var(--text-secondary);">
                <span>科研: <b style="color:var(--text-primary)">${p.science}</b></span>
                <span>领导: <b style="color:var(--text-primary)">${p.leadership}</b></span>
                <span>经济: <b style="color:var(--text-primary)">${p.economy}</b></span>
                <span>军事: <b style="color:var(--text-primary)">${p.army}</b></span>
              </div>
            </div>
          </div>
          
          <button class="btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">任命</button>
        </div>
      `;
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
