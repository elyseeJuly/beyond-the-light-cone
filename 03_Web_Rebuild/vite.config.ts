/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: [
        'images/*.png',
        'audio/*.mp3',
        'audio/*.ogg',
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
        start_url: '/beyond-the-light-cone/',
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
        runtimeCaching: [
          {
            urlPattern: /\/images\/.*\.(png|webp|jpg|jpeg|gif)/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-images',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 90 // 90天
              }
            }
          },
          {
            urlPattern: /\/audio\/.*\.(mp3|ogg|wav)/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'game-audio',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 90
              }
            }
          },
          {
            urlPattern: /\/fonts\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'game-fonts',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
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
        // 跳过等待阶段，新 SW 安装后立即激活
        skipWaiting: true,
        clientsClaim: true,
        // 清理过期的缓存
        cleanupOutdatedCaches: true
      }
    })
  ],
  base: '/beyond-the-light-cone/',
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    testTimeout: 60000,
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