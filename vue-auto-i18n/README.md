# Vue Auto I18n

Vue 3 自动国际化工具 - 自动提取和翻译 Vue 项目中的中文文本

## 快速安装

将 `vue-auto-i18n-2.0.0.tgz` 复制到你的项目根目录，然后运行：

```bash
# pnpm (推荐)
pnpm add ./vue-auto-i18n-2.0.0.tgz

# npm
npm install ./vue-auto-i18n-2.0.0.tgz

# yarn
yarn add ./vue-auto-i18n-2.0.0.tgz

# bun
bun add ./vue-auto-i18n-2.0.0.tgz
```

## 使用方式

### Vite 插件

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoI18n from 'vue-auto-i18n'
// 或者 import AutoI18n from 'vue-auto-i18n/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoI18n({
      translator: {
        type: 'google',
        apiKey: process.env.GOOGLE_TRANSLATE_API_KEY
      },
      locales: ['en', 'ja', 'ko'],
      entry: 'src/main.ts'
    })
  ]
})
```

### CLI 工具

安装后自动注册命令：

```bash
# 初始化配置
vue-auto-i18n init

# 提取并翻译
vue-auto-i18n extract --translate

# 只提取不翻译
vue-auto-i18n extract

# 替换代码中的中文
vue-auto-i18n replace
```

## 特性

- ✅ 自动提取 Vue 组件中的中文文本
- ✅ 支持多种翻译服务（Google、DeepL、百度等）
- ✅ AST 级别的代码转换
- ✅ Vite 插件无缝集成
- ✅ CLI 命令行工具
- ✅ TypeScript 完整支持

## 依赖要求

- Node.js >= 18.0.0
- Vue >= 3.0.0
- Vite >= 5.0.0（使用插件时）

## 许可证

MIT
