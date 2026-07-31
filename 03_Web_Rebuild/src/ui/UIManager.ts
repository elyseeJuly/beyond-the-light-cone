import { GameInstance } from "../core/Game";
import { StarMapRenderer } from "./StarMapRenderer";
import { MainLayout } from "./MainLayout";
import { Star } from "../core/Star";
import { DepartmentPanel } from "./DepartmentPanel";
import { wallfacerPanel } from "./WallfacerPanel";
import { createFleet } from "../core/Fleet";
import { t } from "../utils/i18n";

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
              this.deptPanel.open(deptType, target.textContent || t("部门"));
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
    const epochNames = [t("黄金岁月"), t("危机纪元"), t("威慑纪元"), t("广播纪元"), t("掩体纪元"), t("银河纪元"), t("星屑纪元")];
    const epochStr = epochNames[game.getEpoch()] || t("未知纪元");
    
    this.setText("ui-epoch", t("{param0} {param1} 年", { param0: epochStr, param1: game.getYear() }));
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
    const isEarth = star.belongToCivi === t("地球");

    let html = t("\n      <div style=\"margin-bottom: 12px;\">\n        <span style=\"color: var(--text-accent)\">{param4}:</span> \n        <span style=\"color: {param0}\">{param1}</span>\n      </div>\n      <div style=\"margin-bottom: 12px;\">\n        <span style=\"color: var(--text-accent)\">{param5}:</span> {param2}\n      </div>\n      <div style=\"margin-bottom: 12px;\">\n        <span style=\"color: var(--text-accent)\">{param6}:</span> {param3}\n      </div>\n    ", { 
      param0: isEarth ? '#00E5FF' : '#fff', 
      param1: star.belongToCivi || t("无"), 
      param2: star.totalResource, 
      param3: star.populationLimit,
      param4: t("所属"),
      param5: t("资源总量"),
      param6: t("人口限制")
    });

    if (isEarth) {
      html += t("\n        <div style=\"margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;\">\n          <h4 style=\"color: var(--text-secondary); margin: 0 0 8px 0;\">{param6}</h4>\n          <div style=\"display: flex; flex-direction: column; gap: 8px;\">\n            <button class=\"btn-glass\" id=\"btn-build-stope\" style=\"width: 100%; text-align: left; {param0}\">\n              {param1} {param7}\n            </button>\n            <button class=\"btn-glass\" id=\"btn-build-factory\" style=\"width: 100%; text-align: left; {param2}\">\n              {param3} {param8}\n            </button>\n            <button class=\"btn-glass\" id=\"btn-build-city\" style=\"width: 100%; text-align: left; {param4}\">\n              {param5} {param9}\n            </button>\n          </div>\n        </div>\n\n        <div style=\"margin-top: 20px; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 12px;\">\n          <h4 style=\"color: var(--text-secondary); margin: 0 0 8px 0;\">{param10}</h4>\n          <div style=\"display: flex; flex-direction: column; gap: 8px;\">\n            <button class=\"btn-primary\" id=\"btn-build-fleet\" style=\"width: 100%; padding: 8px;\">{param11}</button>\n            <button class=\"btn-glass\" id=\"btn-dispatch-fleet\" style=\"width: 100%; border-color: #FF5500; color: #FF5500;\">\n              {param12}\n            </button>\n          </div>\n        </div>\n      ", { 
        param0: star.hasStope ? 'color: #00E5FF;' : '', 
        param1: star.hasStope ? '✅' : '➕', 
        param2: star.hasFactory ? 'color: #00E5FF;' : '', 
        param3: star.hasFactory ? '✅' : '➕', 
        param4: star.hasCity ? 'color: #00E5FF;' : '', 
        param5: star.hasCity ? '✅' : '➕',
        param6: t("行星设施"),
        param7: t("采矿场"),
        param8: t("加工厂"),
        param9: t("太空城市"),
        param10: t("军工与舰队"),
        param11: t("建造恒星级战舰 (10 艘)"),
        param12: t("🚀 组建并派遣第一舰队")
      });
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
            game.addHistory(t("在 {param0} 开始建造恒星级战舰 10 艘！", { param0: star.name }));
            this.updateUI();
          } else {
            alert(t("经济不足 100 点！"));
          }
        });

        document.getElementById("btn-dispatch-fleet")?.addEventListener("click", () => {
          // 组建舰队向目标出击（这里简单演示写死派往木星 index=5）
          const fleet = createFleet(t("地球第一舰队"), t("地球"), star.index, 5, 3);
          // 舰队统帅假设选章北海 (如果有的话，没有就是null)
          fleet.leaderName = t("章北海");
          // 加入刚才建造的武器
          fleet.weapons.push({ weaponName: t("恒星级战舰"), currentBuild: 10 });
          
          game.earthCivi.fleets.push(fleet);
          game.addHistory(t("【出征】组建 {param0} 离开 {param1}，目标木星，预计 3 回合后抵达。", { param0: fleet.name, param1: star.name }));
        });
      }
    }
  }

  private setText(id: string, text: string) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
}
