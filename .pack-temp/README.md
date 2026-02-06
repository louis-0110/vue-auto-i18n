# Vue Auto I18n

Vue 3 自动国际化工具 - 使用 AST 技术自动从代码中提取中文文本并生成多语言包

[![npm version](https://img.shields.io/npm/v/@vue-auto-i18n/core)](https://www.npmjs.com/package/@vue-auto-i18n/core)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ 特性

- 🔍 **自动提取** - 从 Vue/JS/TS 文件中自动提取中文文本
- 🌍 **多翻译引擎** - 支持 Google、OpenAI、DeepL、Baidu 翻译
- ⚡ **构建时转换** - Vite 插件支持，构建时自动转换中文为 `$t()` 调用
- 🎯 **代码替换** - 将硬编码中文替换为 i18n 函数调用
- 🔄 **增量翻译** - 只翻译新增文本，节省成本
- 📦 **Monorepo 架构** - 模块化设计，按需引入

## 📦 包结构

本 monorepo 包含以下包：

```
@vue-auto-i18n/core         # 核心库（提取器 + 翻译器）
@vue-auto-i18n/vite-plugin  # Vite 构建时插件
@vue-auto-i18n/cli          # 命令行工具
@vue-auto-i18n/replacer     # 代码替换工具
```

### 包说明

| 包名 | 说明 | 安装命令 |
|------|------|----------|
| `@vue-auto-i18n/core` | 核心库，提供提取和翻译功能 | `pnpm add @vue-auto-i18n/core` |
| `@vue-auto-i18n/vite-plugin` | Vite 插件，构建时自动转换 | `pnpm add -D @vue-auto-i18n/vite-plugin` |
| `@vue-auto-i18n/cli` | CLI 工具，命令行操作 | `pnpm add -D @vue-auto-i18n/cli` |
| `@vue-auto-i18n/replacer` | 代码替换工具 | `pnpm add -D @vue-auto-i18n/replacer` |

## 🚀 快速开始

### 1. 安装

```bash
# 安装核心包
npm install @vue-auto-i18n/core

# 安装 CLI
npm install @vue-auto-i18n/cli

# 安装 Vite 插件
npm install @vue-auto-i18n/vite-plugin -D
```

### 2. 初始化配置

```bash
# 创建配置文件
vue-auto-i18n init
```

这将创建 `i18n.config.js` 和 `.env` 文件。

### 3. 配置 API 密钥

在 `.env` 文件中配置翻译服务的 API 密钥：

```env
# Google Translate (免费版无需配置)
I18N_API_KEY=

# OpenAI
# OPENAI_API_KEY=sk-xxx

# DeepL
# DEEPL_API_KEY=xxx

# Baidu
# BAIDU_APP_ID=xxx
# BAIDU_SECRET=xxx
```

### 4. 自动提取和翻译

```bash
# 一键完成：提取 + 翻译
vue-auto-i18n auto
```

## 📖 使用方法

### 方式一：Vite 插件（推荐）

在 `vite.config.js` 中配置插件：

```javascript
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createAutoI18nPlugin({
      localesDir: 'src/locales',  // 语言包目录
      devMode: false              // 开发模式是否启用转换
    })
  ]
})
```

#### 在 Vue 组件中使用：

```vue
<template>
  <!-- 构建时自动转换为 {{ $t('你好') }} -->
  <div>你好</div>
</template>

<script setup>
// 构建时自动转换为 t('欢迎')
const message = '欢迎'
</script>
```

#### 使用多语言：

```vue
<template>
  <div>{{ $t('你好') }}</div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()
console.log(t('你好')) // 你好 / Hello / こんにちは
</script>
```

### 方式二：CLI 命令

#### 提取中文文本

```bash
vue-auto-i18n extract
```

#### 翻译语言包

```bash
vue-auto-i18n translate
```

#### 替换代码（可选）

将代码中的硬编码中文替换为 `$t()` 调用：

```bash
vue-auto-i18n replace --dry-run  # 预览
vue-auto-i18n replace            # 实际替换
```

## 🔧 配置选项

### i18n.config.js

```javascript
export default {
  // 扫描文件模式
  include: ['src/**/*.{vue,js,ts,jsx,tsx}'],
  exclude: ['node_modules/**'],

  // 语言包目录
  localesDir: 'src/locales',

  // 缓存目录
  cacheDir: '.i18n-cache',

  // 目标语言
  targetLanguages: ['en-US', 'ja-JP'],

  // 翻译服务: google | deepl | openai | baidu
  translateService: 'google',

  // API 密钥（通过 .env 配置）
  apiKey: process.env.I18N_API_KEY,

  // OpenAI 模型（使用 OpenAI 时）
  openaiModel: 'gpt-3.5-turbo',

  // 增量翻译（只翻译新文本）
  incremental: true,

  // 详细日志
  verbose: false
}
```

### Vite 插件选项

```javascript
createAutoI18nPlugin({
  localesDir: 'src/locales',    // 语言包目录
  cacheDir: '.i18n-cache',      // 缓存目录
  devMode: false,               // 开发模式是否启用
  injectI18n: true,             // 自动注入 i18n
  transformMode: 'replace'      // 转换模式
})
```

## 📂 生成的文件结构

```
src/
├── locales/
│   ├── zh-CN.json          # 中文（源语言）
│   ├── en-US.json          # 英文
│   └── ja-JP.json          # 日文
└── components/
    └── HelloWorld.vue
```

### zh-CN.json

```json
{
  "你好": "你好",
  "欢迎": "欢迎"
}
```

### en-US.json

```json
{
  "你好": "Hello",
  "欢迎": "Welcome"
}
```

## 🎯 高级用法

### 自定义提取器

```javascript
import { VueExtractor } from '@vue-auto-i18n/core'

const extractor = new VueExtractor()
const results = await extractor.extract(filePath, fileContent)
```

### 自定义翻译器

```javascript
import { OpenAITranslator } from '@vue-auto-i18n/core'

const translator = new OpenAITranslator({
  apiKey: process.env.OPENAI_API_KEY,
  model: 'gpt-4'
})

const translations = await translator.translate(
  ['你好', '世界'],
  'zh-CN',
  'en-US'
)
```

### 翻译器注册

```javascript
import { TranslatorRegistry } from '@vue-auto-i18n/core'

const registry = new TranslatorRegistry()

// 注册自定义翻译器
class MyTranslator extends BaseTranslator {
  async translate(texts, from, to) {
    // 自定义翻译逻辑
    return translatedTexts
  }
}

registry.register('my', MyTranslator)
```

## 🔍 支持的文件类型

- **Vue 单文件组件** (.vue)
  - Template 模板
  - Script 脚本
  - Style 样式（暂不支持）

- **JavaScript/TypeScript** (.js, .ts, .jsx, .tsx)
  - 字符串字面量
  - 模板字符串

## ⚙️ 翻译服务

### Google Translate

- ✅ 免费版无需 API Key
- ✅ 支持多语言
- ⚠️ 免费版有频率限制

```javascript
translateService: 'google'
```

### OpenAI

- ✅ 翻译质量最佳
- ✅ 支持上下文理解
- 💰 需要付费

```javascript
translateService: 'openai'
apiKey: process.env.OPENAI_API_KEY
openaiModel: 'gpt-3.5-turbo'  // 或 'gpt-4'
```

### DeepL

- ✅ 翻译质量高
- 💰 需要付费

```javascript
translateService: 'deepl'
apiKey: process.env.DEEPL_API_KEY
```

### Baidu

- ✅ 免费额度大
- ⚠️ 需要申请 App ID

```javascript
translateService: 'baidu'
// 在 .env 中配置
BAIDU_APP_ID=xxx
BAIDU_SECRET=xxx
```

## 📋 CLI 命令列表

```bash
# 显示帮助
vue-auto-i18n --help

# 初始化配置
vue-auto-i18n init

# 提取中文文本
vue-auto-i18n extract

# 翻译语言包
vue-auto-i18n translate

# 自动提取+翻译（推荐）
vue-auto-i18n auto

# 替换代码
vue-auto-i18n replace

# 显示配置
vue-auto-i18n config

# 命令行选项
vue-auto-i18n extract --include "src/**/*.vue" --exclude "node_modules/**"
vue-auto-i18n translate --languages "en-US,ja-JP,ko-KR"
vue-auto-i18n auto --service openai --output "src/i18n"
```

## 🛠️ 开发

### 本地开发

```bash
# 克隆仓库
git clone https://github.com/your-repo/vue-auto-i18n.git

# 安装依赖
cd vue-auto-i18n
pnpm install

# 构建所有包
pnpm build

# 监听模式
pnpm dev

# 运行测试
pnpm test
```

### 构建

```bash
# 构建所有包
pnpm build

# 构建单个包
pnpm --filter @vue-auto-i18n/core build
pnpm --filter @vue-auto-i18n/vite-plugin build
```

## 📝 License

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 🔗 相关链接

- **[📖 最佳实践指南](./BEST_PRACTICES.md)** - 详细的使用指南和最佳实践
- [Vue I18n](https://vue-i18n.intlify.dev/) - Vue.js 国际化标准
- [Vite](https://vitejs.dev/) - 下一代前端构建工具
- [pnpm](https://pnpm.io/) - 快速的、节省磁盘空间的包管理器

## 📚 文档

- [最佳实践指南](./BEST_PRACTICES.md) - 详细的使用指南和最佳实践
- [API 文档](./docs/API.md) - 完整的 API 参考
- [贡献指南](./CONTRIBUTING.md) - 如何贡献代码
