/**
 * endingConfig.ts — 大结局配置中心
 *
 * 定义 6 种胜利结局 + 3 种失败结局的差异化视觉与文案配置。
 * 场景配图路径为预留占位，待 AI 生成后替换。
 * 主题曲路径预留为 public/audio/theme_song.mp3
 */

import { VictoryType, DefeatType } from '../types/enums';

export type EndingKey =
  | 'CONQUEST'
  | 'DETERRENCE'
  | 'DARK_DOMAIN'
  | 'WANDERING'
  | 'DIGITAL'
  | 'HIDDEN'
  | 'DEFEAT_TREACHERY'
  | 'DEFEAT_EXTINCTION'
  | 'DEFEAT_HELIUM_FLASH';

export interface EndingConfig {
  key: EndingKey;
  title: string;
  subtitle: string;
  declaration: string;       // Phase 1 旁白独白
  epilogue: string;          // Phase 2 补充说明
  gradientFrom: string;      // 背景渐变起点
  gradientTo: string;        // 背景渐变终点
  accentColor: string;       // 强调色
  particleColor: string;     // 粒子颜色
  particleEffect: 'starfield' | 'ripple' | 'collapse' | 'thrust' | 'matrix' | 'kaleidoscope' | 'shatter' | 'ember' | 'flash';
  sceneImage: string;        // 专属场景配图路径（预留）
  iconSymbol: string;        // Emoji/符号标识
  isVictory: boolean;
}

/** 正常游戏背景音乐："岁月底座" */
export const GAMEPLAY_BGM_PATH = '/audio/years_base.mp3';

/** 大结局主题曲："星屑" */
export const FINALE_THEME_PATH = '/audio/stardust.mp3';

/** Credits 制作人员名单 */
export const CREDITS_LIST = [
  { role: '策划 & 原始设计', name: '宇宙群英传 原作团队' },
  { role: 'Web 重构开发', name: 'Emberois Studio' },
  { role: '叙事系统设计', name: 'Emberois Studio' },
  { role: '角色美术', name: 'AI Assisted Generation' },
  { role: '音乐', name: '待定 (TBD)' },
  { role: '灵感来源', name: '《三体》三部曲 — 刘慈欣' },
  { role: '特别感谢', name: '所有试玩者与贡献者' },
];

