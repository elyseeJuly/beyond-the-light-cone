import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';

interface UpdatePromptProps {
  // No props needed - reads from SW registration
}

/**
 * UpdatePrompt - PWA 自动更新提示组件
 * 
 * 当 Service Worker 检测到新版本时，显示更新提示。
 * 玩家可以选择"立即更新"或"稍后提醒"。
 * 符合 Update-1 规范：禁止强制刷新页面。
 */
export const UpdatePrompt: React.FC<UpdatePromptProps> = () => {
  const {
    offlineReady: [, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('[PWA] SW Registered', r);
    },
    onRegisterError(error) {
      console.error('[PWA] SW registration error', error);
    },
  });

  const close = () => {
    setOfflineReady(false);
    setNeedRefresh(false);
  };

  // 离线就绪提示可以考虑做成 Toast，这里为了简单起见，我们主要关注更新提示
  // 如果需要离线提示，也可以在这里实现

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[10000] animate-fade-in">
      <div className="bg-[#0B1020] border border-[#1A3A6A]/50 rounded-lg shadow-2xl shadow-black/50 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#1A3A6A]/30 flex items-center justify-center">
            <svg className="w-4 h-4 text-[#4A9EFF]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#DDEEFF]">发现新版本</p>
            <p className="text-xs text-[#8899BB] mt-1">游戏有可用更新，是否立即更新？</p>
          </div>
        </div>
        <div className="flex gap-2 mt-3 justify-end">
          <button
            onClick={() => close()}
            className="px-3 py-1.5 text-xs text-[#8899BB] hover:text-[#DDEEFF] transition-colors rounded border border-[#1A3A6A]/30 hover:border-[#1A3A6A]"
          >
            稍后提醒
          </button>
          <button
            onClick={() => updateServiceWorker(true)}
            className="px-3 py-1.5 text-xs text-white bg-[#1A3A6A] hover:bg-[#2A4A8A] transition-colors rounded font-medium"
          >
            立即更新
          </button>
        </div>
      </div>
    </div>
  );
};