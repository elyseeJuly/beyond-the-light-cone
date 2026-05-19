import { GameInstance } from "../core/Game";

export class SystemMenuPanel {
  private container: HTMLElement;
  private mounted: boolean = false;

  constructor() {
    this.container = document.createElement("div");
    this.container.id = "system-menu-modal";
    this.container.className = "modal-overlay hidden";
    this.container.style.zIndex = "3000"; 
    
    this.container.innerHTML = `
      <style>
        #system-menu-modal .switch input:checked + .slider {
          background-color: var(--color-primary) !important;
          border-color: var(--color-primary) !important;
        }
        #system-menu-modal .slider:before {
          position: absolute;
          content: "";
          height: 12px;
          width: 12px;
          left: 3px;
          bottom: 3px;
          background-color: white;
          transition: .3s;
          border-radius: 50%;
        }
        #system-menu-modal .switch input:checked + .slider:before {
          transform: translateX(16px);
        }
      </style>
      <div class="modal-box glass-panel" style="max-width: 400px; height: auto; padding: 24px;">
        <div class="modal-header" style="border-bottom: none; padding: 0 0 16px 0; justify-content: center;">
          <h2 style="font-size: 1.8rem; letter-spacing: 2px;">系统菜单</h2>
        </div>
        <div class="modal-content" style="padding: 0; display: flex; flex-direction: column; gap: 16px;">
          <button class="btn-primary" id="btn-save-game" style="width: 100%;">💾 保存游戏</button>
          <button class="btn-glass" id="btn-load-game" style="width: 100%; font-size: 1.1rem; padding: 12px;">📂 读取游戏</button>
          
          <!-- BGM Setting Controls -->
          <div style="margin-top: 4px; padding: 12px; border: 1px solid var(--border-glass); border-radius: 4px; display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.02);">
            <div style="font-size: 0.95rem; font-weight: bold; opacity: 0.85; display: flex; justify-content: space-between; align-items: center;">
              <span style="display: flex; align-items: center; gap: 6px;">🎵 游戏背景音乐</span>
              <label class="switch" style="position: relative; display: inline-block; width: 36px; height: 20px; margin: 0;">
                <input type="checkbox" id="settings-bgm-switch" style="opacity: 0; width: 0; height: 0;">
                <span class="slider" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); transition: .3s; border-radius: 20px;"></span>
              </label>
            </div>
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="font-size: 0.8rem; opacity: 0.5; min-width: 28px;">音量</span>
              <input type="range" id="settings-bgm-volume" min="0" max="1" step="0.05" style="flex: 1; accent-color: var(--color-primary); cursor: pointer;" />
            </div>
          </div>

          <button class="btn-glass" id="btn-toggle-theme" style="width: 100%; font-size: 1.1rem; padding: 12px;">🌓 切换主题 (明/暗)</button>
          <button class="btn-glass" id="btn-restart" style="width: 100%; font-size: 1.1rem; padding: 12px; border-color: #E65100; color: #E65100;">🔄 重新开始</button>
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border-glass); text-align: center;">
            <button class="btn-glass" id="btn-close-menu" style="width: 100%;">返回游戏</button>
          </div>
        </div>
      </div>
    `;
    
    this.bindEvents();
  }

  public open() {
    if (!this.mounted) {
      document.body.appendChild(this.container);
      this.mounted = true;
    }

    // Sync values from localStorage
    const bgmMuted = localStorage.getItem('game-bgm-muted') === 'true';
    const bgmVolume = parseFloat(localStorage.getItem('game-bgm-volume') || '0.4');
    
    const switchEl = this.container.querySelector("#settings-bgm-switch") as HTMLInputElement;
    const volumeEl = this.container.querySelector("#settings-bgm-volume") as HTMLInputElement;
    
    if (switchEl) switchEl.checked = !bgmMuted;
    if (volumeEl) volumeEl.value = String(bgmVolume);

    this.container.classList.remove("hidden");
  }

  public close() {
    this.container.classList.add("hidden");
  }

  private bindEvents() {
    this.container.querySelector("#btn-close-menu")?.addEventListener("click", () => this.close());
    
    this.container.querySelector("#btn-save-game")?.addEventListener("click", () => {
      GameInstance.saveGame();
      alert("游戏保存成功！");
      this.close();
    });

    this.container.querySelector("#btn-load-game")?.addEventListener("click", () => {
      if (confirm("读取游戏将丢失当前未保存的进度，确认读取？")) {
        const success = GameInstance.loadGame();
        if (success) {
          alert("游戏读取成功！");
          this.close();
          window.dispatchEvent(new Event("game-loaded"));
        } else {
          alert("没有找到存档数据！");
        }
      }
    });

    // BGM Controls binding
    const switchEl = this.container.querySelector("#settings-bgm-switch") as HTMLInputElement;
    const volumeEl = this.container.querySelector("#settings-bgm-volume") as HTMLInputElement;

    switchEl?.addEventListener("change", (e) => {
      const checked = (e.target as HTMLInputElement).checked;
      localStorage.setItem('game-bgm-muted', String(!checked));
      window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
    });

    volumeEl?.addEventListener("input", (e) => {
      const val = (e.target as HTMLInputElement).value;
      localStorage.setItem('game-bgm-volume', val);
      localStorage.setItem('game-bgm-muted', 'false');
      if (switchEl) switchEl.checked = true;
      window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
    });

    this.container.querySelector("#btn-toggle-theme")?.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");
      const isDark = document.documentElement.classList.contains("dark");
      localStorage.setItem('game-theme', isDark ? 'dark' : 'light');
      window.dispatchEvent(new CustomEvent('theme-change', { detail: { isDark } }));
      console.log("Theme toggled: ", isDark ? "Dark" : "Light");
    });

    this.container.querySelector("#btn-restart")?.addEventListener("click", () => {
      if (confirm("确认放弃当前进度重新开始吗？")) {
        GameInstance.reset();
        window.location.reload();
      }
    });
  }
}

export const systemMenuPanel = new SystemMenuPanel();
