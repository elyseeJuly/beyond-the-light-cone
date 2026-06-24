import React, { useState, useEffect } from 'react';
import { GameInstance } from '../core/Game';
import { Volume2, Globe, Monitor, Zap, Save, HelpCircle, Users, X, Database, MessageSquare } from 'lucide-react';
import { setLanguage, getLanguage } from '../utils/i18n';
import { assetLoader } from '../core/AssetLoader';

interface SettingsModalProps {
  onClose: () => void;
}

type SettingsTab = 'audio' | 'lang' | 'display' | 'perf' | 'save' | 'help' | 'credits' | 'storage';

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('audio');
  
  // Storage states
  const [assetStats, setAssetStats] = useState(() => assetLoader.getStats());
  const [downloadingPack, setDownloadingPack] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  const handleDownload = async (packId: string) => {
    setDownloadingPack(packId);
    setDownloadProgress(0);
    try {
      await assetLoader.downloadPack(packId, (p) => {
        setDownloadProgress(Math.round(p.progress * 100));
        if (p.state === 'complete') {
          setDownloadingPack(null);
          setAssetStats(assetLoader.getStats());
        } else if (p.state === 'error') {
          alert(`下载失败: ${p.error}`);
          setDownloadingPack(null);
        }
      });
    } catch (err) {
      alert(`启动下载失败: ${err}`);
      setDownloadingPack(null);
    }
  };
  
  // Audio state
  const [bgmMuted, setBgmMuted] = useState(() => localStorage.getItem('game-bgm-muted') === 'true');
  const [bgmVolume, setBgmVolume] = useState(() => parseFloat(localStorage.getItem('game-bgm-volume') || '0.4'));
  
  // Language state
  const [lang, setLangState] = useState(() => getLanguage());
  
  // Display & Performance
  const [highContrast, setHighContrast] = useState(() => localStorage.getItem('high-contrast') === 'true');
  const [particleLevel, setParticleLevel] = useState(() => localStorage.getItem('game-particle-level') || 'standard');

  const handleSave = () => {
    GameInstance.saveGame();
    alert("游戏数据存档成功！");
  };

  const handleLoad = () => {
    if (confirm("读取存档将覆盖当前未保存的进度，确认读取？")) {
      const success = GameInstance.loadGame();
      if (success) {
        alert("游戏读取成功！");
        window.dispatchEvent(new Event("game-loaded"));
        onClose();
      } else {
        alert("未找到存档数据！");
      }
    }
  };

  const handleRestart = () => {
    if (confirm("确认重置文明并重新开始吗？这会抹去当前的纪元进度。")) {
      GameInstance.reset();
      localStorage.removeItem("game-tutorial-seen");
      window.location.reload();
    }
  };

  const handleExitToMainMenu = () => {
    if (confirm("确认保存当前进度并返回主菜单吗？")) {
      GameInstance.saveGame();
      window.dispatchEvent(new CustomEvent('open-cover-screen'));
      onClose();
    }
  };

  // Sync BGM
  useEffect(() => {
    localStorage.setItem('game-bgm-muted', String(bgmMuted));
    window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
  }, [bgmMuted]);

  useEffect(() => {
    localStorage.setItem('game-bgm-volume', String(bgmVolume));
    localStorage.setItem('game-bgm-muted', 'false');
    setBgmMuted(false);
    window.dispatchEvent(new CustomEvent('bgm-settings-changed'));
  }, [bgmVolume]);

  // Sync high contrast
  useEffect(() => {
    if (highContrast) {
      document.body.classList.add('high-contrast');
    } else {
      document.body.classList.remove('high-contrast');
    }
    localStorage.setItem('high-contrast', String(highContrast));
    window.dispatchEvent(new CustomEvent('high-contrast-changed', { detail: highContrast }));
  }, [highContrast]);

  // Sync Language
  const changeLanguage = (nextLang: 'zh' | 'en') => {
    setLanguage(nextLang);
    setLangState(nextLang);
  };

  // Sync Particle Level
  const changeParticleLevel = (level: string) => {
    setParticleLevel(level);
    localStorage.setItem('game-particle-level', level);
    window.dispatchEvent(new CustomEvent('particle-settings-changed', { detail: level }));
  };

  const getTabStyle = (tab: SettingsTab) => {
    return activeTab === tab
      ? 'border-[var(--color-primary)] text-white bg-white/5 font-bold'
      : 'border-transparent text-[var(--text-secondary)] hover:text-white';
  };

  return (
    <div 
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none"
      role="dialog"
      aria-modal="true"
    >
      {/* 720x560 Archive Card Modal */}
      <div className="relative w-[720px] h-[520px] bg-[#070B14] border border-[#243245] shadow-[0_0_50px_rgba(0,184,255,0.15)] flex flex-col justify-between p-6 rounded overflow-hidden">
        {/* Glow corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#243245]/40 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-title font-bold text-[var(--color-primary)] tracking-widest uppercase">
              ⚙️ 执政控制中心设置档案
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/5 rounded text-[var(--text-secondary)] hover:text-white transition-colors cursor-pointer"
            title="关闭设置"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content Box */}
        <div className="flex-1 flex gap-6 overflow-hidden my-4">
          {/* Left Navigation */}
          <div className="w-44 flex flex-col gap-1.5 shrink-0">
            <button
              onClick={() => setActiveTab('audio')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('audio')}`}
            >
              <Volume2 size={14} /> 音频设置
            </button>
            
            <button
              onClick={() => setActiveTab('lang')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('lang')}`}
            >
              <Globe size={14} /> 语言选择
            </button>
            
            <button
              onClick={() => setActiveTab('display')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('display')}`}
            >
              <Monitor size={14} /> 显示配置
            </button>
            
            <button
              onClick={() => setActiveTab('perf')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('perf')}`}
            >
              <Zap size={14} /> 性能调度
            </button>
            
            <button
              onClick={() => setActiveTab('save')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('save')}`}
            >
              <Save size={14} /> 存档管理
            </button>
            
            <button
              onClick={() => setActiveTab('help')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('help')}`}
            >
              <HelpCircle size={14} /> 执政帮助
            </button>

            <button
              onClick={() => setActiveTab('credits')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('credits')}`}
            >
              <Users size={14} /> 制作人员
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded border-l-2 text-xs font-title uppercase tracking-wider transition-all cursor-pointer ${getTabStyle('storage')}`}
            >
              <Database size={14} /> 存储与资源
            </button>
          </div>

          {/* Right Display Area */}
          <div className="flex-1 bg-[#070B14]/40 border border-[#243245]/30 rounded p-4 flex flex-col justify-center overflow-hidden font-mono text-xs text-[var(--text-secondary)]">
            
            {activeTab === 'audio' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  背景音乐与环境音效
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#070B14]/60 p-3 border border-[#243245]/20 rounded">
                    <span>背景音乐 (BGM) 启用</span>
                    <input 
                      type="checkbox" 
                      checked={!bgmMuted}
                      onChange={(e) => setBgmMuted(!e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
                    />
                  </div>
                  <div className="space-y-2 bg-[#070B14]/60 p-3 border border-[#243245]/20 rounded">
                    <div className="flex justify-between">
                      <span>BGM 音量大小</span>
                      <span className="text-white font-bold">{Math.round(bgmVolume * 100)}%</span>
                    </div>
                    <input 
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={bgmVolume}
                      onChange={(e) => setBgmVolume(parseFloat(e.target.value))}
                      className="w-full h-1 bg-[#243245] rounded appearance-none cursor-pointer accent-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'lang' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  档案语言编码 / Language Select
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => changeLanguage('zh')}
                    className={`flex-1 py-4 border rounded font-bold transition-all cursor-pointer text-center ${
                      lang === 'zh' 
                        ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]' 
                        : 'border-[#243245] hover:border-white text-slate-300'
                    }`}
                  >
                    中文简体 (Chinese)
                  </button>
                  <button
                    onClick={() => changeLanguage('en')}
                    className={`flex-1 py-4 border rounded font-bold transition-all cursor-pointer text-center ${
                      lang === 'en' 
                        ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]' 
                        : 'border-[#243245] hover:border-white text-slate-300'
                    }`}
                  >
                    English (US)
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'display' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  全息系统界面显示配置
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center bg-[#070B14]/60 p-3 border border-[#243245]/20 rounded">
                    <div>
                      <div>高对比度辅助显示</div>
                      <div className="text-[10px] text-[var(--text-secondary)]/50 mt-0.5">提高文本亮度，移除多余虚光滤镜</div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={highContrast}
                      onChange={(e) => setHighContrast(e.target.checked)}
                      className="w-4 h-4 cursor-pointer accent-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'perf' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  背景物理星云粒子密度
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {['off', 'low', 'standard'].map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => changeParticleLevel(lvl)}
                      className={`py-3 border rounded text-[11px] font-bold uppercase transition-all cursor-pointer text-center ${
                        particleLevel === lvl 
                          ? 'border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)]' 
                          : 'border-[#243245] hover:border-white text-slate-300'
                      }`}
                    >
                      {lvl === 'off' && '低耗 (0)'}
                      {lvl === 'low' && '中能 (80)'}
                      {lvl === 'standard' && '标准 (200)'}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[var(--text-secondary)]/50 leading-relaxed italic">
                  * 调整背景中星云与尘埃粒子的物理结算数量，中低配置环境推荐调低。
                </p>
              </div>
            )}

            {activeTab === 'save' && (
              <div className="space-y-4">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  银河档案馆归档管理器
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={handleSave}
                    className="py-3 rounded border border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] text-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.2)] font-bold transition-all cursor-pointer text-center"
                  >
                    💾 保存游戏
                  </button>
                  <button 
                    onClick={handleLoad}
                    className="py-3 rounded border border-cyan-400 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-950/40 font-bold transition-all cursor-pointer text-center"
                  >
                    📂 读取旧档
                  </button>
                  <button 
                    onClick={handleRestart}
                    className="py-3 rounded border border-red-500 bg-red-950/20 text-red-400 hover:bg-red-950/40 font-bold transition-all cursor-pointer text-center"
                  >
                    🔄 重置时间线
                  </button>
                  <button 
                    onClick={handleExitToMainMenu}
                    className="py-3 rounded border border-yellow-500 bg-yellow-950/20 text-yellow-400 hover:bg-yellow-950/40 font-bold transition-all cursor-pointer text-center"
                  >
                    🚪 返回主菜单
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'help' && (
              <div className="space-y-3 leading-relaxed overflow-y-auto max-h-72 pr-1">
                <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2">
                  文明执政官操作纲领
                </div>
                <div className="space-y-2 text-[10px] text-slate-300">
                  <p className="font-bold text-white">【按键操作映射】</p>
                  <ul className="list-disc pl-4 space-y-1">
                    <li><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">空格键</kbd>: 推进下一回合 / 抉择事件快速前移</li>
                    <li><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">1</kbd>, <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">2</kbd>, <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">3</kbd>: 对应触发抉择事件中的 1-3 选项</li>
                    <li><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">M</kbd>: 星图 (Starmap) | <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">I</kbd>: 情报 (Intel) | <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">T</kbd>: 科技 (Tech)</li>
                    <li><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">G</kbd>: 内阁政府 (Gov) | <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">A</kbd>: 文明档案馆 (Archive)</li>
                    <li><kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">F</kbd>: 舰队调配指挥中心 | <kbd className="px-1 py-0.5 bg-white/5 border border-white/10 rounded">Esc</kbd>: 关闭当前任何浮层面板</li>
                  </ul>
                  <p className="font-bold text-white mt-3">【执政官战略纲领】</p>
                  <p>1. 稳定度代表你文明生命线的健康度，低于 30% 时面临极高崩溃风险。</p>
                  <p>2. 逃亡倾向过高将诱发社会失控，请妥善通过社会和文化部疏导控制。</p>
                </div>
              </div>
            )}

            {activeTab === 'credits' && (
              <div className="space-y-4 text-center py-6">
                <div className="text-sm font-bold text-white tracking-widest font-title uppercase">
                  Beyond the Light Cone: Rebuild Edition
                </div>
                <div className="w-32 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent mx-auto" />
                <div className="space-y-1 text-slate-300 text-[11px] font-mono leading-relaxed">
                  <p>美术定位总监：银河文明全息档案馆</p>
                  <p>架构重构团队：Google DeepMind - Antigravity</p>
                  <p>编译调试与高阶审美校对：Gemini 3.5 Pro & Flash</p>
                  <p className="mt-2 text-[var(--color-primary)]">当前版本：v0.9.0-beta</p>
                  <p className="text-[9px] text-[var(--text-secondary)] mt-6">
                    © 2026 EMBEROIS GAME STUDIO. ALL RIGHTS RESERVED.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'storage' && (
              <div className="space-y-4 flex flex-col justify-between h-full">
                <div className="space-y-3">
                  <div className="text-xs font-bold text-white uppercase tracking-wider border-b border-[#243245]/30 pb-2 flex justify-between items-center">
                    <span>系统离线存储与资源分层状态</span>
                    <span className="text-[10px] text-[var(--color-primary)]">Layer 1 & Layer 2</span>
                  </div>
                  
                  {/* Progress Indicator */}
                  <div className="bg-[#070B14]/60 p-3 border border-[#243245]/20 rounded space-y-2 flex-shrink-0">
                    <div className="flex justify-between text-[10px]">
                      <span>离线缓存数据总量:</span>
                      <span className="text-white font-bold">
                        {(assetStats.loadedSize / 1024 / 1024).toFixed(1)} MB / {(assetStats.totalSize / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>
                    <div className="w-full bg-[#1b2a3d] h-2 rounded overflow-hidden relative">
                      <div 
                        className="bg-gradient-to-r from-cyan-500 to-[var(--color-primary)] h-full transition-all duration-500"
                        style={{ width: `${(assetStats.loadedSize / (assetStats.totalSize || 1)) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Asset Packs List */}
                  <div className="space-y-1.5 overflow-y-auto max-h-[160px] pr-1">
                    {assetStats.packsDetail.map((pack: any) => (
                      <div key={pack.packId} className="flex justify-between items-center bg-black/35 px-2.5 py-1.5 rounded border border-[#243245]/15 text-[10px]">
                        <div className="flex flex-col">
                          <span className="text-white font-bold">{pack.name}</span>
                          <span className="text-[9px] text-[var(--text-secondary)]/60">{pack.description}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-[var(--text-secondary)]">{(pack.totalSize / 1024 / 1024).toFixed(1)} MB</span>
                          {pack.state === 'complete' ? (
                            <span className="text-emerald-400 font-bold">已缓存</span>
                          ) : downloadingPack === pack.packId ? (
                            <span className="text-amber-400 font-bold animate-pulse">下载中 {downloadProgress}%</span>
                          ) : (
                            <button
                              onClick={() => handleDownload(pack.packId)}
                              disabled={downloadingPack !== null}
                              className="px-2 py-0.5 border border-[var(--color-primary)] text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 rounded cursor-pointer disabled:opacity-40"
                            >
                              下载
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Feedback Entry at bottom */}
                <div className="border-t border-[#243245]/30 pt-3 flex justify-between items-center mt-auto shrink-0">
                  <span className="text-[9px] text-[var(--text-secondary)]/50">发现异常或平衡性问题？</span>
                  <button
                    onClick={() => window.open('https://github.com/elyseeJuly/beyond-the-light-cone/issues', '_blank')}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded border border-[var(--color-primary)] bg-[rgba(var(--color-primary-rgb),0.1)] hover:bg-[rgba(var(--color-primary-rgb),0.25)] text-white text-[10px] font-bold cursor-pointer transition-all"
                  >
                    <MessageSquare size={12} className="text-[var(--color-primary)]" /> 反馈问题与建议 (GitHub Issues)
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Footer info bar */}
        <div className="text-[10px] text-center font-mono text-[var(--text-secondary)]/50 shrink-0 border-t border-[#243245]/20 pt-2.5">
          SYSTEM COMPILING DONE // ARCHIVE DECODING RATE: 100%
        </div>
      </div>
    </div>
  );
};
export default SettingsModal;
