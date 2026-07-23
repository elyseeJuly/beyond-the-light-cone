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

const enDictionary: Record<string, string> = {
  // Navigation & Core HUD
  "光锥之外": "Beyond the Light Cone",
  "纪元往事": "Epoch Chronicles",
  "光锥之外：纪元往事": "Beyond the Light Cone: Epoch Chronicles",
  "战略星图": "Star Map",
  "情报中心": "Intel Center",
  "科技研发": "Tech Tree",
  "政府管理": "Government",
  "内阁政府": "Cabinet Government",
  "岁月史书": "Chronicles",
  "档案同步率": "Archive Sync",
  "智子干扰中": "Sophon Lock Active",
  "基础物理研究已被锁定，科研产出效率衰减 40%。": "Basic physics research is locked. Research efficiency reduced by 40%.",
  "系统设置": "Settings",
  "执政控制中心设置档案": "Executive Control Settings Archive",
  "音频设置": "Audio Settings",
  "语言选择": "Language Selection",
  "显示配置": "Display Settings",
  "性能调度": "Performance Tuning",
  "存档管理": "Save Management",
  "执政帮助": "Executive Manual",
  "制作人员": "Credits",
  "存储与资源": "Storage & Assets",
  "背景音乐与环境音效": "BGM & Environment Audio",
  "背景音乐 (BGM) 启用": "Enable Background Music (BGM)",
  "BGM 音量大小": "BGM Volume",
  "档案语言编码 / Language Select": "Archive Language / Language Select",
  "全息系统界面显示配置": "Holographic Interface Display Settings",
  "高对比度辅助显示": "High Contrast Accessibility Display",
  "提高文本亮度，移除多余虚光滤镜": "Increase text brightness and disable unnecessary bloom filters",
  "背景物理星云粒子密度": "Background Physics Nebula Particle Density",
  "低耗 (0)": "Low Power (0)",
  "中能 (80)": "Medium Power (80)",
  "标准 (200)": "Standard (200)",
  "* 调整背景中星云与尘埃粒子的物理结算数量，中低配置环境推荐调低。": "* Adjusts nebula and dust particles. Recommended lower for mid/low specs.",
  "银河档案馆归档管理器": "Galactic Archives Manager",
  "保存游戏": "Save Game",
  "读取旧档": "Load Save",
  "重置时间线": "Reset Timeline",
  "返回主菜单": "Return to Main Menu",
  "文明执政官操作纲领": "Civilization Executive Strategy Manual",
  "【按键操作映射】": "[Key Mappings]",
  "【执政官战略纲领】": "[Executive Strategy Directives]",
  "1. 稳定度代表你文明生命线的健康度，低于 30% 时面临极高崩溃风险。": "1. Stability represents your civilization's health. Below 30% risks collapse.",
  "2. 逃亡倾向过高将诱发社会失控，请妥善通过社会和文化部疏导控制。": "2. High escape tendency causes social unrest. Manage via Culture and HR.",

  // HUD Stats & Attributes
  "稳定度": "Stability",
  "人口": "Population",
  "资源": "Resources",
  "军力": "Military",
  "威慑度": "Deterrence",
  "文明发展指标详情": "Civilization Development Metrics Detail",
  "经济指数": "Economic Index",
  "文化资产": "Cultural Assets",
  "科技研发度": "Tech Progress",
  "逃亡系数": "Escape Coefficient",
  "防卫军力": "Defense Military",
  "在位执剑人": "Current Swordholder",
  "空缺": "Vacant",
  "智脑顾问": "AI Advisor",
  "智脑托管": "AI Auto-Pilot",
  "手动": "Manual",
  "下一回合": "Next Turn",
  "同步逻辑中": "Syncing Logic",
  "有阻断": "Blocked",
  "黄金岁月": "Golden Era",
  "危机纪元": "Crisis Era",
  "威慑纪元": "Deterrence Era",
  "广播纪元": "Broadcast Era",
  "掩体纪元": "Bunker Era",
  "银河纪元": "Galactic Era",
  "星屑纪元": "Stardust Era",

  // Right Inspector / Planet Info
  "选择一颗星球以查看详情": "Select a celestial object to view details",
  "所属": "Affiliation",
  "无主星域": "Unclaimed Sector",
  "概况": "Overview",
  "建设": "Build",
  "舰队": "Fleet",
  "历史": "History",
  "天体数据概要": "Celestial Body Data Summary",
  "人口承载限额": "Population Capacity",
  "常驻殖民人口": "Colony Population",
  "行政管理比重": "Administration Allocation",
  "采矿占比": "Mining Ratio",
  "加工占比": "Processing Ratio",
  "文化占比": "Culture Ratio",
  "闲置科研与劳动力": "Idle Science & Labor",
  "轨道基础设施计划": "Orbital Infrastructure Plan",
  "资源采矿场 已就绪": "Mining Site Ready",
  "采矿场建造中": "Building Mining Site",
  "筹建采矿场": "Build Mining Site",
  "工业加工厂 已就绪": "Processing Plant Ready",
  "加工厂建造中": "Building Processing Plant",
  "筹建加工厂": "Build Processing Plant",
  "太空星港城市 已就绪": "Spaceport City Ready",
  "城市工程推进中": "Building Spaceport City",
  "筹建太空城市": "Build Spaceport City",
  "消耗 30 经济 | 预估 5 回合": "Cost 30 Eco | Est 5 Turns",
  "消耗 50 经济 | 预估 6 回合": "Cost 50 Eco | Est 6 Turns",
  "消耗 80 经济 | 预估 7 回合": "Cost 80 Eco | Est 7 Turns",
  "驻防与轨道防御力量": "Garrison & Orbital Defense",
  "驻守舰队数量": "Stationed Fleets",
  "当前总威慑度": "Current Total Deterrence",
  "进入舰队指挥中心": "Enter Fleet Command Center",
  "调配、部署及补充战斗编制": "Deploy, assign, and resupply battle units",
  "文明观测与档案纪实": "Civilization Observation & Archives",
  "【母星历史记录】": "[Homeworld History Log]",
  "【殖民档案记载】": "[Colony Archive Log]",
  "执政舰队规模": "Executive Fleet Scale",
  "全局战略威慑平衡": "Global Strategic Deterrence Balance",

  // Cover Screen & Modals
  "地球防卫理事会最高指挥中心": "PDC Supreme Command Center",
  "继续我的文明": "Continue My Civilization",
  "重新构想 (开启引导)": "Reimagine (With Tutorial)",
  "自由探索 (跳过引导)": "Free Exploration (Skip Tutorial)",
  "智脑顾问 · 战术百科": "AI Advisor · Tactical Encyclopedia",
  "文明博物馆": "Civilization Museum",
  "指令说明 / DECISION DESCRIPTION": "Instruction / Decision Description",
  "银河文明重要战略档案": "Galactic Civilization Strategic Archive",
  "档案编号": "Archive ID",
  "时间节点": "Timeline Node",
  "快速解密": "Quick Decrypt",
  "下一页档案": "Next Archive Page",
  "执政官指令签署授权区": "Executive Command Sign-Off Zone",
  "签署决策": "Sign Decision",
  "签署并归档": "Sign & Archive",
  "指令": "Command",
  "【系统崩溃】捕获到全局异常:": "[System Crash] Captured global exception:",
  "银河深空遥测监测中... 文明档案数据链正常。": "Galactic deep-space telemetry active... Data links normal.",

  // Departments & Entities
  "地球": "Earth",
  "太阳系": "Solar System",
  "三体": "Trisolaris",
  "三体文明": "Trisolaran Civilization",
  "歌者文明": "Singer Civilization",
  "边缘文明": "Fringe Civilization",
  "外星文明": "Alien Civilization",
  "经济部": "Ministry of Economy",
  "军事部": "Ministry of Military",
  "文化部": "Ministry of Culture",
  "人力资源部": "Ministry of Human Resources",
  "宇宙社会学": "Astrosociology"
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
  if (!key) return key;
  let val = translations[currentLang]?.[key] || (currentLang === 'en' ? (enDictionary[key] || key) : key);

  // Parameter replacement
  if (params && typeof val === 'string') {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
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
