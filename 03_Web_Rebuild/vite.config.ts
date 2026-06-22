/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const basePath = process.env.CF_PAGES === '1' ? '/' : '/beyond-the-light-cone/';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      // Layer 1: 核心包 - 小体积 UI 图标（非 CG/立绘）包含在预缓存中
      // 注意：CG/立绘/BGM 等扩展资源不在此处预缓存，
      // 由 AssetLoader 在运行时按需下载（Layer 2）
      includeAssets: [
        'icons/*.png',
      ],
      manifest: {
        name: '光锥之外：纪元往事',
        short_name: '光锥之外',
        description: '基于《三体》世界观改编的4X策略游戏',
        lang: 'zh-CN',
        display: 'standalone',
        orientation: 'landscape',
        theme_color: '#0B1020',
        background_color: '#0B1020',
        start_url: basePath,
        icons: [
          {
            src: 'icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // 核心资源：预缓存所有 JS/CSS/HTML/字体/UI图标
        globPatterns: ['**/*.{js,css,html,json,woff2,woff,ttf,eot,svg}'],
        // 扩展资源：图片和音频使用 StaleWhileRevalidate 策略（懒加载优先缓存）
        // ==========================================================
        // 三层缓存策略
        // ==========================================================
        //
        // Layer 1 - 强缓存 (Core):
        //   JS/CSS/HTML/字体/JSON → precache (永不删除)
        //   由 globPatterns 处理
        //
        // Layer 2 - 可替换缓存 (Expansion):
        //   图片 → CacheFirst (90天, 可替换)
        //   音频 → StaleWhileRevalidate (90天, 可替换)
        //   由运行时缓存处理
        //
        // Layer 3 - 临时缓存 (Patch):
        //   资源清单 → NetworkFirst (总是验证最新)
        //   热更补丁 → NetworkFirst (短生命周期)
        // ==========================================================

        runtimeCaching: [
          // Layer 2: CG/立绘/结局图 - CacheFirst 优先读缓存
          {
            urlPattern: /\/images\/.*\.(png|webp|jpg|jpeg|gif)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exp-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90天
              }
            }
          },
          // Layer 2: BGM/音效 - StaleWhileRevalidate 保证播放不中断
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'exp-audio',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90天
              }
            }
          },
          // Layer 2: 本地字体 - 长期缓存
          {
            urlPattern: /\/fonts\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'exp-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1年
              }
            }
          },
          // Layer 3: 资源清单 - NetworkFirst 确保清单总是最新
          {
            urlPattern: /\/asset_manifest\.json/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'patch-manifest',
              expiration: {
                maxEntries: 1,
                maxAgeSeconds: 60 * 60 * 24 // 1天
              }
            }
          },
          // Layer 3: 补丁文件 - NetworkFirst 优先从网络获取
          {
            urlPattern: /\/patches\/.*\.json/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'patch-files',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7天
              }
            }
          },
          // Google Fonts CDN 缓存（跨域）
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              }
            }
          }
        ],
        // 缓存版本控制：自动替换旧缓存
        cacheId: 'beyond-light-cone-v1.0.0',
        // 清理过期的缓存
        cleanupOutdatedCaches: true
      }
    })
  ],
  base: basePath,
  build: {
    sourcemap: true,
    rollupOptions: {
      output: {
        // 代码分割策略：将大型依赖与游戏核心拆分为独立 chunk，降低首屏 index chunk 体积
        manualChunks(id: string) {
          // React 生态 vendor
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) {
            return 'vendor-react';
          }
          // 动画库
          if (/node_modules\/(framer-motion|@emotion)\//.test(id)) {
            return 'vendor-motion';
          }
          // 图标库
          if (/node_modules\/lucide-react\//.test(id)) {
            return 'vendor-icons';
          }
          // 游戏核心引擎（独立于 UI 的 heavy logic）
          if (id.includes('/src/core/') && !id.includes('/src/core/subsystems/')) {
            return 'game-core';
          }
          // 子系统层
          if (id.includes('/src/core/subsystems/')) {
            return 'game-subsystems';
          }
          // 重型 UI 模态组件（与 React.lazy 配合使用）
          if (
            id.includes('/src/components/MuseumGallery') ||
            id.includes('/src/components/EndingCollectionGrid') ||
            id.includes('/src/components/StoryModal') ||
            id.includes('/src/components/EndGameScreen') ||
            id.includes('/src/components/BattleScreen') ||
            id.includes('/src/components/FleetModal') ||
            id.includes('/src/components/SettingsModal') ||
            id.includes('/src/components/Tutorial') ||
            id.includes('/src/components/TechUnlockModal')
          ) {
            return 'ui-modals';
          }
          // 结局相关子组件
          if (id.includes('/src/components/ending/')) {
            return 'ui-endings';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 60000,
    exclude: ['node_modules', 'src/test/e2e-playwright/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'html'],
      thresholds: {
        statements: 70,
        branches: 60,
        functions: 70,
        lines: 70
      }
    }
  }
})