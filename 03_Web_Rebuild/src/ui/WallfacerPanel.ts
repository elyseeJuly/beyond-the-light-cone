import { GameInstance } from "../core/Game";
import { personSelectPanel } from "./PersonSelectPanel";
import { getImageUrl } from "../utils/assetUrl";
import { t } from "../utils/i18n";

export class WallfacerPanel {
  private get modal(): HTMLElement { return document.getElementById("modal-container")!; }
  private get title(): HTMLElement { return document.getElementById("modal-title")!; }
  private get content(): HTMLElement { return document.getElementById("modal-content")!; }

  constructor() {
    // Lazy access
  }

  public open() {
    this.title.textContent = t("面壁计划与执剑人控制台");
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
        : `<div style="width:32px;height:32px;border-radius:50%;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:0.8rem;margin-right:12px;">${(t(name) || '?')[0]}</div>`;

      wallfacersHtml += t("\n        <div style=\"padding: 8px 16px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; display: flex; align-items: center; margin-bottom: 8px;\">\n          {param0}\n          <div style=\"flex: 1; display: flex; justify-content: space-between; align-items: center;\">\n            <span style=\"color: var(--text-primary); font-weight: bold;\">{param1}</span>\n            <span style=\"color: var(--text-secondary); font-size: 0.9rem;\">({param2}: {param3})</span>\n            <button class=\"btn-glass btn-remove-wallfacer\" data-name=\"{param4}\" style=\"padding: 4px 8px; border-color: #E65100; color: #E65100;\">{param5}</button>\n          </div>\n        </div>\n      ", { param0: avatarHtml, param1: t(name), param2: t("建立效率"), param3: (p?.leadership || 0) + (p?.art || 0), param4: name, param5: t("撤销") });
    });

    if (earth.wallfacers.size < 4) {
      wallfacersHtml += t("\n        <button class=\"btn-primary\" id=\"btn-add-wallfacer\" style=\"width: 100%; padding: 12px; margin-top: 8px;\">\n          ➕ {param0} ({param1}/4)\n        </button>\n      ", { param0: t("选定新面壁者"), param1: earth.wallfacers.size });
    }

    // 执剑人渲染
    let swordholderHtml = "";
    if (earth.swordholder) {
      const sh = game.personManager.getPerson(earth.swordholder);
      const avatarUrl = sh?.faceFile ? getImageUrl(sh.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:3px solid var(--color-primary);margin-bottom:12px;" />`
        : `<div style="width:80px;height:80px;border-radius:50%;background:var(--color-primary-glass);display:flex;align-items:center;justify-content:center;font-size:2rem;color:var(--color-primary);margin:0 auto 12px;">${(t(earth.swordholder) || '?')[0]}</div>`;

      swordholderHtml = t("\n        <div style=\"padding: 16px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; text-align: center;\">\n          {param0}\n          <h3 style=\"color: var(--color-primary); margin: 0 0 8px 0;\">{param1}: {param2}</h3>\n          <p style=\"color: var(--text-secondary); margin: 0 0 12px 0;\">{param3}: <b style=\"color: var(--text-primary);\">{param4}%</b></p>\n          <button class=\"btn-glass\" id=\"btn-change-swordholder\">{param5}</button>\n        </div>\n      ", { param0: avatarHtml, param1: t("现任执剑人"), param2: t(earth.swordholder), param3: t("该执剑人的威慑度评估为"), param4: sh?.leadership || 0, param5: t("更换执剑人") });
    } else {
      swordholderHtml = t("\n        <div style=\"padding: 16px; background: var(--border-glass); border: 1px dashed var(--border-glass-strong); border-radius: 8px; text-align: center;\">\n          <p style=\"color: var(--text-secondary); margin: 0 0 12px 0;\">{param0}</p>\n          <button class=\"btn-primary\" id=\"btn-change-swordholder\">{param1}</button>\n        </div>\n      ", { param0: t("当前未设立执剑人，地球时刻面临异星打击风险。"), param1: t("设立执剑人") });
    }

    this.content.innerHTML = t("\n      <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 24px;\">\n        <!-- Left: Wallfacers -->\n        <div>\n          <h3 style=\"color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;\">\n            {param0}\n          </h3>\n          <p style=\"color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px;\">\n            {param1}\n          </p>\n          {param2}\n        </div>\n\n        <!-- Right: Swordholder and Deterrence -->\n        <div>\n          <h3 style=\"color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;\">\n            {param3}\n          </h3>\n          <div style=\"margin-bottom: 24px;\">\n            <p style=\"color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 8px;\">{param4}</p>\n            <div style=\"width: 100%; height: 8px; background: var(--border-glass); border-radius: 4px; overflow: hidden;\">\n              <div style=\"width: {param5}%; height: 100%; background: var(--color-primary); transition: width 0.3s;\"></div>\n            </div>\n            <p style=\"text-align: right; color: var(--color-primary); font-size: 0.8rem; margin-top: 4px;\">{param6} / 100</p>\n          </div>\n          \n          {param7}\n\n          <!-- Ultimate Broadcast Button -->\n          <div style=\"margin-top: 32px; padding-top: 16px; border-top: 1px solid rgba(231, 76, 60, 0.3); text-align: center;\">\n            <button class=\"btn-primary\" id=\"btn-broadcast\" style=\"background: rgba(231, 76, 60, 0.1); border-color: #E74C3C; color: #E74C3C; width: 100%;\">\n              {param8}\n            </button>\n            <p style=\"color: var(--color-danger); font-size: 0.8rem; margin-top: 8px;\">{param9}</p>\n          </div>\n        </div>\n      </div>\n    ", { 
      param0: t("面壁计划"), 
      param1: t("面壁者不需要向外界解释自己的计划。他们的高维属性将隐性地快速累加地球的威慑值。"), 
      param2: wallfacersHtml, 
      param3: t("黑暗森林威慑"), 
      param4: t("当前文明威慑值积累："), 
      param5: Math.min(earth.deterrenceValue, 100), 
      param6: Math.floor(earth.deterrenceValue), 
      param7: swordholderHtml,
      param8: t("⚠️ 广播宇宙坐标 (终极威慑)"),
      param9: t("一旦按下，太阳系坐标将暴露，敌我双方将共同走向毁灭。")
    });

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
        if (confirm(t("警告：您确定要广播宇宙坐标吗？游戏将以双方毁灭告终！"))) {
          const game = GameInstance.get();
          const tm = earth.tecTreeManager;
          const survives = tm.isTecFinishedAnywhere(t("黑域生成")) || 
                           tm.isTecFinishedAnywhere(t("数字方舟")) || 
                           tm.isTecFinishedAnywhere(t("新家园选址")) ||
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
