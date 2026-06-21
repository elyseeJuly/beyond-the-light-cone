import { describe, it, expect, beforeEach } from 'vitest';
import { TagManager, STANDARD_TAGS, CHARACTER_STANCE_TAGS } from '../../core/TagManager';

describe('TagManager', () => {
  let tm: TagManager;

  beforeEach(() => {
    tm = new TagManager();
  });

  describe('World Tags', () => {
    it('初始无世界标签', () => {
      expect(tm.worldTags.size).toBe(0);
    });

    it('applyWorldTag 添加标签', () => {
      tm.applyWorldTag('civil_unrest', 50, 'test_event', 10);
      expect(tm.worldTags.size).toBe(1);
      const tag = tm.worldTags.get('civil_unrest')!;
      expect(tag.name).toBe('民心不稳');
      expect(tag.intensity).toBe(50);
      expect(tag.firstAppliedYear).toBe(10);
      expect(tag.lastReinforcedYear).toBe(10);
      expect(tag.source).toBe('test_event');
    });

    it('applyWorldTag 未知标签发出警告但不崩溃', () => {
      const consoleWarn = console.warn;
      console.warn = () => {};
      tm.applyWorldTag('unknown_tag', 50, 'test', 0);
      expect(tm.worldTags.size).toBe(0);
      console.warn = consoleWarn;
    });

    it('applyWorldTag 重复应用增强强度', () => {
      tm.applyWorldTag('tech_boom', 30, 'event1', 0);
      tm.applyWorldTag('tech_boom', 40, 'event2', 5);
      expect(tm.worldTags.get('tech_boom')!.intensity).toBe(70);
      expect(tm.worldTags.get('tech_boom')!.lastReinforcedYear).toBe(5);
    });

    it('applyWorldTag 强度不超过100', () => {
      tm.applyWorldTag('tech_boom', 200, 'test', 0);
      expect(tm.worldTags.get('tech_boom')!.intensity).toBe(100);
    });

    it('setWorldTagIntensity 设置精确值', () => {
      tm.setWorldTagIntensity('resource_depleted', 75, 10, 'test');
      expect(tm.worldTags.get('resource_depleted')!.intensity).toBe(75);
    });

    it('removeWorldTag 移除标签', () => {
      tm.applyWorldTag('civil_unrest', 50, 'test', 0);
      tm.removeWorldTag('civil_unrest');
      expect(tm.worldTags.size).toBe(0);
    });

    it('removeWorldTag 不存在的标签不抛异常', () => {
      expect(() => tm.removeWorldTag('nonexistent')).not.toThrow();
    });

    it('hasTag 检查标签存在和强度', () => {
      expect(tm.hasTag('civil_unrest')).toBe(false);
      tm.applyWorldTag('civil_unrest', 30, 'test', 0);
      expect(tm.hasTag('civil_unrest')).toBe(true);
      expect(tm.hasTag('civil_unrest', 50)).toBe(false);
    });

    it('getTagIntensity 获取强度', () => {
      expect(tm.getTagIntensity('civil_unrest')).toBe(0);
      tm.applyWorldTag('civil_unrest', 60, 'test', 0);
      expect(tm.getTagIntensity('civil_unrest')).toBe(60);
    });

    it('getTagsByCategory 按分类获取', () => {
      tm.applyWorldTag('civil_unrest', 50, 'test', 0); // social
      tm.applyWorldTag('tech_boom', 50, 'test', 0);   // state
      tm.applyWorldTag('space_force_built', 100, 'test', 0); // military
      expect(tm.getTagsByCategory('social').length).toBe(1);
      expect(tm.getTagsByCategory('state').length).toBe(1);
      expect(tm.getTagsByCategory('military').length).toBe(1);
    });

    it('decayTags 非里程碑标签衰减', () => {
      tm.applyWorldTag('civil_unrest', 100, 'test', 0);
      tm.decayTags(1); // 1年后: 100 - 1*3 = 97
      expect(tm.worldTags.get('civil_unrest')!.intensity).toBe(97);
    });

    it('decayTags 衰减到0时移除', () => {
      tm.applyWorldTag('civil_unrest', 5, 'test', 0);
      tm.decayTags(2); // 2年后: 5 - 2*3 = -1 <= 0
      expect(tm.worldTags.has('civil_unrest')).toBe(false);
    });

    it('decayTags 里程碑标签不衰减', () => {
      tm.applyWorldTag('space_force_built', 100, 'test', 0);
      tm.decayTags(100);
      expect(tm.worldTags.get('space_force_built')!.intensity).toBe(100);
    });

    it('decayTags 当年不衰减', () => {
      tm.applyWorldTag('civil_unrest', 100, 'test', 5);
      tm.decayTags(5);
      expect(tm.worldTags.get('civil_unrest')!.intensity).toBe(100);
    });
  });

  describe('Character Tags', () => {
    it('applyCharacterTag 添加角色标签', () => {
      tm.applyCharacterTag('罗辑', {
        personName: '罗辑', tagId: 'dark_forest_believer',
        tagName: '黑暗森林信徒', value: 80, appliedYear: 10, source: 'event',
      });
      expect(tm.getCharacterTags('罗辑').length).toBe(1);
    });

    it('applyCharacterTag 重复标签累加值', () => {
      tm.applyCharacterTag('罗辑', {
        personName: '罗辑', tagId: 'dark_forest_believer',
        tagName: '黑暗森林信徒', value: 30, appliedYear: 0, source: 'e1',
      });
      tm.applyCharacterTag('罗辑', {
        personName: '罗辑', tagId: 'dark_forest_believer',
        tagName: '黑暗森林信徒', value: 20, appliedYear: 5, source: 'e2',
      });
      expect(tm.getCharacterTags('罗辑')[0].value).toBe(50);
    });

    it('getCharacterStance 返回强度最高的立场', () => {
      tm.applyCharacterTag('程心', {
        personName: '程心', tagId: 'detached',
        tagName: '脱离社会', value: 30, appliedYear: 0, source: 'e1',
      });
      tm.applyCharacterTag('程心', {
        personName: '程心', tagId: 'pro_humanity',
        tagName: '为人类做贡献', value: 70, appliedYear: 0, source: 'e2',
      });
      expect(tm.getCharacterStance('程心')).toBe('pro_humanity');
    });

    it('getCharacterStance 无标签返回 null', () => {
      expect(tm.getCharacterStance('不存在')).toBeNull();
    });

    it('getCharacterTags 无标签返回空数组', () => {
      expect(tm.getCharacterTags('某人')).toEqual([]);
    });
  });

  describe('Region & Org Tags', () => {
    it('applyRegionTag 添加区域标签', () => {
      const tag = { id: 'test', name: '测试', intensity: 50, firstAppliedYear: 0, lastReinforcedYear: 0, source: 'test', isMilestone: false, category: 'state' as const };
      tm.applyRegionTag('太阳系', tag);
      expect(tm.regionTags.get('太阳系')!.length).toBe(1);
    });

    it('applyOrgTag 添加组织标签', () => {
      const tag = { id: 'test', name: '测试', intensity: 50, firstAppliedYear: 0, lastReinforcedYear: 0, source: 'test', isMilestone: false, category: 'state' as const };
      tm.applyOrgTag('ETO', tag);
      expect(tm.orgTags.get('ETO')!.length).toBe(1);
    });
  });

  describe('STANDARD_TAGS', () => {
    it('包含所有预定义标签', () => {
      expect(STANDARD_TAGS.resource_depleted).toBeDefined();
      expect(STANDARD_TAGS.tech_boom).toBeDefined();
      expect(STANDARD_TAGS.civil_unrest).toBeDefined();
      expect(STANDARD_TAGS.space_force_built).toBeDefined();
      expect(STANDARD_TAGS.foil_imminent).toBeDefined();
      expect(STANDARD_TAGS.crisis_era_deep).toBeDefined();
    });

    it('预定义标签包含必要属性', () => {
      for (const def of Object.values(STANDARD_TAGS)) {
        expect(def.name).toBeDefined();
        expect(def.category).toBeDefined();
        expect(typeof def.isMilestone).toBe('boolean');
        expect(def.description).toBeDefined();
      }
    });
  });

  describe('CHARACTER_STANCE_TAGS', () => {
    it('包含所有标准立场', () => {
      expect(CHARACTER_STANCE_TAGS.pro_humanity).toBeDefined();
      expect(CHARACTER_STANCE_TAGS.detached).toBeDefined();
      expect(CHARACTER_STANCE_TAGS.exile_faction).toBeDefined();
      expect(CHARACTER_STANCE_TAGS.betrayer).toBeDefined();
    });
  });

  describe('Serialization', () => {
    it('toJSON 与 fromJSON 序列化往返', () => {
      tm.applyWorldTag('civil_unrest', 50, 'test', 10);
      tm.applyCharacterTag('罗辑', {
        personName: '罗辑', tagId: 'dark_forest_believer',
        tagName: '黑暗森林信徒', value: 80, appliedYear: 10, source: 'event',
      });
      const json = tm.toJSON();
      const restored = TagManager.fromJSON(json);
      expect(restored.worldTags.size).toBe(1);
      expect(restored.worldTags.get('civil_unrest')!.intensity).toBe(50);
      expect(restored.characterTags.get('罗辑')!.length).toBe(1);
    });

    it('reset 清空所有标签', () => {
      tm.applyWorldTag('civil_unrest', 50, 'test', 0);
      tm.applyCharacterTag('罗辑', {
        personName: '罗辑', tagId: 'dark_forest_believer',
        tagName: '黑暗森林信徒', value: 80, appliedYear: 10, source: 'event',
      });
      tm.reset();
      expect(tm.worldTags.size).toBe(0);
      expect(tm.characterTags.size).toBe(0);
    });

    it('fromJSON 空数据返回空', () => {
      const restored = TagManager.fromJSON(null);
      expect(restored.worldTags.size).toBe(0);
    });
  });
});