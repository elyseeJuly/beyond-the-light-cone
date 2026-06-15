import { useState, useEffect } from 'react';

export type Language = 'zh' | 'en';

const translations: Record<Language, Record<string, string>> = {
  zh: {
    "game_title": "光锥之外：纪元往事",
    "next_turn": "下一回合",
    "processing": "处理中...",
    "save_game": "保存存档",
    "settings": "系统设置",
    "help": "帮助教程",
    "starmap": "战略星图",
    "techtree": "科技研发",
    "timeline": "编年史观测",
    "diplomacy": "战略外交",
    "economy": "经济部",
    "military": "军事部",
    "culture": "文化部",
    "humanres": "人力资源部",
    "astrosociology": "宇宙社会学",
    "saving_success": "游戏存档成功！",
    "unlocked_tech": "科技研发完成",
    "labor_shortage": "劳动力短缺",
    "mining_ratio": "采矿比例",
    "factory_ratio": "加工比例",
    "culture_ratio": "文化比例",
    "actual": "实际",
    "people": "人",
    "idle_workers": "闲置工人",
    "cooldown": "外交冷却中",
    "wait_turns": "需等待 {turns} 回合",
    "event_diversity": "事件多样性观测",
    "unique_trigger_rate": "独特事件触发率",
    "high_contrast": "切换高对比度"
  },
  en: {
    "game_title": "Beyond the Light Cone: Epoch Chronicles",
    "next_turn": "Next Turn",
    "processing": "Processing...",
    "save_game": "Save Game",
    "settings": "Settings",
    "help": "Help/Tutorial",
    "starmap": "Star Map",
    "techtree": "Tech Tree",
    "timeline": "Chronicle",
    "diplomacy": "Diplomacy",
    "economy": "Economy",
    "military": "Military",
    "culture": "Culture",
    "humanres": "Human Resources",
    "astrosociology": "Astrosociology",
    "saving_success": "Game saved successfully!",
    "unlocked_tech": "Technology Unlocked",
    "labor_shortage": "Labor Shortage",
    "mining_ratio": "Mining Ratio",
    "factory_ratio": "Processing Ratio",
    "culture_ratio": "Culture Ratio",
    "actual": "Actual",
    "people": "workers",
    "idle_workers": "Idle Workers",
    "cooldown": "Diplomacy Cooldown",
    "wait_turns": "Wait {turns} turns",
    "event_diversity": "Event Diversity",
    "unique_trigger_rate": "Unique Trigger Rate",
    "high_contrast": "High Contrast"
  }
};

let currentLang: Language = (localStorage.getItem('game-lang') as Language) || 'zh';
const listeners = new Set<() => void>();

export const getLanguage = (): Language => currentLang;

export const setLanguage = (lang: Language): void => {
  currentLang = lang;
  localStorage.setItem('game-lang', lang);
  listeners.forEach(l => l());
  // Dispatch global window event to trigger non-React listeners
  window.dispatchEvent(new CustomEvent('game-language-changed', { detail: lang }));
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  let val = translations[currentLang][key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(`{${k}}`, String(v));
    });
  }
  return val;
};

export const useTranslation = () => {
  const [lang, setLangState] = useState<Language>(currentLang);

  useEffect(() => {
    const handleUpdate = () => setLangState(currentLang);
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  return { t, lang, setLanguage };
};
