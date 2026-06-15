import { GameInstance } from "../core/Game";
import { StarMapRenderer } from "./StarMapRenderer";
import { MainLayout } from "./MainLayout";
import { Star } from "../core/Star";
import { DepartmentPanel } from "./DepartmentPanel";
import { wallfacerPanel } from "./WallfacerPanel";
import { createFleet } from "../core/Fleet";

export class UIManager {
  private starMap: StarMapRenderer;
  private deptPanel: DepartmentPanel;

  constructor(containerId: string) {
    new MainLayout(containerId); // Initializes the DOM layout
    this.starMap = new StarMapRenderer("star-canvas");
    this.deptPanel = new DepartmentPanel();

    this.bindEvents();
    this.start();
  }

  private bindEvents() {
    const game = GameInstance.get();

    // Bind "Next Turn" button
    const btnNext = document.getElementById("btn-next-turn");
    if (btnNext) {
      btnNext.addEventListener("click", () => {
        game.runARound();
        this.updateUI();
      });
    }

    // BUG-15 Fix: Bind history button
    document.getElementById("btn-history")?.addEventListener("click", () => {
      const logs = GameInstance.get().historyLogs;
      alert(logs.slice(-20).join("\n")); 
    });

    // Bind Star Click
    this.starMap.onStarClick = (star: Star) => {
      this.updateRightPanel(star);
    };

    // Bind Department Buttons
    const deptContainer = document.getElementById("dept-buttons-container");
    if (deptContainer) {
      deptContainer.addEventListener("click", (e) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains("btn-glass")) {
          const deptTypeStr = target.getAttribute("data-dept");
          if (deptTypeStr) {
            const deptType = parseInt(deptTypeStr, 10);
            // 部门 4 是宇宙社会学，将其专属重定向为面壁计划面板
            if (deptType === 4) {
              wallfacerPanel.open();
            } else {
              this.deptPanel.open(deptType, target.textContent || "部门");
            }
          }
        }
      });
    }

    // Bind System Menu
    document.getElementById("btn-system-menu")?.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("open-settings"));
    });

    // Listen to load game event
    window.addEventListener("game-loaded", () => {
      this.updateUI();
      // Optional: re-attach rendering loop if needed, but requestAnimationFrame is running globally.
    });
  }

  public start() {
    const game = GameInstance.get();
    
    // We only load the Solar System stars for now (index 1 to 8 + 0 as Moon/Base)
    const solarStars = game.starManager.getAllStars().filter(s => s.index <= 8);
    this.starMap.initStars(solarStars);
    
    this.starMap.start();
    this.updateUI();
  }

  private updateUI() {
    const game = GameInstance.get();
    const earth = game.earthCivi;

    // Update Top Bar Stats
    const epochNames = ["危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元"];
    const epochStr = epochNames[game.getEpoch()] || "未知纪元";
    
    this.setText("ui-epoch", `${epochStr} ${game.getYear()} 年`);
    this.setText("ui-population", earth.population.toString());
    this.setText("ui-economy", earth.economy.toString());
    this.setText("ui-culture", earth.culture.toString());
    // BUG-11 Fix: Show fleet count as army
    this.setText("ui-army", earth.fleets.length.toString());
    // BUG-10 Fix: Show deterrence value
    this.setText("top-deterrence", Math.floor(earth.deterrenceValue).toString());
  }

  private updateRightPanel(star: Star) {
    this.setText("panel-title", star.name);
    
    const game = GameInstance.get();
    const isEarth = star.belongToCivi === "地球";

    let html = `
      <div style="margin-bottom: 12px;">
        <span style="color: var(--text-accent)">所属:</span> 
        <span style="color: ${isEarth ? '#00E5FF' : '#fff'}">${star.belongToCivi || "无"}</span>
      </div>
      <div style="margin-bottom: 12px;">
        <span style="color: var(--text-accent)">资源总量:</span> ${star.totalResource}
      </div>
      <div style="margin-bottom: 12px;">
        <span style="color: var(--text-accent)">人口限制:</span> ${star.populationLimit}
      </div>
    `;

    if (isEarth) {
      html += `
        <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
          <h4 style="color: var(--text-secondary); margin: 0 0 8px 0;">行星设施</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-glass" id="btn-build-stope" style="width: 100%; text-align: left; ${star.hasStope ? 'color: #00E5FF;' : ''}">
              ${star.hasStope ? '✅' : '➕'} 采矿场
            </button>
            <button class="btn-glass" id="btn-build-factory" style="width: 100%; text-align: left; ${star.hasFactory ? 'color: #00E5FF;' : ''}">
              ${star.hasFactory ? '✅' : '➕'} 加工厂
            </button>
            <button class="btn-glass" id="btn-build-city" style="width: 100%; text-align: left; ${star.hasCity ? 'color: #00E5FF;' : ''}">
              ${star.hasCity ? '✅' : '➕'} 太空城市
            </button>
          </div>
        </div>

        <div style="margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;">
          <h4 style="color: var(--text-secondary); margin: 0 0 8px 0;">军工与舰队</h4>
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <button class="btn-primary" id="btn-build-fleet" style="width: 100%; padding: 8px;">建造恒星级战舰 (10 艘)</button>
            <button class="btn-glass" id="btn-dispatch-fleet" style="width: 100%; border-color: #FF5500; color: #FF5500;">
              🚀 组建并派遣第一舰队
            </button>
          </div>
        </div>
      `;
    }

    const content = document.getElementById("panel-content");
    if (content) {
      content.innerHTML = html;
      
      // Bind build actions
      if (isEarth) {
        document.getElementById("btn-build-stope")?.addEventListener("click", () => {
          if (!star.hasStope) { star.hasStope = true; this.updateRightPanel(star); }
        });
        document.getElementById("btn-build-factory")?.addEventListener("click", () => {
          if (!star.hasFactory) { star.hasFactory = true; this.updateRightPanel(star); }
        });
        document.getElementById("btn-build-city")?.addEventListener("click", () => {
          if (!star.hasCity) { star.hasCity = true; this.updateRightPanel(star); }
        });

        // 军事操作演示绑定
        document.getElementById("btn-build-fleet")?.addEventListener("click", () => {
          if (game.earthCivi.economy >= 100) {
            game.earthCivi.economy -= 100;
            game.addHistory(`在 ${star.name} 开始建造恒星级战舰 10 艘！`);
            this.updateUI();
          } else {
            alert("经济不足 100 点！");
          }
        });

        document.getElementById("btn-dispatch-fleet")?.addEventListener("click", () => {
          // 组建舰队向目标出击（这里简单演示写死派往木星 index=5）
          const fleet = createFleet("地球第一舰队", "地球", star.index, 5, 3);
          // 舰队统帅假设选章北海 (如果有的话，没有就是null)
          fleet.leaderName = "章北海";
          // 加入刚才建造的武器
          fleet.weapons.push({ weaponName: "恒星级战舰", currentBuild: 10 });
          
          game.earthCivi.fleets.push(fleet);
          game.addHistory(`【出征】组建 ${fleet.name} 离开 ${star.name}，目标木星，预计 3 回合后抵达。`);
        });
      }
    }
  }

  private setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}
