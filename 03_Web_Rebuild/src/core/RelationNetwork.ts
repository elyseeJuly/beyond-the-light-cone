/**
 * RelationNetwork - 角色关系网络 (UEE Layer 3-5)
 *
 * 跟踪角色之间的宏观关系，聚焦"角色与人类社会的宏观关系"。
 * 不建立复杂的"好感度矩阵"，保持简约。
 *
 * 关系类型：
 * - ALLY: 盟友
 * - RIVAL: 宿敌
 * - BETRAYER: 背叛者
 * - MENTOR: 导师/传承
 * - NEUTRAL: 中性
 */

import { TagManager } from "./TagManager";

export type RelationType = 'ALLY' | 'RIVAL' | 'BETRAYER' | 'MENTOR' | 'NEUTRAL';

export interface CharacterRelation {
  personA: string;
  personB: string;
  relationType: RelationType;
  establishedYear: number;
  intensity: number; // 0-100
  source: string;    // 事件或系统触发
}

export class RelationNetwork {
  public relations: CharacterRelation[] = [];

  /** 建立关系 */
  establishRelation(
    personA: string,
    personB: string,
    type: RelationType,
    year: number,
    source: string,
    intensity: number = 50
  ): void {
    // 移除已有的相同关系
    this.relations = this.relations.filter(
      r => !(r.personA === personA && r.personB === personB && r.relationType === type)
    );

    this.relations.push({
      personA, personB, relationType: type,
      establishedYear: year, intensity, source,
    });
  }

  /** 事件影响关系强度 */
  modifyRelationByEvent(personA: string, personB: string, delta: number): void {
    for (const rel of this.relations) {
      if ((rel.personA === personA && rel.personB === personB) || (rel.personA === personB && rel.personB === personA)) {
        rel.intensity = Math.max(0, Math.min(100, rel.intensity + delta));
      }
    }
  }

  /** 修改关系强度别名 */
  modifyRelation(personA: string, personB: string, delta: number): void {
    const rel = this.getRelation(personA, personB);
    if (!rel) {
      const type: RelationType = delta > 0 ? 'ALLY' : 'RIVAL';
      this.establishRelation(personA, personB, type, 0, 'diplomacy', 50 + delta);
    } else {
      this.modifyRelationByEvent(personA, personB, delta);
    }
  }

  /** 每回合自然更新与衰减关系 */
  updateRelations(tagManager: TagManager): void {
    for (const rel of this.relations) {
      if (rel.relationType === 'ALLY') {
        if (tagManager.hasTag('diplomatic_warming')) rel.intensity = Math.min(100, rel.intensity + 1);
        else rel.intensity = Math.max(0, rel.intensity - 0.5); // 自然衰减
      } else if (rel.relationType === 'RIVAL') {
        if (tagManager.hasTag('diplomatic_crisis')) rel.intensity = Math.min(100, rel.intensity + 1);
        else rel.intensity = Math.max(0, rel.intensity - 0.5);
      }
    }
  }

  /** 查询两角色关系 */
  getRelation(personA: string, personB: string): CharacterRelation | null {
    return this.relations.find(
      r => (r.personA === personA && r.personB === personB) ||
           (r.personA === personB && r.personB === personA)
    ) || null;
  }

  /** 获取某角色的所有关系 */
  getPersonRelations(personName: string): CharacterRelation[] {
    return this.relations.filter(
      r => r.personA === personName || r.personB === personName
    );
  }

  /** 计算关系评分（用于事件权重） */
  getRelationScore(query: { personA?: string; personB?: string; type?: RelationType }): number {
    let count = 0;
    let totalIntensity = 0;

    for (const rel of this.relations) {
      if (query.personA && query.personA !== rel.personA && query.personA !== rel.personB) continue;
      if (query.personB && query.personB !== rel.personA && query.personB !== rel.personB) continue;
      if (query.type && query.type !== rel.relationType) continue;
      count++;
      totalIntensity += rel.intensity;
    }

    return count > 0 ? totalIntensity / count : 0;
  }

  /** 获取某类型关系数量 */
  getRelationCount(type: RelationType): number {
    return this.relations.filter(r => r.relationType === type).length;
  }

  // ===== 预设关系 =====

  /** 初始化原著经典关系 */
  initCanonicalRelations(year: number): void {
    // 面壁者与破壁人的关系
    this.establishRelation('泰勒', '破壁人1号', 'RIVAL', year, 'canon', 90);
    this.establishRelation('雷迪亚兹', '破壁人2号', 'RIVAL', year, 'canon', 90);
    this.establishRelation('希恩斯', '破壁人3号', 'BETRAYER', year, 'canon', 95);
    this.establishRelation('罗辑', '破壁人', 'RIVAL', year, 'canon', 80);

    // 核心人物关系
    this.establishRelation('罗辑', '史强', 'ALLY', year, 'canon', 85);
    this.establishRelation('罗辑', '庄颜', 'ALLY', year, 'canon', 90);
    this.establishRelation('程心', '云天明', 'ALLY', year, 'canon', 85);
    this.establishRelation('程心', '艾AA', 'ALLY', year, 'canon', 80);
    this.establishRelation('章北海', '东方延续', 'MENTOR', year, 'canon', 80);

    // 敌对关系
    this.establishRelation('伊文斯', '罗辑', 'RIVAL', year, 'canon', 95);
    this.establishRelation('伊文斯', '史强', 'RIVAL', year, 'canon', 85);
  }

  // ===== 序列化 =====

  toJSON(): object {
    return {
      relations: this.relations,
    };
  }

  static fromJSON(data: any): RelationNetwork {
    const rn = new RelationNetwork();
    if (data?.relations) {
      rn.relations = data.relations;
    }
    return rn;
  }

  reset(): void {
    this.relations = [];
  }
}