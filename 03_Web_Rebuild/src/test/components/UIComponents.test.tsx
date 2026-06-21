import { describe, it, expect } from 'vitest';

// ─── Test Helpers (extracted from component logic) ───

/**
 * Format population display (TopHUD pattern: "${pop}M")
 */
function formatPopulation(pop: number): string {
  return `${pop}M`;
}

/**
 * Format large resource numbers with abbreviation
 */
function formatResource(res: number): string {
  if (res >= 1000000) return `${(res / 1000000).toFixed(1)}M`;
  if (res >= 1000) return `${(res / 1000).toFixed(1)}K`;
  return res.toString();
}

/**
 * Stability color class logic (TopHUD stabilityColor useMemo)
 */
function getStabilityColor(stability: number): string {
  if (stability >= 80) return "text-emerald-400";
  if (stability >= 60) return "text-cyan-400";
  if (stability >= 30) return "text-amber-500";
  return "text-red-500 animate-pulse";
}

/**
 * Epoch name resolution (TopHUD epochNames array)
 */
function getEpochName(epoch: number): string {
  const names = ["黄金岁月", "危机纪元", "威慑纪元", "广播纪元", "掩体纪元", "银河纪元", "星屑纪元"];
  return names[epoch] || "未知纪元";
}

/**
 * Epoch English name resolution (TopHUD epochNamesEn array)
 */
function getEpochNameEn(epoch: number): string {
  const names = ["GOLDEN ERA", "CRISIS ERA", "DETERRENCE ERA", "BROADCAST ERA", "BUNKER ERA", "GALACTIC ERA", "STARDUST ERA"];
  return names[epoch] || "UNKNOWN ERA";
}

/**
 * Civilization level label (Civilization.getCiviLevelLabel logic)
 */
function getCiviLevelLabel(level: number): string {
  const levels = ["荒蛮文明", "工业文明", "星际文明", "银河文明", "超维文明"];
  return levels[Math.min(level, levels.length - 1)];
}

/**
 * Stability breakdown calculation (TopHUD stats useMemo logic)
 */
function calculateStability(
  eco: number, army: number, treachery: number,
  finishedTechs: number, totalTechs: number, cul: number
): { stability: number; factors: Record<string, number> } {
  const econFactor = Math.min(25, (eco / 120) * 25);
  const armyFactor = Math.min(25, (army / 25) * 25);
  const treacheryPenalty = treachery * 0.4;
  const techFactor = Math.min(25, (finishedTechs / Math.max(1, totalTechs)) * 25);
  const cultureFactor = Math.min(25, (cul / 100) * 25);

  const raw = econFactor + armyFactor + techFactor + cultureFactor + (40 - treacheryPenalty);
  const stability = Math.max(5, Math.min(100, Math.floor(raw)));

  return {
    stability,
    factors: { econFactor, armyFactor, treacheryPenalty, techFactor, cultureFactor }
  };
}

/**
 * Tech progress percentage (TopHUD techProgress logic)
 */
function calculateTechProgress(finished: number, total: number): number {
  return Math.floor((finished / Math.max(1, total)) * 100);
}

/**
 * Friendship type to Chinese label
 */
function getFriendshipLabel(friendship: number): string {
  const labels = ["极度敌视", "敌视", "中立", "友好", "亲密"];
  return labels[friendship] ?? "未知";
}

/**
 * Victory type to Chinese name
 */
function getVictoryTypeLabel(type: number): string {
  const labels = ["征服胜利", "威慑胜利", "黑域胜利", "流浪胜利", "数字永生", "死神永生"];
  return labels[type] ?? "未知胜利";
}

/**
 * Defeat type to Chinese name
 */
function getDefeatTypeLabel(type: number): string {
  const labels = ["逃亡失败", "文明灭绝", "氦闪毁灭", "维度打击"];
  return labels[type] ?? "未知失败";
}

/**
 * Battle report summary generation
 */
function getBattleSummary(attackPower: number, defensePower: number): string {
  if (attackPower > defensePower) return "进攻方优势";
  if (attackPower < defensePower) return "防守方优势";
  return "势均力敌";
}

/**
 * Deterrence level description
 */
function getDeterrenceLabel(value: number): string {
  if (value >= 80) return "绝对威慑";
  if (value >= 50) return "有效威慑";
  if (value >= 20) return "有限威慑";
  return "威慑失效";
}

/**
 * Event severity label
 */
function getEventSeverityLabel(effectType: number): string {
  const labels = ["普通事件", "字符串事件", "随机事件"];
  return labels[effectType] ?? "未知类型";
}

/**
 * Alliance status text
 */
function getAllianceStatusText(isBund: boolean, friendship: number): string {
  if (isBund) return "已臣服";
  if (friendship >= 4) return "亲密联盟";
  if (friendship >= 3) return "友好关系";
  if (friendship >= 2) return "中立关系";
  if (friendship >= 1) return "敌视关系";
  return "极度敌视";
}

// ─── Tests ───

