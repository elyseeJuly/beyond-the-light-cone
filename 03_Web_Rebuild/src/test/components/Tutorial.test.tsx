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

  it('TUTORIAL_STEPS 导出：9 步智脑校准路径', () => {
    expect(TUTORIAL_STEPS.map(step => step.id)).toEqual([
      'welcome',
      'click-earth',
      'read-status',
      'build-stope',
      'resource-production',
      'start-research',
      'next-turn',
      'resolve-event',
      'tutorial-end',
    ]);
  });

  it('click-earth 步骤包含 focusStar 字段（核心防误触：自动居中地球）', () => {
    const earthStep = TUTORIAL_STEPS.find(s => s.id === 'click-earth');
    expect(earthStep).toBeTruthy();
    expect(earthStep!.focusStar).toBe(3); // STAR_INDEX.EARTH
    expect(earthStep!.highlightSize).toBe(110); // 覆盖 60px 实际命中区
    expect(earthStep!.forgivingClick).toBe(true); // 宽容点击
  });
});
