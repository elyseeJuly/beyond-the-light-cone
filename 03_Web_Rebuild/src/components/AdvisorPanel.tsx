import React, { useState, useEffect } from 'react';
import { X, Brain, Database, Shield, Compass, BookOpen, ChevronRight, Search } from 'lucide-react';
import advisorData from '../data/advisor_entries.json';

interface AdvisorPanelProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const AdvisorPanel: React.FC<AdvisorPanelProps> = ({ isOpen: externalIsOpen, onClose }) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('basics');
  const [selectedEntry, setSelectedEntry] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');

  const isVisible = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;

  useEffect(() => {
    const handleOpen = () => setInternalIsOpen(true);
    window.addEventListener('open-advisor-panel', handleOpen);
    return () => window.removeEventListener('open-advisor-panel', handleOpen);
  }, []);

  const handleClose = () => {
    if (onClose) onClose();
    setInternalIsOpen(false);
  };

  if (!isVisible) return null;

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Database': return <Database size={16} />;
      case 'Shield': return <Shield size={16} />;
      case 'Compass': return <Compass size={16} />;
      default: return <BookOpen size={16} />;
    }
  };

  const filteredCategories = advisorData.categories.map(cat => ({
    ...cat,
    entries: cat.entries.filter(e => 
      e.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.detail.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.entries.length > 0);

  const currentCategoryData = (filteredCategories.find(c => c.id === activeCategory) || filteredCategories[0]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-4xl h-[85vh] max-h-[700px] bg-[#070B14]/95 border border-[var(--color-primary)]/40 rounded-lg shadow-[0_0_50px_rgba(0,184,255,0.2)] flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-primary)]/20 bg-[var(--color-primary)]/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/30 rounded-lg">
              <Brain className="w-5 h-5 text-[var(--color-primary)]" />
            </div>
            <div>
              <h2 className="text-base font-title font-bold text-white tracking-widest flex items-center gap-2">
                智脑顾问 · 战术数据百科
                <span className="text-[10px] px-2 py-0.5 bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30 rounded font-mono">
                  v1.0.3
                </span>
              </h2>
              <p className="text-[11px] text-[var(--text-secondary)]">
                执政官战略辅助诊断与百科全书指南
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Search Input */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="搜索策略与机制..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1 bg-black/40 border border-[var(--color-primary)]/30 rounded text-xs text-white placeholder-gray-500 focus:outline-none focus:border-[var(--color-primary)] w-44 transition-all"
              />
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Left Navigation Sidebar */}
          <div className="w-48 sm:w-56 border-r border-[#243245]/50 bg-[#050810]/60 p-3 flex flex-col gap-1 shrink-0 overflow-y-auto">
            <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest px-3 py-1">
              知识分类
            </div>
            {filteredCategories.map(cat => {
              const isActive = cat.id === (currentCategoryData?.id || activeCategory);
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    if (cat.id) setActiveCategory(cat.id);
                    setSelectedEntry(0);
                  }}
                  className={`flex items-center justify-between px-3 py-2.5 rounded text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] font-bold border border-[var(--color-primary)]/40 shadow-[0_0_10px_rgba(0,184,255,0.15)]'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {getIcon(cat.icon)}
                    <span>{cat.name}</span>
                  </div>
                  <ChevronRight size={12} className={`transition-transform ${isActive ? 'rotate-90 text-[var(--color-primary)]' : 'opacity-40'}`} />
                </button>
              );
            })}

            {/* Bottom Status Box */}
            <div className="mt-auto p-3 bg-black/40 border border-[var(--color-primary)]/15 rounded text-[10px] text-gray-400">
              <div className="flex items-center gap-1.5 text-[var(--color-primary)] font-bold mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                智脑在线
              </div>
              智脑提供数据诊断与知识检索，不干涉执政官决策。
            </div>
          </div>

          {/* Middle Entries List & Right Details */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            
            {/* Entry List */}
            <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-[#243245]/50 p-3 flex flex-col gap-2 overflow-y-auto bg-[#070B14]/40 shrink-0">
              <div className="text-[9px] font-mono text-gray-400 uppercase tracking-widest px-1">
                数据节点 ({currentCategoryData?.entries.length || 0})
              </div>
              {currentCategoryData?.entries.map((entry, idx) => {
                const isSelected = selectedEntry === idx;
                return (
                  <button
                    key={entry.title}
                    onClick={() => setSelectedEntry(idx)}
                    className={`p-3 rounded text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/50 text-white shadow-[0_0_12px_rgba(0,184,255,0.1)]'
                        : 'bg-black/20 border-white/5 text-gray-300 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-xs font-bold font-title mb-1 flex items-center justify-between">
                      {entry.title}
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
                    </div>
                    <div className="text-[10px] text-gray-400 line-clamp-2 leading-relaxed">
                      {entry.summary}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Detailed View */}
            <div className="flex-1 p-6 overflow-y-auto flex flex-col gap-4 bg-gradient-to-b from-[#070B14] to-[#04060A]">
              {currentCategoryData && currentCategoryData.entries[selectedEntry] ? (
                <>
                  <div className="border-b border-[var(--color-primary)]/20 pb-3">
                    <span className="text-[10px] text-[var(--color-primary)] font-mono tracking-widest uppercase">
                      [{currentCategoryData.name} / 核心解读]
                    </span>
                    <h3 className="text-lg font-title font-bold text-white tracking-wider mt-1">
                      {currentCategoryData.entries[selectedEntry].title}
                    </h3>
                  </div>

                  {/* Summary Callout */}
                  <div className="p-3 bg-[var(--color-primary)]/10 border-l-2 border-[var(--color-primary)] rounded-r text-xs text-cyan-200 leading-relaxed">
                    {currentCategoryData.entries[selectedEntry].summary}
                  </div>

                  {/* Full Detail */}
                  <div className="text-xs text-gray-300 leading-relaxed font-sans whitespace-pre-line space-y-2 bg-black/20 p-4 border border-white/5 rounded">
                    {currentCategoryData.entries[selectedEntry].detail}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                  暂无匹配数据
                </div>
              )}
            </div>

          </div>

        </div>

        {/* Footer info bar */}
        <div className="px-6 py-2.5 border-t border-[var(--color-primary)]/20 bg-[#050810] flex items-center justify-between text-[10px] text-gray-400">
          <span>提示：智脑顾问可在游戏主界面及游戏内随时通过按钮呼出。</span>
          <button
            onClick={handleClose}
            className="px-4 py-1 bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 border border-[var(--color-primary)]/40 rounded text-white font-bold transition-colors cursor-pointer"
          >
            完成查阅
          </button>
        </div>

      </div>
    </div>
  );
};
