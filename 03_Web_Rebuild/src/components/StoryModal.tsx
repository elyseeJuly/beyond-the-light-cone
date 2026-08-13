import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { GameEventPayload } from '../types/narrative';
import { ChevronRight, FileText, CheckSquare } from 'lucide-react';
import { GameInstance } from '../core/Game';
import { getImageUrl } from '../utils/assetUrl';
import { useTranslation } from '../utils/i18n';
import { t } from "../utils/i18n";
import { localizeNarrative } from '../data/locales/narrative.en';

interface StoryModalProps {
  event: GameEventPayload;
  onClose: () => void;
}

// Map speaker names dynamically to Gongbi Cyberpunk portrait assets
function getCharacterAvatar(speakerName: string | undefined): string {
  if (!speakerName) return getImageUrl("character_default.png");
  const name = speakerName.toLowerCase();

  // 36 Major Unified Characters
  if (name.includes(t("丁仪"))) return getImageUrl("unified_dingyi_1779691512032.png");
  if (name.includes(t("智子"))) return getImageUrl("unified_sophon_1778921509458.png");
  if (name.includes(t("艾aa")) || name.includes("aa")) return getImageUrl("unified_aiaa_1779691888124.png");
  if (name.includes(t("罗辑"))) return getImageUrl("unified_luoji_1778921262534.png");
  if (name.includes(t("大史")) || name.includes(t("史强"))) return getImageUrl("unified_dashi_1778921331273.png");
  if (name.includes(t("章北海"))) return getImageUrl("unified_beihai_1778921366897.png");
  if (name.includes(t("程心"))) return getImageUrl("unified_chengxin_1778921400346.png");
  if (name.includes(t("叶文洁"))) return getImageUrl("unified_yewenjie_1778921299091.png");
  if (name.includes(t("维德"))) return getImageUrl("unified_wade_1778921437022.png");
  if (name.includes(t("云天明"))) return getImageUrl("unified_tianming_1778921470963.png");
  if (name.includes(t("汪淼"))) return getImageUrl("unified_wangmiao_1779691527760.png");
  if (name.includes(t("希恩斯"))) return getImageUrl("unified_hines_1779691718751.png");
  if (name.includes(t("庄颜"))) return getImageUrl("unified_zhuangyan_1779712921189.png");
  if (name.includes(t("雷迪亚兹"))) return getImageUrl("unified_reydiaz_1779691732536.png");
  if (name.includes(t("泰勒"))) return getImageUrl("unified_tyler_1779691745991.png");
  if (name.includes(t("萨伊"))) return getImageUrl("unified_say_1780649885202.png");
  if (name.includes(t("杨冬"))) return getImageUrl("unified_yangdong_1779691583143.png");
  if (name.includes(t("常伟思"))) return getImageUrl("unified_changweisi_1779691759159.png");
  if (name.includes(t("关一帆"))) return getImageUrl("unified_guanyifan_1779691901857.png");
  if (name.includes(t("林云"))) return getImageUrl("unified_linyun_1779691542667.png");
  if (name.includes(t("伊文斯"))) return getImageUrl("unified_evans_1779691557999.png");
  if (name.includes(t("东方延绪"))) return getImageUrl("unified_dongfang_1779691773663.png");
  if (name.includes(t("沈渊"))) return getImageUrl("unified_shenyuan_1779691919176.png");
  if (name.includes(t("华华"))) return getImageUrl("unified_huahua_1780649946315.png");
  if (name.includes(t("伊依"))) return getImageUrl("unified_yiyi_1780649999542.png");
  if (name.includes(t("霍金"))) return getImageUrl("unified_hawking_1780649926625.png");
  if (name.includes(t("水娃"))) return getImageUrl("unified_shuiwa_1779712987486.png");
  if (name.includes(t("雷志成"))) return getImageUrl("unified_leizhicheng_1779713006589.png");
  if (name.includes(t("杨卫宁"))) return getImageUrl("unified_yangweining_1779713020653.png");
  if (name.includes(t("严井"))) return getImageUrl("unified_yanjing_1780649978771.png");
  if (name.includes(t("白冰"))) return getImageUrl("unified_baibing_1779713036549.png");
  if (name.includes(t("苗福全"))) return getImageUrl("unified_miaofuquan_1779713095135.png");
  if (name.includes(t("滑膛")) || name.includes(t("华堂"))) return getImageUrl("unified_huatang_1779713110568.png");
  if (name.includes(t("朱汉扬"))) return getImageUrl("unified_zhuhanyang_1779713125007.png");
  if (name.includes(t("刘慈欣"))) return getImageUrl("unified_liucixin_1779712937103.png");
  if (name.includes(t("山杉惠子"))) return getImageUrl("unified_keiko_1779713141458.png");

  // NPC Fallbacks (12 NPC Types)
  if (name.includes(t("科学家")) || name.includes(t("研究员")) || name.includes(t("学者")) || name.includes(t("分析"))) return getImageUrl("npc_scientist.png");
  if (name.includes(t("军官")) || name.includes(t("将军")) || name.includes(t("参谋")) || name.includes(t("司令"))) return getImageUrl("npc_military_commander.png");
  if (name.includes(t("秘书长")) || name.includes(t("代表")) || name.includes(t("发言人")) || name.includes(t("执政")) || name.includes(t("总统")) || name.includes(t("总理")) || name.includes(t("主席")) || name.includes(t("部长")) || name.includes(t("局长")) || name.includes(t("官员"))) return getImageUrl("npc_politician.png");
  if (name.includes(t("警官")) || name.includes(t("探员")) || name.includes(t("警察")) || name.includes(t("巡逻"))) return getImageUrl("npc_police.png");
  if (name.includes(t("反叛")) || name.includes(t("反对")) || name.includes(t("叛军")) || name.includes("eto") || name.includes(t("降临派")) || name.includes(t("拯救派"))) return getImageUrl("npc_rebel.png");
  if (name.includes(t("市民")) || name.includes(t("民众")) || name.includes(t("平民")) || name.includes(t("工人")) || name.includes(t("群众")) || name.includes(t("百姓"))) return getImageUrl("npc_civilian.png");
  if (name.includes(t("难民")) || name.includes(t("流民")) || name.includes(t("灾民"))) return getImageUrl("npc_refugee.png");
  if (name.includes(t("工程")) || name.includes(t("技术")) || name.includes(t("维修")) || name.includes(t("建造")) || name.includes(t("机电")) || name.includes(t("矿工"))) return getImageUrl("npc_engineer.png");
  if (name.includes(t("医")) || name.includes(t("护")) || name.includes(t("卫生")) || name.includes(t("心理"))) return getImageUrl("npc_medic.png");
  if (name.includes("ai") || name.includes(t("系统")) || name.includes(t("终端")) || name.includes(t("警报"))) return getImageUrl("npc_ai_terminal.png");
  if (name.includes(t("监听")) || name.includes(t("通讯")) || name.includes(t("信号")) || name.includes(t("信息员"))) return getImageUrl("npc_comms_officer.png");
  if (name.includes(t("商")) || name.includes(t("走私")) || name.includes(t("黑市")) || name.includes(t("老板")) || name.includes(t("贩"))) return getImageUrl("npc_merchant.png");

  return getImageUrl("character_default.png");
}

