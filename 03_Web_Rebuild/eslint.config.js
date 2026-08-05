import js from '@eslint/js'
import ts from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default ts.config(
  // video-output 是独立子项目（有自己的 tsconfig.json 与 package.json），不纳入主项目 lint
  { ignores: ['dist', 'node_modules', 'src-tauri', 'coverage', 'public', 'vite.config.ts', 'playwright.config.ts', 'scripts', '*.cjs', '*.mjs', 'video-output/**'] },
  js.configs.recommended,
  ...ts.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      // 声明浏览器与 Node 全局，避免 no-undef 误报 i18n / 组件中合法使用的 console/window/localStorage 等
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unsafe-function-type': 'off',
      '@typescript-eslint/no-wrapper-object-types': 'off',
      'no-console': 'off',
      // 初始值立即覆盖是安全常见模式，该规则噪音过高且非关键正确性规则
      'no-useless-assignment': 'off',
      // 实验性严格规则：现有组件模式涉及较大重构，暂禁用以避免破坏工作代码；
      // 仅保留经典 rules-of-hooks / exhaustive-deps。
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/preserve-manual-memoization': 'off',
    },
  }
)
