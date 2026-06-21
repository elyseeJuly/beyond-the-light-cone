import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GameInstance } from "./core/Game";
import { storage } from "./core/IndexedDBStorage";
import { StatisticsManager } from "./core/StatisticsManager";
import { assetLoader } from "./core/AssetLoader";
import { patchManager } from "./core/PatchManager";

console.log('Legend of Uni Web (React) started');

// ==================== PWA 启动流程 ====================
// 1. 初始化 IndexedDB 存档存储
// 2. 初始化 AssetLoader（资源清单 + 资源数据库）
// 3. 初始化 PatchManager（应用待处理补丁）
// 4. 启动游戏引擎
// 5. 注册 Service Worker
// 6. 渲染 React UI
// =================================================

async function bootstrap() {
  try {
    // Step 1: 存档存储
    await storage.init().catch(err => {
      console.warn('IndexedDB init failed, falling back to localStorage:', err);
    });

    // Step 2: 资源加载器（读取 asset_manifest.json）
    await assetLoader.init().catch(err => {
      console.warn('AssetLoader init failed, continuing without manifest:', err);
    });

    // Step 3: 热更新补丁
    const manifest = assetLoader.getManifest();
    if (manifest) {
      await patchManager.init(manifest).catch(err => {
        console.warn('PatchManager init failed:', err);
      });
      // 自动应用待处理补丁
      const appliedPatches = await patchManager.applyPendingPatches().catch(err => {
        console.warn('Patch application failed:', err);
        return [];
      });
      if (appliedPatches.length > 0) {
        console.log(`[Bootstrap] 已应用 ${appliedPatches.length} 个热更新补丁`);
      }
    }

    // Step 4: 启动游戏引擎
    console.log("Initializing Game Engine...");
    GameInstance.get(); // Boot the core engine logic
    
    console.log("Initializing Statistics Manager...");
    StatisticsManager.init();

    // Setup global access for debugging
    (window as any).game = GameInstance.get();

    // Step 5: Service Worker 由 UpdatePrompt (virtual:pwa-register) 负责注册

    // Step 6: 渲染 UI
    const rootElement = document.getElementById('app');
    if (rootElement) {
      ReactDOM.createRoot(rootElement).render(<App />);
    } else {
      console.error("Failed to find the root element");
    }
  } catch (err) {
    console.error("Bootstrap Failed:", err);
    const rootElement = document.getElementById('app');
    if (rootElement) {
      rootElement.innerHTML = `
        <div style="padding: 40px; color: #E65100; font-family: sans-serif; background: #050A1F; height: 100vh;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">系统引导失败 (Bootstrap Error)</h1>
          <p>核心引擎初始化过程中发生异常，无法进入沉浸式视图。</p>
          <pre style="background: rgba(255,255,255,0.05); padding: 20px; border-radius: 8px; overflow: auto;">${err}</pre>
        </div>
      `;
    }
  }
}

bootstrap();