export const StoryModal: React.FC<StoryModalProps> = ({ event, onClose }) => {
  const { t, lang } = useTranslation();
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [signingChoice, setSigningChoice] = useState<number | null>(null);
  const [cgSrc, setCgSrc] = useState<string>("");
  const typeIndexRef = useRef(0);

  const localizedEvent = useMemo(
    () => localizeNarrative(event, lang),
    [event, lang],
  );
  const currentNode = localizedEvent.dialogQueue[currentNodeIndex];

  // Sync cgSrc when currentNode changes
  useEffect(() => {
    if (currentNode && currentNode.isCG && currentNode.avatarUrl) {
      setCgSrc(currentNode.avatarUrl);
    } else {
      setCgSrc("");
    }
  }, [currentNode]);

  // Reset state when a new event arrives
  useEffect(() => {
    setCurrentNodeIndex(0);
    setDisplayedText("");
    setShowChoices(false);
    setIsTyping(false);
    setSigningChoice(null);
    typeIndexRef.current = 0;
  }, [event.id]);

  // Typewriter effect
  useEffect(() => {
    if (!currentNode || !currentNode.content) return;
    
    setDisplayedText("");
    setIsTyping(true);
    typeIndexRef.current = 0;
    
    const content = t(currentNode.content);
    const timer = setInterval(() => {
      const currentIndex = typeIndexRef.current;
      
      if (currentIndex < content.length) {
        const char = content[currentIndex];
        if (char !== undefined) {
          setDisplayedText((prev) => prev + char);
        }
        typeIndexRef.current += 1;
      } else {
        clearInterval(timer);
        setIsTyping(false);
        if (currentNodeIndex === localizedEvent.dialogQueue.length - 1) {
          setShowChoices(true);
        }
      }
    }, 20);

    return () => clearInterval(timer);
  }, [currentNode, currentNodeIndex, event.id, localizedEvent.dialogQueue.length, t]);

  const handleNext = useCallback(() => {
    if (isTyping) {
      setDisplayedText(t(currentNode.content));
      setIsTyping(false);
      if (currentNodeIndex === localizedEvent.dialogQueue.length - 1) {
        setShowChoices(true);
      }
      return;
    }

    if (currentNodeIndex < localizedEvent.dialogQueue.length - 1) {
      setCurrentNodeIndex(prev => prev + 1);
    }
  }, [isTyping, currentNode, currentNodeIndex, localizedEvent.dialogQueue.length, t]);

  // Generate a mock archive number from event ID/title
  const archiveNumber = useMemo(() => {
    let hash = 0;
    const key = event.title + event.id;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return String(Math.abs(hash) % 100000).padStart(5, '0');
  }, [event.title, event.id]);

  const game = GameInstance.get();
  const epochNames = [t("黄金岁月"), t("危机纪元"), t("威慑纪元"), t("广播纪元"), t("掩体纪元"), t("银河纪元"), t("星屑纪元")];
  const currentEraName = t(epochNames[game.epoch] || t("未知纪元"));

  const handleSelectChoice = (choice: any, idx: number) => {
    setSigningChoice(idx);
    
    // Simulate electronic signature scan before proceeding
    setTimeout(() => {
      choice.action();
      onClose();
    }, 1200);
  };

  const handleAcknowledge = () => {
    setSigningChoice(-1);
    setTimeout(() => {
      onClose();
    }, 800);
  };

  if (!currentNode) return null;

  const hasSpeaker = !!currentNode.speakerName;

  return (
    <div
      className="fixed inset-0 z-[1005] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300 animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      {/* 2-second hologram scan line */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        <div className="absolute inset-x-0 h-[2px] bg-[var(--color-primary)]/10 opacity-30 shadow-[0_0_15px_var(--color-primary)] animate-[hologram-sweep_2s_linear_infinite]" />
      </div>

      {/* Main card box (820px width, 520px height) */}
      <div 
        className={`relative z-20 w-full max-w-[820px] h-[90vh] md:h-[520px] max-h-[90vh] md:max-h-[520px] story-modal-card ${currentNode.isCG ? 'bg-[#070B14]/20' : 'bg-[#070B14]/90'} border border-[var(--color-primary)]/30 shadow-[0_0_40px_rgba(0,184,255,0.15)] flex flex-col md:flex-row rounded select-none animate-[card-unseal_0.5s_cubic-bezier(0.16,1,0.3,1)] overflow-hidden`}
      >
        {/* CG Full-bleed background layer */}
        {currentNode.isCG && (
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <img 
              src={cgSrc || currentNode.avatarUrl || ""} 
              alt="CG Background"
              className="w-full h-full object-contain opacity-[0.95] animate-[gentle-pan_60s_ease-in-out_infinite]"
              onError={() => {
                if (cgSrc && cgSrc.includes('cg_')) {
                  setCgSrc(cgSrc.replace('cg_', 'event_'));
                } else if (cgSrc && !cgSrc.includes('character_default.png')) {
                  setCgSrc(getImageUrl('character_default.png'));
                }
              }}
            />
            {/* Dark overlay at edges to ensure text legibility */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14] via-[#070B14]/30 to-[#070B14]/10" />
          </div>
        )}

        {/* Glow corner decorations */}
        <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-[var(--color-primary)]/50 z-20" />
        <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-[var(--color-primary)]/50 z-20" />
        <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-[var(--color-primary)]/50 z-20" />
        <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-[var(--color-primary)]/50 z-20" />

        {/* Left Panel: Speaker Portrait (split layout) - Hidden during CG events */}
        {hasSpeaker && !currentNode.isCG && (
          <div className="story-modal-portrait hidden md:flex w-[240px] shrink-0 border-r border-[#243245]/30 bg-[#070B14]/45 flex-col justify-end items-center relative overflow-hidden group z-10">
            {/* Holographic scanner grids */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-primary),transparent_1px),linear-gradient(to_bottom,var(--color-primary),transparent_1px)] bg-[size:16px_16px] opacity-[0.03]" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#070B14]/90 via-transparent to-transparent z-10" />
            <div className="absolute inset-0 pointer-events-none z-20">
              <div className="w-full h-[1px] bg-[var(--color-primary)]/30 shadow-[0_0_10px_var(--color-primary)] absolute top-0 animate-[portrait-scan_4s_linear_infinite]" />
            </div>

            {/* Portrait Image */}
            <div className="w-full h-[95%] relative overflow-hidden flex items-end justify-center">
              <img 
                src={currentNode.avatarUrl || getCharacterAvatar(currentNode.speakerName)} 
                alt={currentNode.speakerName} 
                className="w-full h-full object-cover object-center transition-all duration-1000 group-hover:scale-105 filter contrast-110 saturate-[1.1] brightness-[0.85]"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (currentNode.avatarUrl && !target.src.includes('character_default.png')) {
                    // Fallback to character name mapping if avatarUrl fails
                    target.src = getCharacterAvatar(currentNode.speakerName);
                  } else if (!target.src.includes('character_default.png')) {
                    target.src = getImageUrl('character_default.png');
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* Right Panel: Content Section */}
        <div className={`story-modal-content-panel flex-1 flex flex-col justify-between p-4 sm:p-6 relative z-10 ${currentNode.isCG ? 'bg-transparent' : 'bg-[#070B14]/65'} backdrop-blur-[1px]`}>
          {/* 1. Header Metadata block */}
          <div className="story-modal-header flex items-center justify-between border-b border-[#243245]/40 pb-3 shrink-0">
            <div className="flex items-center gap-2">
              <FileText className="text-[var(--color-primary)] w-4 h-4" />
              <span className="text-xs font-title font-bold text-[var(--color-primary)] tracking-widest uppercase">
                {t("银河文明重要战略档案")}
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[10px] text-[var(--text-secondary)]">
              <span>{t("档案编号")}: ARC-{archiveNumber}</span>
              <span>{t("时间节点")}: {currentEraName} {lang === 'en' ? `Year ${game.year}` : t("第 {param0} 年", { param0: game.year })}</span>
            </div>
          </div>

          {/* 2. Main Title */}
          <div className="story-modal-title-area my-2 sm:my-4 shrink-0 text-center">
            <h2 className="text-lg font-extrabold text-white tracking-widest font-title">
              《 {localizedEvent.title.trim().replace(/^【|】$/g, '')} 》
            </h2>
          </div>

          {/* 3. Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#243245] to-transparent shrink-0 mb-4" />

          {/* 4. Text Body */}
          <div className="story-modal-text-body flex-1 overflow-y-auto px-4 space-y-4 mb-4 flex flex-col justify-start">
            {/* Speaker label if speaking */}
            {currentNode.speakerName && (
              <div className="flex flex-col items-center shrink-0">
                <span className="text-[11px] font-title font-bold text-[var(--color-primary)] tracking-widest uppercase border border-[var(--color-primary)]/30 px-2.5 py-0.5 rounded bg-[var(--color-primary)]/5">
                  {t(currentNode.speakerName)} {currentNode.speakerTitle ? ` [ ${t(currentNode.speakerTitle)} ]` : ''}
                </span>
              </div>
            )}

            {/* Typing log */}
            <div className="text-sm font-mono leading-relaxed text-slate-100 text-center tracking-wide px-2 select-text my-auto">
              {displayedText}
              {isTyping && <span className="inline-block w-1.5 h-4 ml-1 bg-[var(--color-primary)] shadow-[0_0_8px_var(--color-primary)] animate-pulse" />}
            </div>
          </div>

          {/* 5. Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#243245] to-transparent shrink-0 mb-4" />

          {/* 6. Signature / Choice Actions block */}
          <div className="shrink-0 flex justify-center pb-2 relative z-20">
            {signingChoice !== null ? (
              <div className="flex flex-col items-center gap-2 text-xs font-mono text-[var(--color-primary)] animate-pulse">
                <div className="flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 animate-spin" />
                  <span>{t("正在执行电子指纹与意识授权签名...")}</span>
                </div>
                <div className="w-48 h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent mt-1" />
              </div>
            ) : !showChoices ? (
              <button 
                onClick={handleNext}
                className="story-proceed-btn px-8 py-3 bg-[rgba(var(--color-primary-rgb),0.15)] border border-[var(--color-primary)]/40 hover:border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.3)] text-[var(--color-primary)] hover:text-white font-bold uppercase tracking-[0.25em] text-xs transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,184,255,0.1)] active:scale-95"
              >
                <span>{isTyping ? t("快速解密") : t("下一页档案")}</span>
                <ChevronRight size={14} className="stroke-[2.5]" />
              </button>
            ) : (
              <div className="flex flex-col gap-3 w-full px-3 sm:px-8">
                <div className="text-[9px] font-title font-bold text-[var(--text-secondary)]/40 tracking-[0.3em] uppercase mb-1 text-center">
                  {t("执政官指令签署授权区")}
                </div>
                <div className="flex flex-col gap-2 w-full max-h-36 overflow-y-auto">
                  {localizedEvent.choices && localizedEvent.choices.length > 0 ? (
                    localizedEvent.choices.map((choice, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSelectChoice(choice, idx)}
                        className="story-choice-btn w-full px-4 py-2.5 bg-[#070B14]/80 border border-[#243245] hover:border-[var(--color-primary)] hover:bg-[rgba(var(--color-primary-rgb),0.05)] hover:shadow-[0_0_15px_rgba(0,184,255,0.15)] text-slate-100 transition-all text-left text-xs flex justify-between items-center group cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono text-[var(--text-secondary)]/50 group-hover:text-[var(--color-primary)] shrink-0">
                            {t("指令")} {idx + 1}
                          </span>
                          <span className="font-bold tracking-wide">{choice.label}</span>
                        </div>
                        <span className="text-[9px] font-mono text-[var(--color-primary)] opacity-0 group-hover:opacity-100 transition-opacity">
                          [ {t("签署决策")} ]
                        </span>
                      </button>
                    ))
                  ) : (
                    <button
                      onClick={handleAcknowledge}
                      className="story-acknowledge-btn w-full py-3 bg-[var(--color-primary)] text-blue-950 font-black uppercase tracking-[0.3em] text-xs hover:brightness-110 transition-all shadow-[0_0_20px_rgba(var(--color-primary-rgb),0.3)] active:scale-95 text-center cursor-pointer"
                    >
                      {t("签署并归档")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes card-unseal {
          from { transform: scale(0.95); opacity: 0; box-shadow: 0 0 0 transparent; }
          to { transform: scale(1); opacity: 1; box-shadow: 0 0 40px rgba(0,184,255,0.15); }
        }
        @keyframes hologram-sweep {
          0% { top: 0%; }
          50% { top: 100%; }
          100% { top: 0%; }
        }
        @keyframes portrait-scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
        @keyframes gentle-pan {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.02) translate(-0.3%, -0.3%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @keyframes pan-zoom {
          0% { transform: scale(1) translate(0, 0); }
          50% { transform: scale(1.03) translate(-0.3%, -0.3%); }
          100% { transform: scale(1) translate(0, 0); }
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .story-modal-card {
            height: 95vh !important;
            max-height: calc(100vh - 16px) !important;
          }
          .story-modal-portrait {
            display: none !important;
          }
          .story-modal-content-panel {
            padding: 0.75rem !important;
          }
          .story-modal-header {
            padding-bottom: 0.5rem !important;
            margin-bottom: 0.25rem !important;
          }
          .story-modal-title-area {
            margin-top: 0.25rem !important;
            margin-bottom: 0.25rem !important;
          }
          .story-modal-title-area h2 {
            font-size: 0.95rem !important;
          }
          .story-modal-text-body {
            margin-bottom: 0.25rem !important;
          }
          .story-modal-text-body p, .story-modal-text-body div {
            font-size: 0.8rem !important;
            line-height: 1.4 !important;
          }
          .story-choice-btn {
            padding-top: 0.35rem !important;
            padding-bottom: 0.35rem !important;
          }
        }
      `}</style>
    </div>
  );
};
