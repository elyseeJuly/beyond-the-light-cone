import { GameInstance } from "../core/Game";
import { personSelectPanel } from "./PersonSelectPanel";
import { getImageUrl } from "../utils/assetUrl";

export class WallfacerPanel {
  private get modal(): HTMLElement { return document.getElementById("modal-container")!; }
  private get title(): HTMLElement { return document.getElementById("modal-title")!; }
  private get content(): HTMLElement { return document.getElementById("modal-content")!; }

  constructor() {
    // Lazy access
  }

  public open() {
    this.title.textContent = "面壁计划与执剑人控制台";
    this.modal.classList.remove("hidden");
    this.render();
  }

  private render() {
    const game = GameInstance.get();
    const earth = game.earthCivi;

    // 面壁者列表渲染
    let wallfacersHtml = "";
    earth.wallfacers.forEach(name => {
      const p = game.personManager.getPerson(name);
      const avatarUrl = p?.faceFile ? getImageUrl(p.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:1px solid var(--color-primary);margin-right:12px;" />`
        : `<div style="width:32px;height:32px;border-radius:50%;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:0.8rem;margin-right:12px;">${name[0]}</div>`;

      wallfacersHtml += `
        <div style="padding: 8px 16px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; display: flex; align-items: center; margin-bottom: 8px;">
          ${avatarHtml}
          <div style="flex: 1; display: flex; justify-content: space-between; align-items: center;">
            <span style="color: var(--text-primary); font-weight: bold;">${name}</span>
            <span style="color: var(--text-secondary); font-size: 0.9rem;">(建立效率: ${(p?.leadership || 0) + (p?.art || 0)})</span>
            <button class="btn-glass btn-remove-wallfacer" data-name="${name}" style="padding: 4px 8px; border-color: #E65100; color: #E65100;">撤销</button>
          </div>
        </div>
      `;
    });

    if (earth.wallfacers.size < 4) {
      wallfacersHtml += `
        <button class="btn-primary" id="btn-add-wallfacer" style="width: 100%; padding: 12px; margin-top: 8px;">
          ➕ 选定新面壁者 (${earth.wallfacers.size}/4)
        </button>
      `;
    }

    // 执剑人渲染
    let swordholderHtml = "";
    if (earth.swordholder) {
      const sh = game.personManager.getPerson(earth.swordholder);
      const avatarUrl = sh?.faceFile ? getImageUrl(sh.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--color-primary);margin-bottom:12px;" />`
        : `<div style="width:80px;height:80px;border-radius:50%;background:var(--color-primary-glass);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--color-primary);margin:0 auto 12px;">${earth.swordholder[0]}</div>`;

      swordholderHtml = `
        <div style="padding: 16px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; text-align: center;">
          ${avatarHtml}
          <h3 style="color: var(--color-primary); margin: 0 0 8px 0;">现任执剑人: ${earth.swordholder}</h3>
          <p style="color: var(--text-secondary); margin: 0 0 12px 0;">该执剑人的威慑度评估为: <b style="color: var(--text-primary);">${sh?.leadership || 0}%</b></p>
          <button class="btn-glass" id="btn-change-swordholder">更换执剑人</button>
        </div>
      `;
    } else {
      swordholderHtml = `
        <div style="padding: 16px; background: var(--border-glass); border: 1px dashed var(--border-glass-strong); border-radius: 8px; text-align: center;">
          <p style="color: var(--text-secondary); margin: 0 0 12px 0;">当前未设立执剑人，地球时刻面临异星打击风险。</p>
          <button class="btn-primary" id="btn-change-swordholder">设立执剑人</button>
        </div>
      `;
    }

    this.content.innerHTML = `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
        <!-- 左侧：面壁者 -->
        <div>
          <h3 style="color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">
            面壁计划
          </h3>
          <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;">
            面壁者不需要向外界解释自己的计划。他们的高维属性将隐性地快速累加地球的威慑值。
          </p>
          ${wallfacersHtml}
        </div>

        <!-- 右侧：执剑人与威慑 -->
        <div>
          <h3 style="color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">
            黑暗森林威慑
          </h3>
          <div style="margin-bottom: 24px;">
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px;">当前文明威慑值积累：</p>
            <div style="width: 100%; height: 8px; background: var(--border-glass); border-radius: 4px; overflow: hidden;">
              <div style="width: ${Math.min(earth.deterrenceValue, 100)}%; height: 100%; background: var(--color-primary); transition: width 0.3s;"></div>
            </div>
            <p style="text-align: right; color: var(--color-primary); font-size: 0.8rem; margin-top: 4px;">${Math.floor(earth.deterrenceValue)} / 100</p>
          </div>
          
          ${swordholderHtml}

          <!-- 终极广播按钮 -->
          <div style="margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(231, 76, 60, 0.3); text-align: center;">
            <button class="btn-primary" id="btn-broadcast" style="background: rgba(231, 76, 60, 0.1); border-color: #E74C3C; color: #E74C3C; width: 100%;">
              ⚠️ 广播宇宙坐标 (终极威慑)
            </button>
            <p style="color: var(--color-danger); font-size: 0.8rem; margin-top: 8px;">一旦按下，太阳系坐标将暴露，敌我双方将共同走向毁灭。</p>
          </div>
        </div>
      </div>
    `;

    this.bindEvents(game, earth);
  }

  private bindEvents(game: any, earth: any) {
    const btnAddWallfacer = document.getElementById("btn-add-wallfacer");
    if (btnAddWallfacer) {
      btnAddWallfacer.addEventListener("click", () => {
        personSelectPanel.open("wallfacer", (name) => {
          earth.addWallfacer(name);
          game.personManager.availablePersons.delete(name);
          this.render();
        });
      });
    }

    const removeBtns = document.querySelectorAll(".btn-remove-wallfacer");
    removeBtns.forEach(btn => {
      btn.addEventListener("click", (e) => {
        const name = (e.currentTarget as HTMLElement).getAttribute("data-name");
        if (name) {
          earth.removeWallfacer(name);
          game.personManager.availablePersons.add(name);
          this.render();
        }
      });
    });

    const btnChangeSwordholder = document.getElementById("btn-change-swordholder");
    if (btnChangeSwordholder) {
      btnChangeSwordholder.addEventListener("click", () => {
        personSelectPanel.open("swordholder", (name) => {
          if (earth.swordholder) {
            game.personManager.availablePersons.add(earth.swordholder);
          }
          earth.setSwordholder(name);
          game.personManager.availablePersons.delete(name);
          this.render();
        });
      });
    }

    const btnBroadcast = document.getElementById("btn-broadcast");
    if (btnBroadcast) {
      btnBroadcast.addEventListener("click", () => {
        if (confirm("警告：您确定要广播宇宙坐标吗？游戏将以双方毁灭告终！")) {
          const game = GameInstance.get();
          const tm = earth.tecTreeManager;
          const survives = tm.isTecFinishedAnywhere("黑域生成") || 
                           tm.isTecFinishedAnywhere("数字方舟") || 
                           tm.isTecFinishedAnywhere("新家园选址") ||
                           game.hasFlag("galaxy_exodus_seen") || 
                           game.hasFlag("wandering_completed");

          game.broadcastTriggered = true;
          game.broadcastSurvives = survives;
          
          // Close the modal container first so it doesn't block ending screen rendering
          const modal = document.getElementById("modal-container");
          if (modal) modal.classList.add("hidden");
          
          game.checkVictoryConditions();
        }
      });
    }
  }
}

export const wallfacerPanel = new WallfacerPanel();
