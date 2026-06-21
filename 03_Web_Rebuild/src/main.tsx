import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { GameInstance } from "./core/Game";
import { storage } from "./core/IndexedDBStorage";

console.log('Legend of Uni Web (React) started');

// Initialize IndexedDB for save storage (PWA requirement)
storage.init().catch(err => {
  console.warn('IndexedDB init failed, falling back to localStorage:', err);
}).finally(() => {
  // Register PWA service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/beyond-the-light-cone/sw.js').catch(err => {
      console.warn('SW registration failed (non-critical):', err);
    });
  }
});

try {
  console.log("Initializing Game Engine...");
  GameInstance.get(); // Boot the core engine logic
  
  // Setup global access for debugging
  (window as any).game = GameInstance.get();

  const rootElement = document.getElementById('app');
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <App />
    );
  } else {

    console.error("Failed to find the root element");
  }

} catch (err) {
  console.error("Engine Initialization Failed:", err);
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