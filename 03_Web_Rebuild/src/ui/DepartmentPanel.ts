import { DepartmentType } from "../types/enums";
import { GameInstance } from "../core/Game";
import { TecTreeView } from "./TecTreeView";
import { personSelectPanel } from "./PersonSelectPanel";
import { getImageUrl } from "../utils/assetUrl";

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
    this.title.textContent = title;
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
      if (this.currentType === DepartmentType.ECONOMY) bonusText = `预计加成: +${(leader?.economy || 0) * 10}% 经济产出`;
      else if (this.currentType === DepartmentType.ASTROPHYSICS) bonusText = `预计加成: +${(leader?.science || 0) * 20}% 物理科研速度`;
      else bonusText = "各项综合能力将提升部门效率";

      const avatarUrl = leader?.faceFile ? getImageUrl(leader.faceFile) : '';
      const avatarHtml = avatarUrl 
        ? `<img src="${avatarUrl}" onerror="this.style.display='none'" style="width:64px;height:64px;border-radius:12px;object-fit:cover;border:2px solid var(--color-primary);margin-right:16px;" />`
        : `<div style="width:64px;height:64px;border-radius:12px;background:var(--border-glass);display:flex;align-items:center;justify-content:center;font-size:1.5rem;margin-right:16px;">${dept.leaderName[0]}</div>`;

      leaderInfoHtml = `
        <div style="padding: 12px; background: var(--color-primary-glass); border: 1px solid var(--color-primary); border-radius: 8px; display: flex; align-items: center; margin-bottom: 16px;">
          ${avatarHtml}
          <div style="flex: 1;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
              <span style="color: var(--text-primary); font-weight: bold; font-size: 1.1rem;">${dept.leaderName}</span>
              <span style="color: var(--text-secondary); font-size: 0.8rem;">负责人</span>
            </div>
            <div style="color: var(--color-primary); font-size: 0.85rem;">${bonusText}</div>
          </div>
          <button class="btn-glass" id="btn-change-leader" style="margin-left: 16px; padding: 6px 12px;">更换</button>
        </div>
      `;
    } else {
      leaderInfoHtml = `
        <div style="padding: 12px; background: var(--border-glass); border: 1px dashed var(--border-glass-strong); border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-secondary);">当前无负责人，部门效率处于基础状态。</span>
          <button class="btn-primary" id="btn-change-leader" style="padding: 6px 16px; font-size: 0.9rem;">指派负责人</button>
        </div>
      `;
    }

    const html = `
      <div style="margin-bottom: 20px;">
        <h3 style="color: var(--color-primary); border-bottom: 1px solid var(--border-glass); padding-bottom: 8px;">
          部门概况
        </h3>
        <p style="color: var(--text-secondary); margin-bottom: 16px;">本部门负责处理地球文明相关的管理与研发。分配合适的负责人可以极大提高本部门的产出效率。</p>
        ${leaderInfoHtml}
      </div>
    `;

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
      this.content.innerHTML = html + `<p style="color: var(--text-secondary); margin-top: 24px;">该部门没有关联的科技树分支。</p>`;
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