describe('格式化函数', () => {
  describe('formatPopulation', () => {
    it('应该将人口数字格式化为 "65M" 形式', () => {
      expect(formatPopulation(65)).toBe('65M');
    });

    it('应该处理人口为 0', () => {
      expect(formatPopulation(0)).toBe('0M');
    });

    it('应该处理大人口数字', () => {
      expect(formatPopulation(12345)).toBe('12345M');
    });
  });

  describe('formatResource', () => {
    it('应该保留小数字为字符串', () => {
      expect(formatResource(200)).toBe('200');
    });

    it('应该将 1000+ 格式化为 K 单位', () => {
      expect(formatResource(1500)).toBe('1.5K');
    });

    it('应该将 1000000+ 格式化为 M 单位', () => {
      expect(formatResource(2500000)).toBe('2.5M');
    });

    it('应该处理资源为 0', () => {
      expect(formatResource(0)).toBe('0');
    });
  });

  describe('calculateTechProgress', () => {
    it('0/0 技术进度应为 0', () => {
      expect(calculateTechProgress(0, 0)).toBe(0);
    });

    it('5/10 技术进度应为 50', () => {
      expect(calculateTechProgress(5, 10)).toBe(50);
    });

    it('所有技术完成应为 100', () => {
      expect(calculateTechProgress(10, 10)).toBe(100);
    });
  });
});

describe('稳定度逻辑', () => {
  describe('getStabilityColor', () => {
    it('稳定度 >= 80 应返回翠绿色', () => {
      expect(getStabilityColor(85)).toBe('text-emerald-400');
      expect(getStabilityColor(100)).toBe('text-emerald-400');
      expect(getStabilityColor(80)).toBe('text-emerald-400');
    });

    it('稳定度 60-79 应返回青色', () => {
      expect(getStabilityColor(60)).toBe('text-cyan-400');
      expect(getStabilityColor(75)).toBe('text-cyan-400');
    });

    it('稳定度 30-59 应返回琥珀色', () => {
      expect(getStabilityColor(30)).toBe('text-amber-500');
      expect(getStabilityColor(45)).toBe('text-amber-500');
    });

    it('稳定度 < 30 应返回红色闪烁', () => {
      expect(getStabilityColor(29)).toBe('text-red-500 animate-pulse');
      expect(getStabilityColor(0)).toBe('text-red-500 animate-pulse');
      expect(getStabilityColor(5)).toBe('text-red-500 animate-pulse');
    });
  });

  describe('calculateStability', () => {
    it('平衡发展应产生中高稳定度', () => {
      const result = calculateStability(100, 20, 10, 5, 20, 80);
      expect(result.stability).toBeGreaterThanOrEqual(40);
      expect(result.stability).toBeLessThanOrEqual(100);
    });

    it('高逃亡度应大幅降低稳定度', () => {
      const lowTreachery = calculateStability(100, 20, 10, 5, 20, 80);
      const highTreachery = calculateStability(100, 20, 80, 5, 20, 80);
      expect(highTreachery.stability).toBeLessThan(lowTreachery.stability);
    });

    it('稳定度不低于 5', () => {
      const result = calculateStability(0, 0, 100, 0, 10, 0);
      expect(result.stability).toBeGreaterThanOrEqual(5);
    });

    it('稳定度不超过 100', () => {
      const result = calculateStability(999, 999, 0, 100, 100, 999);
      expect(result.stability).toBeLessThanOrEqual(100);
    });

    it('逃亡惩罚应为 逃亡度 * 0.4', () => {
      const result = calculateStability(0, 0, 50, 0, 10, 0);
      expect(result.factors.treacheryPenalty).toBe(20);
    });
  });
});

describe('纪元与文明等级', () => {
  describe('getEpochName', () => {
    it('应返回纪元的正确中文名', () => {
      expect(getEpochName(0)).toBe('黄金岁月');
      expect(getEpochName(1)).toBe('危机纪元');
      expect(getEpochName(2)).toBe('威慑纪元');
      expect(getEpochName(3)).toBe('广播纪元');
      expect(getEpochName(4)).toBe('掩体纪元');
      expect(getEpochName(5)).toBe('银河纪元');
      expect(getEpochName(6)).toBe('星屑纪元');
    });

    it('越界纪元应返回 "未知纪元"', () => {
      expect(getEpochName(7)).toBe('未知纪元');
      expect(getEpochName(-1)).toBe('未知纪元');
    });
  });

  describe('getEpochNameEn', () => {
    it('应返回纪元的正确英文名', () => {
      expect(getEpochNameEn(0)).toBe('GOLDEN ERA');
      expect(getEpochNameEn(1)).toBe('CRISIS ERA');
      expect(getEpochNameEn(2)).toBe('DETERRENCE ERA');
      expect(getEpochNameEn(3)).toBe('BROADCAST ERA');
      expect(getEpochNameEn(4)).toBe('BUNKER ERA');
      expect(getEpochNameEn(5)).toBe('GALACTIC ERA');
      expect(getEpochNameEn(6)).toBe('STARDUST ERA');
    });

    it('越界纪元应返回 "UNKNOWN ERA"', () => {
      expect(getEpochNameEn(99)).toBe('UNKNOWN ERA');
    });
  });

  describe('getCiviLevelLabel', () => {
    it('应返回文明等级的对应标签', () => {
      expect(getCiviLevelLabel(0)).toBe('荒蛮文明');
      expect(getCiviLevelLabel(1)).toBe('工业文明');
      expect(getCiviLevelLabel(2)).toBe('星际文明');
      expect(getCiviLevelLabel(3)).toBe('银河文明');
      expect(getCiviLevelLabel(4)).toBe('超维文明');
    });

    it('越界等级应返回最后一个已知标签', () => {
      expect(getCiviLevelLabel(5)).toBe('超维文明');
      expect(getCiviLevelLabel(99)).toBe('超维文明');
    });
  });
});

