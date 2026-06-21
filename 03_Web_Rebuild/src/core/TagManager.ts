/**
 * TagManager - Tag 记忆系统 (UEE Layer 1-2)
 *
 * 管理世界标签、角色标签、区域标签、组织标签。
 * 标签是事件系统的核心输入，影响事件权重、生态链、氛围状态。
 *
 * 设计原则：
 * - 标签必须有明确的来源（状态变化或事件触发）
 * - 标签随时间自然衰减，特殊标签不衰减（里程碑）
 * - 角色标签不建立"好感度矩阵"，仅标记"角色与人类社会的宏观关系"
 */

// ===== 类型定义 =====

export interface WorldTag {
  id: string;
  name: string;
  intensity: number;           // 0-100
  firstAppliedYear: number;
  lastReinforcedYear: number;
  source: string;              // 触发来源（事件ID或系统名称）
  isMilestone: boolean;        // 里程碑标签（不衰减）
  category: 'state' | 'social' | 'military' | 'epoch';
}

export interface CharacterTag {
  personName: string;
  tagId: string;
  tagName: string;
  value: number;               // 0-100
  appliedYear: number;
  source: string;
}

// ===== Tag 定义常量表 =====

/** 标准世界标签定义 */
export const STANDARD_TAGS: Record<string, {
  name: string;
  category: WorldTag['category'];
  isMilestone: boolean;
  description: string;
}> = {
  /** 资源/经济状态 */
  resource_depleted:    { name: "资源枯竭",       category: 'state',    isMilestone: false, description: "核心资源低于阈值" },
  resource_surplus:     { name: "资源盈余",       category: 'state',    isMilestone: false, description: "核心资源远超需求" },
  tech_boom:            { name: "科技爆发期",     category: 'state',    isMilestone: false, description: "持续有科技突破" },
  population_crisis:    { name: "人口危机",       category: 'state',    isMilestone: false, description: "人口严重不足" },

  /** 社会状态 */
  civil_unrest:         { name: "民心不稳",       category: 'social',   isMilestone: false, description: "社会动荡加剧" },
  eto_remnant:          { name: "ETO 残余",       category: 'social',   isMilestone: false, description: "地球三体组织残余活动" },
  diplomatic_warming:   { name: "外交缓和",       category: 'social',   isMilestone: false, description: "文明间外交关系趋于缓和" },
  diplomatic_crisis:    { name: "外交危机",       category: 'social',   isMilestone: false, description: "文明间外交关系趋于紧张" },
  new_apostle:          { name: "新降临派",       category: 'social',   isMilestone: false, description: "新降临派思潮蔓延" },
  exile_sentiment:      { name: "逃亡主义蔓延",   category: 'social',   isMilestone: false, description: "逃亡主义成为主流思潮" },
  social_split:         { name: "社会分裂",       category: 'social',   isMilestone: false, description: "社会已分裂为多个派系" },
  underground_gangs:    { name: "地下帮派",       category: 'social',   isMilestone: false, description: "地下世界黑社会组织形成" },
  digital_religion:     { name: "数字教派兴起",   category: 'social',   isMilestone: false, description: "数字生命教派影响力扩大" },

  /** 军事状态 */
  space_force_built:    { name: "太空军建成",     category: 'military', isMilestone: true,  description: "地球太空军正式成立" },
  deterrence_steady:    { name: "威慑稳固",       category: 'military', isMilestone: false, description: "黑暗森林威慑体系稳定运行" },
  deterrence_unstable:  { name: "威慑不稳",       category: 'military', isMilestone: false, description: "威慑度处于危险水平" },
  waterdrop_used:       { name: "水滴已使用",     category: 'military', isMilestone: true,  description: "三体水滴已被部署" },
  foil_imminent:        { name: "二向箔逼近",     category: 'military', isMilestone: true,  description: "二向箔已开始攻击" },
  mil_threat:           { name: "军事威胁升级",   category: 'military', isMilestone: false, description: "外星文明军事威胁加剧" },

  /** 纪元状态 */
  golden_age_deep:      { name: "黄金岁月",       category: 'epoch',    isMilestone: true,  description: "红岸基地建立，发送及接收三体信号，ETO成立前夜" },
  crisis_era_deep:      { name: "危机时代",       category: 'epoch',    isMilestone: true,  description: "人类处于危难时期" },
  deterrence_era:       { name: "威慑纪元",       category: 'epoch',    isMilestone: true,  description: "威慑纪元的主要特征" },
  broadcast_era:        { name: "广播纪元",       category: 'epoch',    isMilestone: true,  description: "广播纪元的事件特征" },
  bunker_era_deep:      { name: "掩体纪元特征",   category: 'epoch',    isMilestone: true,  description: "掩体纪元的事件特征" },
  galaxy_era_deep:      { name: "银河纪元特征",   category: 'epoch',    isMilestone: true,  description: "银河纪元的事件特征" },
};

