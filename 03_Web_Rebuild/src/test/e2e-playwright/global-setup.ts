import { request, expect } from '@playwright/test';

declare const process: any;

/**
 * 全局身份断言：在所有 spec 运行前，对 preview URL 做一次身份核验。
 *
 * 防御场景：reuseExistingServer 已设为 false，但若 webServer 启动逻辑被改回复用、
 * 或本机存在其他项目占用 4173 端口，globalSetup 会在此拦截，避免对错误应用跑测试。
 */
export default async function globalSetup() {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:4173/';
  const ctx = await request.newContext({ baseURL });

  try {
    // 1. 根路径返回 200
    const res = await ctx.get('/');
    expect(res.ok(), `preview 根路径未返回 200: ${res.status()}`).toBeTruthy();

    // 2. 页面 title 与 application-name 必须匹配本应用
    const html = await res.text();
    expect(html, '页面 title 未包含"光锥之外"').toMatch(/<title>[^<]*光锥之外[^<]*<\/title>/i);
    expect(html, 'application-name meta 未包含"光锥之外"').toMatch(
      /<meta\s+name="application-name"\s+content="[^"]*光锥之外[^"]*"/i
    );
  } finally {
    await ctx.dispose();
  }
}
