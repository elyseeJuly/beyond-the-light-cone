import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tutorial, TUTORIAL_STEPS } from '../../components/Tutorial';

describe('Tutorial 组件 - 冒烟测试', () => {
  it('可以正常渲染不崩溃', () => {
    const onComplete = () => {};
    const { container } = render(<Tutorial onComplete={onComplete} />);
    expect(container).toBeTruthy();
    expect(container.querySelector('button')).toBeTruthy();
  });

  it('TUTORIAL_STEPS 导出：欢迎页 + 4 步核心操作（共 5 步）', () => {
    expect(TUTORIAL_STEPS).toHaveLength(5);
    expect(TUTORIAL_STEPS[0].id).toBe('welcome');
    expect(TUTORIAL_STEPS[1].id).toBe('click-earth');
    expect(TUTORIAL_STEPS[2].id).toBe('resource-production');
    expect(TUTORIAL_STEPS[3].id).toBe('start-research');
    expect(TUTORIAL_STEPS[4].id).toBe('next-turn');
  });

  it('click-earth 步骤包含 focusStar 字段（核心防误触：自动居中地球）', () => {
    const earthStep = TUTORIAL_STEPS.find(s => s.id === 'click-earth');
    expect(earthStep).toBeTruthy();
    expect(earthStep!.focusStar).toBe(3); // STAR_INDEX.EARTH
    expect(earthStep!.highlightSize).toBe(110); // 覆盖 60px 实际命中区
    expect(earthStep!.forgivingClick).toBe(true); // 宽容点击
  });
});
