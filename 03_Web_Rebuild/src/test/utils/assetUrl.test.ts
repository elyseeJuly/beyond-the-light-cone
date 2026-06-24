import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getAssetUrl, getImageUrl, preloadCoreImages } from '../../utils/assetUrl';

describe('getAssetUrl', () => {
  it('拼接基础路径与资源路径', () => {
    const result = getAssetUrl('images/test.png');
    expect(result).toBe('/images/test.png');
  });

  it('去除路径前导斜杠后拼接', () => {
    const result = getAssetUrl('/images/test.png');
    expect(result).toBe('/images/test.png');
  });

  it('空字符串路径', () => {
    const result = getAssetUrl('');
    expect(result).toBe('/');
  });

  it('确保基础路径以斜杠结尾', () => {
    const result = getAssetUrl('audio/bgm.mp3');
    expect(result).toBe('/audio/bgm.mp3');
  });

  it('处理嵌套路径', () => {
    const result = getAssetUrl('assets/icons/icon-512x512.png');
    expect(result).toBe('/assets/icons/icon-512x512.png');
  });
});

describe('getImageUrl', () => {
  it('拼接 images 前缀', () => {
    const result = getImageUrl('test.png');
    expect(result).toBe('/images/test.png');
  });

  it('空字符串返回空', () => {
    const result = getImageUrl('');
    expect(result).toBe('');
  });

  it('处理带子目录的图片名', () => {
    const result = getImageUrl('avatars/luoji.png');
    expect(result).toBe('/images/avatars/luoji.png');
  });
});

describe('preloadCoreImages', () => {
  beforeEach(() => {
    vi.stubGlobal('Image', class {
      src: string = '';
      constructor() { /* noop */ }
    });
  });

  it('在浏览器环境中预加载核心图片不抛错', () => {
    expect(() => preloadCoreImages()).not.toThrow();
  });

  it('在 Node 环境中安全跳过（window 不存在）', () => {
    const originalWindow = (globalThis as any).window;
    delete (globalThis as any).window;

    expect(() => preloadCoreImages()).not.toThrow();

    (globalThis as any).window = originalWindow;
  });
});