/** 标准角色立场 Tag 定义 */
export const CHARACTER_STANCE_TAGS: Record<string, {
  name: string;
  description: string;
}> = {
  pro_humanity:       { name: "为人类做贡献",     description: "坚定的拯救人类派" },
  detached:           { name: "脱离社会",         description: "对人类社会失去信心" },
  exile_faction:      { name: "逃亡派",           description: "认为逃亡是唯一出路" },
  betrayer:           { name: "人类叛徒",         description: "转向三体阵营" },
  dark_forest_believer: { name: "黑暗森林信徒",   description: "坚信黑暗森林法则" },
  digital_pursuer:    { name: "数字永生追求者",   description: "追求意识上传" },
};

// ===== TagManager 类 =====

export class TagManager {
  public worldTags: Map<string, WorldTag> = new Map();
  public characterTags: Map<string, CharacterTag[]> = new Map();
  public regionTags: Map<string, WorldTag[]> = new Map();
  public orgTags: Map<string, WorldTag[]> = new Map();

  // ===== 世界标签 =====

  /** 应用世界标签，自动合并相同标签（增强强度） */
  applyWorldTag(
    id: string,
    intensityDelta: number,
    source: string,
    year: number
  ): void {
    const def = STANDARD_TAGS[id];
    if (!def) {
      console.warn(`TagManager: Unknown world tag "${id}"`);
      return;
    }

    const existing = this.worldTags.get(id);
    if (existing) {
      existing.intensity = Math.min(100, existing.intensity + intensityDelta);
      existing.lastReinforcedYear = year;
      existing.source = source;
    } else {
      this.worldTags.set(id, {
        id,
        name: def.name,
        intensity: Math.max(0, Math.min(100, intensityDelta)),
        firstAppliedYear: year,
        lastReinforcedYear: year,
        source,
        isMilestone: def.isMilestone,
        category: def.category,
      });
    }

    this.emitTagChange(id, true);
  }

  /** 设置标签为精确值 */
  setWorldTagIntensity(id: string, intensity: number, year: number, source: string): void {
    const def = STANDARD_TAGS[id];
    if (!def) {
      console.warn(`TagManager: Unknown world tag "${id}"`);
      return;
    }
    this.worldTags.set(id, {
      id, name: def.name,
      intensity: Math.max(0, Math.min(100, intensity)),
      firstAppliedYear: year,
      lastReinforcedYear: year,
      source,
      isMilestone: def.isMilestone,
      category: def.category,
    });
    this.emitTagChange(id, true);
  }

  /** 移除世界标签 */
  removeWorldTag(id: string): void {
    if (this.worldTags.delete(id)) {
      this.emitTagChange(id, false);
    }
  }

  /** 衰减标签（随时间弱化） */
  decayTags(currentYear: number): void {
    for (const [id, tag] of this.worldTags.entries()) {
      if (tag.isMilestone) continue; // 里程碑标签不衰减

      const yearsSinceReinforce = currentYear - tag.lastReinforcedYear;
      if (yearsSinceReinforce > 0) {
        tag.intensity = Math.max(0, tag.intensity - yearsSinceReinforce * 3);
        if (tag.intensity <= 0) {
          this.worldTags.delete(id);
          this.emitTagChange(id, false);
        }
      }
    }
  }

