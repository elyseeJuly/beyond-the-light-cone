import { DepartmentType } from "../types/enums";
import { GameInstance } from "../core/Game";
import { TecTreeView } from "./TecTreeView";
import { personSelectPanel } from "./PersonSelectPanel";
import { getImageUrl } from "../utils/assetUrl";
import { t } from "../utils/i18n";

export class DepartmentPanel {
  private get modal(): HTMLElement { return document.getElementById("modal-container")!; }
  private get title(): HTMLElement { return document.getElementById("modal-title")!; }
  private get content(): HTMLElement { return document.getElementById("modal-content")!; }
  private currentType: DepartmentType | null = null;
  private tecTreeView: TecTreeView | null = null;

  constructor() {
    // Lazy init — DOM may not be ready yet
  }

  public open(type: DepartmentType, title: string) {
    this.currentType = type;
    this.title.textContent = t(title);
    this.modal.classList.remove("hidden");
    
    // Lazy init TecTreeView
    if (!this.tecTreeView) {
      this.tecTreeView = new TecTreeView(this.content);
    }

    // Bind close button (idempotent)
    const closeBtn = this.modal.querySelector(".btn-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close(), { once: true });
    }
    
    this.render();
  }

  public close() {
    this.modal.classList.add("hidden");
    this.currentType = null;
  }

  private render() {
    if (this.currentType === null) return;
    
    const game = GameInstance.get();
    const dept = game.earthCivi.departments.get(this.currentType);
    if (!dept) return;

    // 获取当前负责人信息
    let leaderInfoHtml = "";
    if (dept.leaderName) {
      const leader = game.personManager.getPerson(dept.leaderName);
      let bonusText = "";
      if (this.currentType === DepartmentType.ECONOMY) bonusText = t("{param0}: +{param1}% {param2}", { param0: t("预计加成"), param1: (leader?.economy || 0) * 10, param2: t("经济产出") });
      else if (this.currentType === DepartmentType.ASTROPHYSICS) bonusText = t("{param0}: +{param1}% {param2}", { param0: t("预计加成"), param1: (leader?.science || 0) * 20, param2: t("物理科研速度") });
      else bonusText = t("各项综合能力将提升部门效率");

      const avatarUrl = leader?.faceFile ? getImageUrl(leader.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:2px solid var(--color-primary);margin-right:16px;" />`
        : `<div style="width:64px;height:64px;border-radius:12px;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-right:16px;">${(t(dept.leaderName) || '?')[0]}</div>`;

      leaderInfoHtml = t("\n        <div style=\"padding: 12px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; display: flex; align-items: center; margin-bottom: 16px;\">\n          {param0}\n          <div style=\"flex: 1;\">\n            <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;\">\n              <span style=\"color: var(--text-primary); font-weight: bold; font-size: 1.1rem;\">{param1}</span>\n              <span style=\"color: var(--text-secondary); font-size: 0.8rem;\">{param2}</span>\n            </div>\n            <div style=\"color: var(--color-primary); font-size: 0.85rem;\">{param3}</div>\n          </div>\n          <button class=\"btn-glass\" id=\"btn-change-leader\" style=\"margin-left: 16px; padding: 6px 12px;\">{param4}</button>\n        </div>\n      ", { param0: avatarHtml, param1: t(dept.leaderName), param2: t("负责人"), param3: bonusText, param4: t("更换") });
    } else {
      leaderInfoHtml = t("\n        <div style=\"padding: 12px; background: var(--border-glass); border: 1px dashed var(--border-glass-strong); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;\">\n          <span style=\"color: var(--text-secondary);\">{param0}</span>\n          <button class=\"btn-primary\" id=\"btn-change-leader\" style=\"padding: 6px 16px; font-size: 0.9rem;\">{param1}</button>\n        </div>\n      ", { param0: t("当前无负责人，部门效率处于基础状态。"), param1: t("指派负责人") });
    }

    const html = t("\n      <div style=\"margin-bottom: 20px;\">\n        <h3 style=\"color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;\">\n          {param0}\n        </h3>\n        <p style=\"color: var(--text-secondary); margin-bottom: 16px;\">{param1}</p>\n        {param2}\n      </div>\n    ", { param0: t("部门概况"), param1: t("本部门负责处理地球文明相关的管理与研发。分配合适的负责人可以极大提高本部门的产出效率。"), param2: leaderInfoHtml });

    // 科技部门关联
    let relatedTecTreeType = -1;
    switch (this.currentType) {
      case DepartmentType.ASTROPHYSICS: relatedTecTreeType = 0; break; // PHYSICS
      case DepartmentType.SPACEFIGHT: relatedTecTreeType = 1; break;   // AEROSPACE
      case DepartmentType.ARMY: relatedTecTreeType = 2; break;         // MILITARY
      case DepartmentType.NUCLEAR: relatedTecTreeType = 0; break;      // PHYSICS (related)
      case DepartmentType.PROTON: relatedTecTreeType = 0; break;       // PHYSICS (related)
    }

    if (relatedTecTreeType !== -1) {
      this.content.innerHTML = html + `<div id="tec-tree-container"></div>`;
      const container = document.getElementById("tec-tree-container")!;
      this.tecTreeView?.render(container, relatedTecTreeType);
    } else {
      this.content.innerHTML = html + t("<p style=\"color: var(--text-secondary); margin-top: 24px;\">{param0}</p>", { param0: t("该部门没有关联的科技树分支。") });
    }

    // 绑定选人事件
    const btnChangeLeader = document.getElementById("btn-change-leader");
    if (btnChangeLeader) {
      btnChangeLeader.addEventListener("click", () => {
        personSelectPanel.open(this.currentType?.toString() || "", (selectedName) => {
          // 如果之前有负责人，需要将其释放回 availablePersons
          if (dept.leaderName) {
            game.personManager.availablePersons.add(dept.leaderName);
            const oldPerson = game.personManager.getPerson(dept.leaderName);
            if (oldPerson) oldPerson.departmentId = null;
          }
          
          // 任命新负责人
          dept.leaderName = selectedName;
          game.personManager.availablePersons.delete(selectedName);
          const newPerson = game.personManager.getPerson(selectedName);
          if (newPerson) newPerson.departmentId = dept.name; // 用部门名代替ID
          
          // 重新渲染当前面板
          this.render();
        });
      });
    }
  }
}
