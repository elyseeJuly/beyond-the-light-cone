import React, { useState } from 'react';
import { Database, Download, Settings, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { assetLoader } from '../core/AssetLoader';

interface AssetDownloadPromptModalProps {
  onClose: () => void;
  onOpenSettings: () => void;
}

export const AssetDownloadPromptModal: React.FC<AssetDownloadPromptModalProps> = ({
  onClose,
  onOpenSettings,
}) => {
  const [stats] = useState(() => assetLoader.getStats());
  const [downloadingState, setDownloadingState] = useState<'idle' | 'downloading' | 'complete' | 'error'>('idle');
  const [currentPackName, setCurrentPackName] = useState<string>('');
  const [currentPackProgress, setCurrentPackProgress] = useState<number>(0);
  const [completedCount, setCompletedCount] = useState<number>(0);
  const [doNotShowAgain, setDoNotShowAgain] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const pendingPacks = stats.pendingPacks;
  const totalPending = pendingPacks.length;

  const handleStartSmartDownload = async () => {
    setDownloadingState('downloading');
    setErrorMessage('');
    
    // Save DoNotShowAgain flag once user initiates download
    localStorage.setItem('game-assets-prompt-seen', 'true');

    // Run sequential download of all pending packs
    let done = 0;
    for (let i = 0; i < pendingPacks.length; i++) {
      const packId = pendingPacks[i];
      const packDetail = stats.packsDetail.find(p => p.packId === packId);
      setCurrentPackName(packDetail?.name || packId);
      setCurrentPackProgress(0);

      try {
        await new Promise<void>((resolve, reject) => {
          assetLoader.downloadPack(packId, (p) => {
            if (p.state === 'downloading') {
              setCurrentPackProgress(Math.round(p.progress * 100));
            } else if (p.state === 'complete') {
              setCurrentPackProgress(100);
              resolve();
            } else if (p.state === 'error') {
              reject(new Error(p.error || '未知下载错误'));
            }
          }).catch(reject);
        });
        done++;
        setCompletedCount(done);
      } catch (err: any) {
        console.error(`[AssetDownloadPromptModal] Download failed for ${packId}:`, err);
        setErrorMessage(err.message || '网络连接超时，下载中断。');
        setDownloadingState('error');
        return;
      }
    }

    setDownloadingState('complete');
  };

  const handleCustomSettings = () => {
    localStorage.setItem('game-assets-prompt-seen', 'true');
    onOpenSettings();
    onClose();
  };

  const handleDownloadOnDemand = () => {
    if (doNotShowAgain) {
      localStorage.setItem('game-assets-prompt-seen', 'true');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[1005] flex items-center justify-center bg-[#070B14]/85 backdrop-blur-md select-none pointer-events-auto">
      {/* Glow effect in background */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-500/10 blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-[92vw] max-w-[480px] bg-[#070B14]/90 border border-cyan-500/30 rounded p-6 sm:p-8 flex flex-col gap-6 shadow-[0_0_40px_rgba(0,184,255,0.2)] overflow-hidden">
        {/* Holographic lines */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,229,255,0.01)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,229,255,0.01)_1px,transparent_1px)] bg-[size:16px_16px]" />
        </div>

        {/* Holographic Corners */}
        <div className="absolute top-2 left-2 w-3.5 h-3.5 border-t border-l border-cyan-500/60 z-10" />
        <div className="absolute top-2 right-2 w-3.5 h-3.5 border-t border-r border-cyan-500/60 z-10" />
        <div className="absolute bottom-2 left-2 w-3.5 h-3.5 border-b border-l border-cyan-500/60 z-10" />
        <div className="absolute bottom-2 right-2 w-3.5 h-3.5 border-b border-r border-cyan-500/60 z-10" />

        {/* Title Header */}
        <div className="flex items-center gap-4 border-b border-cyan-500/20 pb-4 shrink-0 z-10">
          <div className={`w-12 h-12 bg-cyan-500/5 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 shadow-[0_0_15px_rgba(0,184,255,0.15)] ${downloadingState === 'downloading' ? 'animate-pulse' : ''}`}>
            {downloadingState === 'complete' ? (
              <CheckCircle size={24} className="text-emerald-400" />
            ) : downloadingState === 'error' ? (
              <AlertTriangle size={24} className="text-amber-400" />
            ) : (
              <Database size={24} />
            )}
          </div>
          <div>
            <div className="text-[10px] font-mono font-bold text-cyan-400/80 tracking-[0.2em] uppercase">SYSTEM AUTHORIZATION</div>
            <h2 className="text-sm sm:text-base font-title font-black text-white tracking-widest leading-none">
              高维宇宙数据包授权下载
            </h2>
          </div>
        </div>

        {/* Body content based on state */}
        <div className="text-xs text-slate-300 leading-relaxed z-10 flex-grow min-h-0">
          {downloadingState === 'idle' && (
            <div className="space-y-4">
              <p>
                文明执政官，系统自检已完成。游戏核心组件（Layer 1 Core）已完全加载就绪。
              </p>
              <p>
                为优化首屏加载速率，高精度结局CG、角色全息立绘及宏大的纪元原声带等大体量多媒体资源（约 <span className="text-cyan-400 font-bold">370MB</span>）被归为<strong>分段扩展数据包</strong>。
              </p>
              <p className="text-[11px] text-slate-400 italic">
                * 建议立刻授权全量下载，以保障在后续时代更替（如危机、威慑纪元等）时获得完整的视听沉浸体验。
              </p>
            </div>
          )}

          {downloadingState === 'downloading' && (
            <div className="space-y-5 py-4">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-slate-400">总数据包下载进度:</span>
                <span className="text-cyan-400 font-bold">{completedCount} / {totalPending} 已完成</span>
              </div>
              
              {/* Outer progress bar */}
              <div className="w-full bg-cyan-950/40 h-2.5 border border-cyan-500/20 rounded overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full transition-all duration-300 shadow-[0_0_8px_rgba(0,184,255,0.6)]"
                  style={{ width: `${(completedCount / totalPending) * 100}%` }}
                />
              </div>

              <div className="bg-black/35 p-3.5 border border-cyan-500/10 rounded space-y-2.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-white font-bold flex items-center gap-1.5">
                    <Loader2 size={12} className="animate-spin text-cyan-400" />
                    正在同步: {currentPackName}
                  </span>
                  <span className="text-cyan-400 font-bold">{currentPackProgress}%</span>
                </div>
                {/* Inner progress bar */}
                <div className="w-full bg-cyan-950/20 h-1.5 rounded overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-200"
                    style={{ width: `${currentPackProgress}%` }}
                  />
                </div>
              </div>
            </div>
          )}

          {downloadingState === 'complete' && (
            <div className="space-y-4 py-2">
              <p className="text-emerald-400 font-bold text-center text-sm">
                ✓ 高维数据授权下载同步完成！
              </p>
              <p>
                已将所有扩展多媒体数据包安全下载并缓存至您的银河数据库。接下来，您将体验到最完整的《光锥之外》声画特效。
              </p>
            </div>
          )}

          {downloadingState === 'error' && (
            <div className="space-y-4">
              <p className="text-amber-400 font-bold flex items-center gap-1.5">
                ⚠️ 同步中断: 外部干扰异常
              </p>
              <div className="bg-amber-950/10 border border-amber-500/20 p-3 text-amber-300/80 rounded leading-relaxed text-[11px]">
                {errorMessage}
              </div>
              <p>
                当前连接信号受智子波动干扰。您可以使用“暂不下载”直接进入游戏，或尝试“重新连接”。
              </p>
            </div>
          )}
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col gap-3.5 shrink-0 z-10">
          {downloadingState === 'idle' && (
            <>
              <button
                onClick={handleStartSmartDownload}
                className="w-full py-3 rounded border border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/25 text-white font-bold text-xs uppercase tracking-widest cursor-pointer shadow-[0_0_15px_rgba(0,184,255,0.15)] hover:shadow-[0_0_20px_rgba(0,184,255,0.35)] transition-all flex items-center justify-center gap-2"
              >
                <Download size={14} /> 一键智能全量下载 (推荐)
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleCustomSettings}
                  className="py-2.5 rounded border border-[#243245] hover:border-cyan-400 bg-white/5 hover:bg-cyan-950/20 text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Settings size={12} /> 个性化选择
                </button>
                <button
                  onClick={handleDownloadOnDemand}
                  className="py-2.5 rounded border border-[#243245] hover:border-slate-400 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-[11px] font-bold cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Play size={12} /> 暂不下载，按需
                </button>
              </div>

              {/* Do not show again checkbox */}
              <div className="flex items-center gap-2 mt-1 justify-center">
                <input
                  type="checkbox"
                  id="chk-no-prompt"
                  checked={doNotShowAgain}
                  onChange={(e) => setDoNotShowAgain(e.target.checked)}
                  className="w-3.5 h-3.5 accent-cyan-400 cursor-pointer"
                />
                <label htmlFor="chk-no-prompt" className="text-[10px] text-slate-400/80 cursor-pointer hover:text-slate-300 transition-colors select-none">
                  下次启动不再显示此界面 (按需下载)
                </label>
              </div>
            </>
          )}

          {downloadingState === 'downloading' && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded border border-cyan-500/50 bg-cyan-950/30 hover:bg-cyan-950/50 text-cyan-300 font-bold text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              后台运行并开始游戏
            </button>
          )}

          {downloadingState === 'complete' && (
            <button
              onClick={onClose}
              className="w-full py-3 rounded border border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/25 text-white font-bold text-xs uppercase tracking-widest cursor-pointer transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle size={14} className="text-emerald-400" /> 进入游戏
            </button>
          )}

          {downloadingState === 'error' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleStartSmartDownload}
                className="py-2.5 rounded border border-cyan-500 bg-cyan-500/10 hover:bg-cyan-500/25 text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                重新连接
              </button>
              <button
                onClick={handleDownloadOnDemand}
                className="py-2.5 rounded border border-[#243245] hover:border-white bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white text-xs font-bold cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                直接进入游戏
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
