import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Tutorial } from '../../components/Tutorial';

describe('Tutorial 组件 - 冒烟测试', () => {
  it('可以正常渲染不崩溃', () => {
    const onComplete = () => {};
    const { container } = render(<Tutorial onComplete={onComplete} />);
    expect(container).toBeTruthy();
    expect(container.querySelector('button')).toBeTruthy();
  });
});