/** 9 种结局配置 */
export const ENDING_CONFIGS: Record<EndingKey, EndingConfig> = {
  CONQUEST: {
    key: 'CONQUEST',
    title: '征服胜利',
    subtitle: '暗夜之猎 · 最终裁决',
    declaration: '黑暗森林的猎手倒在了自己的猎场。当最后一个异星文明的旗帜降下，人类第一次在这片冰冷的宇宙中，以绝对的力量宣告了自己的存在。',
    epilogue: '这是用铁与火书写的篇章。或许有一天，银河系的废墟之上会有新的文明诞生，而他们会在古老的信号残骸中读到人类的名字——并颤抖。',
    gradientFrom: '#1a0000',
    gradientTo: '#FF4500',
    accentColor: '#FFD700',
    particleColor: '#FF6347',
    particleEffect: 'starfield',
    sceneImage: '/images/ending_conquest.png',
    iconSymbol: '⚔️',
    isVictory: true,
  },
  DETERRENCE: {
    key: 'DETERRENCE',
    title: '威慑胜利',
    subtitle: '剑柄之握 · 脆弱的和平',
    declaration: '手持毁灭的按钮，守住了脆弱的和平。执剑人从未按下按钮，但正是这份按下按钮的决心，让黑暗森林中的每一个猎手都选择了沉默。',
    epilogue: '和平不是友善的馈赠，而是恐惧的产物。执剑人孤独地站在人类文明的最前沿，用自己的灵魂为全人类铸起了一面看不见的盾牌。',
    gradientFrom: '#050A2E',
    gradientTo: '#6A1B9A',
    accentColor: '#B388FF',
    particleColor: '#7C4DFF',
    particleEffect: 'ripple',
    sceneImage: '/images/ending_deterrence.png',
    iconSymbol: '🗡️',
    isVictory: true,
  },
  DARK_DOMAIN: {
    key: 'DARK_DOMAIN',
    title: '黑域胜利',
    subtitle: '光速墓碑 · 永恒琥珀',
    declaration: '将家园永远封印在时间的琥珀中。当光速在这片区域降至零，太阳系变成了一个安全的宇宙孤岛——黑暗森林的法则在这里失效了。',
    epilogue: '这是人类向宇宙发出的安全声明：我们不会伤害任何人，也请不要伤害我们。从此，太阳系成为银河中一颗永远不会熄灭的琥珀。',
    gradientFrom: '#0A0A0A',
    gradientTo: '#1A1A2E',
    accentColor: '#CFD8DC',
    particleColor: '#90A4AE',
    particleEffect: 'collapse',
    sceneImage: '/images/ending_dark_domain.png',
    iconSymbol: '🕳️',
    isVictory: true,
  },
  WANDERING: {
    key: 'WANDERING',
    title: '流浪胜利',
    subtitle: '星辰大海 · 行星远征',
    declaration: '太阳即将毁灭，而我们带着故乡远行。地球脱离了太阳系的引力束缚，行星发动机的蓝色火焰划破了亿万年来未曾改变的夜空。',
    epilogue: '流浪的旅途将持续两千五百年。在漫长的航行中，一代又一代人出生、成长、老去，从未见过真正的太阳。但他们知道，前方有一颗新的恒星在等待。',
    gradientFrom: '#1A0A00',
    gradientTo: '#FF6F00',
    accentColor: '#FFE082',
    particleColor: '#FF8F00',
    particleEffect: 'thrust',
    sceneImage: '/images/ending_wandering.png',
    iconSymbol: '🌍',
    isVictory: true,
  },
  DIGITAL: {
    key: 'DIGITAL',
    title: '数字永生',
    subtitle: '意识方舟 · 超越碳基',
    declaration: '肉体消逝，但人类文明化为永恒的代码。当最后一批意识完成上传，数字方舟载着全人类的记忆、情感和梦想，驶向了虚拟的无限宇宙。',
    epilogue: '在数字世界中，每个人都拥有无限的时间和空间。死亡被定义为"选择性离线"，而爱则是两段代码的永恒纠缠。人类终于超越了宇宙对碳基生命的一切限制。',
    gradientFrom: '#001A33',
    gradientTo: '#AA00FF',
    accentColor: '#00E5FF',
    particleColor: '#00BCD4',
    particleEffect: 'matrix',
    sceneImage: '/images/ending_digital.png',
    iconSymbol: '🧬',
    isVictory: true,
  },
  HIDDEN: {
    key: 'HIDDEN',
    title: '死神永生 · 小宇宙',
    subtitle: '归零之选 · 宇宙很大，生活更大',
    declaration: '归零者的讯息穿越了亿万光年到达你的手中："尊敬的文明，大宇宙正在因质量缺失而走向热寂。请将您的小宇宙中的质量归还。"你望着这片只属于人类的伊甸园，做出了最终的选择——',
    epilogue: '"把质量还给大宇宙吧——为了那些还没有诞生的故事。" 人类文明的火种化为一枚生态球，漂浮在新宇宙的起点。五磅的世界里，蓝色地球永恒旋转。宇宙很大，生活更大。',
    gradientFrom: '#FAFAFA',
    gradientTo: '#E8D5B7',
    accentColor: '#FFD700',
    particleColor: '#E0E0E0',
    particleEffect: 'kaleidoscope',
    sceneImage: '/images/ending_hidden.png',
    iconSymbol: '🌌',
    isVictory: true,
  },
  DEFEAT_TREACHERY: {
    key: 'DEFEAT_TREACHERY',
    title: '文明崩溃',
    subtitle: '逃亡主义失控 · 内部瓦解',
    declaration: '人类在恐惧中抛弃了彼此。当逃亡主义的浪潮吞没了最后的秩序，没有外敌入侵，没有宇宙灾难——文明在自己的内耗中走向了终结。',
    epilogue: '散落在银河各处的逃亡飞船再也没有汇聚。每一个孤独的殖民地都在沉默中衰落，最终化为星际尘埃。黑暗森林不需要猎手——恐惧本身就是最好的猎手。',
    gradientFrom: '#1C1C1C',
    gradientTo: '#8B0000',
    accentColor: '#FF5252',
    particleColor: '#B71C1C',
    particleEffect: 'shatter',
    sceneImage: '/images/ending_defeat_treachery.png',
    iconSymbol: '💔',
    isVictory: false,
  },
  DEFEAT_EXTINCTION: {
    key: 'DEFEAT_EXTINCTION',
    title: '文明灭绝',
    subtitle: '最后的沉默 · 死寂星球',
    declaration: '最后的光芒，也在沉默中熄灭。地球已成为一颗死寂的星球，曾经繁华的城市被尘埃覆盖，曾经的喧嚣化为永恒的寂静。',
    epilogue: '亿万年后，某个路过太阳系的文明探测器扫描到了第三颗行星。它们在报告中写道："该行星曾存在初级文明活动迹象，但已完全消亡。原因不明。"',
    gradientFrom: '#000000',
    gradientTo: '#2C2C2C',
    accentColor: '#616161',
    particleColor: '#424242',
    particleEffect: 'ember',
    sceneImage: '/images/ending_defeat_extinction.png',
    iconSymbol: '💀',
    isVictory: false,
  },
  DEFEAT_HELIUM_FLASH: {
    key: 'DEFEAT_HELIUM_FLASH',
    title: '太阳氦闪',
    subtitle: '恒星终焉 · 灰飞烟灭',
    declaration: '当恒星燃尽，一切皆成灰烬。太阳在膨胀中吞噬了水星、金星，最终的耀眼白光瞬间蒸发了地球上的一切。漫长的等待终结于刺眼的光芒。',
    epilogue: '人类曾有四百年的时间准备逃离。但争吵、犹豫、内斗消耗了一切。当氦闪的白光穿透大气层的那一刻，所有的遗憾都来不及说出口。',
    gradientFrom: '#FFFFFF',
    gradientTo: '#1A0A00',
    accentColor: '#FF6F00',
    particleColor: '#FFAB00',
    particleEffect: 'flash',
    sceneImage: '/images/ending_defeat_helium_flash.png',
    iconSymbol: '☀️',
    isVictory: false,
  },
};

/**
 * 根据游戏状态获取对应的结局配置 Key
 */
export function resolveEndingKey(
  victoryType: VictoryType | null,
  defeatType: DefeatType | null,
): EndingKey {
  if (victoryType !== null) {
    const map: Record<number, EndingKey> = {
      [VictoryType.CONQUEST]: 'CONQUEST',
      [VictoryType.DETERRENCE]: 'DETERRENCE',
      [VictoryType.DARK_DOMAIN]: 'DARK_DOMAIN',
      [VictoryType.WANDERING]: 'WANDERING',
      [VictoryType.DIGITAL]: 'DIGITAL',
      [VictoryType.HIDDEN]: 'HIDDEN',
    };
    return map[victoryType] || 'CONQUEST';
  }

  if (defeatType !== null) {
    const map: Record<number, EndingKey> = {
      [DefeatType.TREACHERY]: 'DEFEAT_TREACHERY',
      [DefeatType.EXTINCTION]: 'DEFEAT_EXTINCTION',
      [DefeatType.HELIUM_FLASH]: 'DEFEAT_HELIUM_FLASH',
    };
    return map[defeatType] || 'DEFEAT_EXTINCTION';
  }

  return 'DEFEAT_EXTINCTION';
}