  /** 查询标签是否存在及强度 */
  hasTag(id: string, minIntensity: number = 1): boolean {
    const tag = this.worldTags.get(id);
    return tag !== undefined && tag.intensity >= minIntensity;
  }

  /** 获取标签强度 */
  getTagIntensity(id: string): number {
    return this.worldTags.get(id)?.intensity ?? 0;
  }

  /** 按分类获取标签 */
  getTagsByCategory(category: WorldTag['category']): WorldTag[] {
    return Array.from(this.worldTags.values()).filter(t => t.category === category);
  }

  // ===== 角色标签 =====

  /** 应用角色标签 */
  applyCharacterTag(personName: string, tag: CharacterTag): void {
    const existing = this.characterTags.get(personName) || [];
    const idx = existing.findIndex(t => t.tagId === tag.tagId);
    if (idx >= 0) {
      existing[idx] = { ...tag, value: Math.min(100, existing[idx].value + tag.value) };
    } else {
      existing.push(tag);
    }
    this.characterTags.set(personName, existing);
  }

  /** 获取角色立场标签（优先级最高者） */
  getCharacterStance(personName: string): string | null {
    const tags = this.characterTags.get(personName);
    if (!tags || tags.length === 0) return null;
    return tags.reduce((a, b) => a.value >= b.value ? a : b).tagId;
  }

  /** 获取角色所有标签 */
  getCharacterTags(personName: string): CharacterTag[] {
    return this.characterTags.get(personName) || [];
  }

  // ===== 区域标签 =====

  applyRegionTag(regionName: string, tag: WorldTag): void {
    const existing = this.regionTags.get(regionName) || [];
    existing.push(tag);
    this.regionTags.set(regionName, existing);
  }

  applyOrgTag(orgName: string, tag: WorldTag): void {
    const existing = this.orgTags.get(orgName) || [];
    existing.push(tag);
    this.orgTags.set(orgName, existing);
  }

  // ===== 序列化 =====

  toJSON(): object {
    return {
      worldTags: Array.from(this.worldTags.entries()).map(([k, v]) => ({
        id: k, name: v.name,
        intensity: Math.round(v.intensity),
        firstAppliedYear: v.firstAppliedYear,
        lastReinforcedYear: v.lastReinforcedYear,
        source: v.source,
        isMilestone: v.isMilestone,
        category: v.category,
      })),
      characterTags: Array.from(this.characterTags.entries()).map(([k, v]) => [
        k, v.map(t => ({ ...t, value: Math.round(t.value) }))
      ]),
      regionTags: Array.from(this.regionTags.entries()),
      orgTags: Array.from(this.orgTags.entries()),
    };
  }

  static fromJSON(data: any): TagManager {
    const tm = new TagManager();
    if (data?.worldTags) {
      for (const t of data.worldTags) {
        tm.worldTags.set(t.id, t);
      }
    }
    if (data?.characterTags) {
      for (const [k, v] of data.characterTags) {
        tm.characterTags.set(k, v);
      }
    }
    if (data?.regionTags) {
      for (const [k, v] of data.regionTags) {
        tm.regionTags.set(k, v);
      }
    }
    if (data?.orgTags) {
      for (const [k, v] of data.orgTags) {
        tm.orgTags.set(k, v);
      }
    }
    return tm;
  }

  /** 重置所有标签 */
  reset(): void {
    this.worldTags.clear();
    this.characterTags.clear();
    this.regionTags.clear();
    this.orgTags.clear();
  }

  // ===== 事件触发 =====

  private emitTagChange(tagId: string, applied: boolean): void {
    try {
      window.dispatchEvent(new CustomEvent('game:tag:changed', {
        detail: { tagId, applied, intensity: this.getTagIntensity(tagId) }
      }));
    } catch { /* ignore */ }
  }
}