describe('状态与关系文本', () => {
  describe('getFriendshipLabel', () => {
    it('应返回正确的外交关系标签', () => {
      expect(getFriendshipLabel(0)).toBe('极度敌视');
      expect(getFriendshipLabel(1)).toBe('敌视');
      expect(getFriendshipLabel(2)).toBe('中立');
      expect(getFriendshipLabel(3)).toBe('友好');
      expect(getFriendshipLabel(4)).toBe('亲密');
    });

    it('越界关系应返回 "未知"', () => {
      expect(getFriendshipLabel(99)).toBe('未知');
    });
  });

  describe('getVictoryTypeLabel', () => {
    it('应返回正确的胜利类型中文名', () => {
      expect(getVictoryTypeLabel(0)).toBe('征服胜利');
      expect(getVictoryTypeLabel(1)).toBe('威慑胜利');
      expect(getVictoryTypeLabel(2)).toBe('黑域胜利');
      expect(getVictoryTypeLabel(3)).toBe('流浪胜利');
      expect(getVictoryTypeLabel(4)).toBe('数字永生');
      expect(getVictoryTypeLabel(5)).toBe('死神永生');
    });
  });

  describe('getDefeatTypeLabel', () => {
    it('应返回正确的失败类型中文名', () => {
      expect(getDefeatTypeLabel(0)).toBe('逃亡失败');
      expect(getDefeatTypeLabel(1)).toBe('文明灭绝');
      expect(getDefeatTypeLabel(2)).toBe('氦闪毁灭');
      expect(getDefeatTypeLabel(3)).toBe('维度打击');
    });
  });

  describe('getAllianceStatusText', () => {
    it('已臣服的文明应返回 "已臣服"', () => {
      expect(getAllianceStatusText(true, 0)).toBe('已臣服');
      expect(getAllianceStatusText(true, 4)).toBe('已臣服');
    });

    it('应基于友好度返回正确的关系状态', () => {
      expect(getAllianceStatusText(false, 4)).toBe('亲密联盟');
      expect(getAllianceStatusText(false, 3)).toBe('友好关系');
      expect(getAllianceStatusText(false, 2)).toBe('中立关系');
      expect(getAllianceStatusText(false, 1)).toBe('敌视关系');
      expect(getAllianceStatusText(false, 0)).toBe('极度敌视');
    });
  });
});

describe('战斗与威慑', () => {
  describe('getBattleSummary', () => {
    it('攻击力大于防御力应判定进攻方优势', () => {
      expect(getBattleSummary(100, 50)).toBe('进攻方优势');
    });

    it('攻击力小于防御力应判定防守方优势', () => {
      expect(getBattleSummary(50, 100)).toBe('防守方优势');
    });

    it('战力相等应判定势均力敌', () => {
      expect(getBattleSummary(75, 75)).toBe('势均力敌');
    });
  });

  describe('getDeterrenceLabel', () => {
    it('威慑值 >= 80 应为绝对威慑', () => {
      expect(getDeterrenceLabel(80)).toBe('绝对威慑');
      expect(getDeterrenceLabel(100)).toBe('绝对威慑');
    });

    it('威慑值 50-79 应为有效威慑', () => {
      expect(getDeterrenceLabel(50)).toBe('有效威慑');
      expect(getDeterrenceLabel(65)).toBe('有效威慑');
    });

    it('威慑值 20-49 应为有限威慑', () => {
      expect(getDeterrenceLabel(20)).toBe('有限威慑');
      expect(getDeterrenceLabel(35)).toBe('有限威慑');
    });

    it('威慑值 < 20 应为威慑失效', () => {
      expect(getDeterrenceLabel(19)).toBe('威慑失效');
      expect(getDeterrenceLabel(0)).toBe('威慑失效');
    });
  });

  describe('getEventSeverityLabel', () => {
    it('应返回正确的事件类型标签', () => {
      expect(getEventSeverityLabel(0)).toBe('普通事件');
      expect(getEventSeverityLabel(1)).toBe('字符串事件');
      expect(getEventSeverityLabel(2)).toBe('随机事件');
    });
  });
});