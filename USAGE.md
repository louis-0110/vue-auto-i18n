# Vue Auto I18n 使用指南

完整的 Vue 3 自动国际化工具使用教程

## 目录

- [快速开始](#快速开始)
- [安装配置](#安装配置)
- [Vite 插件使用](#vite-插件使用)
- [CLI 命令详解](#cli-命令详解)
- [工作流程](#工作流程)
- [最佳实践](#最佳实践)
- [常见问题](#常见问题)

## 快速开始

### 5 分钟快速上手

#### 1. 安装依赖

```bash
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin -D
```

#### 2. 初始化配置

```bash
npx vue-auto-i18n init
```

#### 3. 配置 Vite 插件

```javascript
// vite.config.js
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'

export default {
  plugins: [
    createAutoI18nPlugin()
  ]
}
```

#### 4. 配置翻译服务（可选）

```bash
# 编辑 .env 文件
OPENAI_API_KEY=sk-xxx
```

#### 5. 运行自动翻译

```bash
npx vue-auto-i18n auto
```

完成！现在你的代码中的中文会被自动翻译并支持多语言切换。

## 安装配置

### 完整安装

```bash
# 安装所有包
npm install @vue-auto-i18n/core @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin @vue-auto-i18n/replacer
```

### 按需安装

#### 只使用 CLI

```bash
npm install @vue-auto-i18n/cli
```

#### 只使用 Vite 插件

```bash
npm install @vue-auto-i18n/core @vue-auto-i18n/vite-plugin -D
```

#### 只使用核心库

```bash
npm install @vue-auto-i18n/core
```

### 项目集成

```javascript
// package.json
{
  "scripts": {
    "i18n": "vue-auto-i18n auto",
    "i18n:extract": "vue-auto-i18n extract",
    "i18n:translate": "vue-auto-i18n translate"
  },
  "devDependencies": {
    "@vue-auto-i18n/vite-plugin": "^2.0.0"
  }
}
```

## Vite 插件使用

### 基础配置

```javascript
// vite.config.js
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    createAutoI18nPlugin({
      localesDir: 'src/locales',
      devMode: false
    })
  ]
})
```

### 插件选项

| 选项 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| `localesDir` | `string` | `'src/locales'` | 语言包目录路径 |
| `cacheDir` | `string` | `'.i18n-cache'` | 缓存目录路径 |
| `devMode` | `boolean` | `false` | 开发模式是否启用转换 |
| `injectI18n` | `boolean` | `true` | 自动注入 i18n 配置 |
| `transformMode` | `'replace'\|'inject'` | `'replace'` | 转换模式 |

### 开发模式 vs 生产模式

```javascript
createAutoI18nPlugin({
  // 生产模式：构建时转换中文
  devMode: false,  // 默认，只在生产构建时转换

  // 开发模式：实时转换（开发时也能看到效果）
  devMode: true   // 开发时也进行转换
})
```

### 工作原理

1. **构建开始时**：加载 `src/locales/zh-CN.json` 语言包
2. **文件转换时**：检测文件中的中文文本
3. **文本替换**：将中文替换为 `$t('key')` 调用
4. **缓存机制**：避免重复转换，提高构建速度

## CLI 命令详解

### init - 初始化配置

```bash
vue-auto-i18n init
```

创建以下文件：
- `i18n.config.js` - 配置文件
- `.env` - 环境变量文件

**选项：**
- `--force` - 覆盖已存在的配置文件

```bash
vue-auto-i18n init --force
```

### extract - 提取中文

```bash
vue-auto-i18n extract
```

从代码中提取中文文本并保存到缓存。

**选项：**
- `-i, --include <patterns...>` - 包含的文件模式
- `-e, --exclude <patterns...>` - 排除的文件模式
- `-o, --output <dir>` - 缓存输出目录

```bash
vue-auto-i18n extract --include "src/**/*.vue" --exclude "node_modules/**"
vue-auto-i18n extract -o ".cache"
```

### translate - 翻译

```bash
vue-auto-i18n translate
```

翻译提取的文本并生成语言包。

**选项：**
- `-l, --languages <langs>` - 目标语言（逗号分隔）
- `-s, --service <service>` - 翻译服务
- `-k, --api-key <key>` - API 密钥
- `-o, --output <dir>` - 语言包输出目录
- `--no-incremental` - 禁用增量翻译

```bash
vue-auto-i18n translate -l "en-US,ja-JP" -s openai
vue-auto-i18n translate --no-incremental  # 翻译所有文本
```

### auto - 自动模式

```bash
vue-auto-i18n auto
```

一键完成：提取 + 翻译

**选项：**
- 支持所有 `extract` 和 `translate` 的选项

```bash
vue-auto-i18n auto -l "en-US,ja-JP,ko-KR" -s google
```

### replace - 代码替换

```bash
vue-auto-i18n replace
```

将代码中的硬编码中文替换为 `$t()` 调用。

**选项：**
- `--no-backup` - 不创建备份文件
- `--dry-run` - 预览但不实际修改

```bash
vue-auto-i18n replace --dry-run  # 先预览
vue-auto-i18n replace            # 确认无误后执行
```

⚠️ **警告**：此命令会修改源代码，建议先提交到 Git。

### config - 查看配置

```bash
vue-auto-i18n config
```

显示当前配置并验证。

## 工作流程

### 推荐的工作流程

#### 1. 项目初始化

```bash
# 安装
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin -D

# 初始化
npx vue-auto-i18n init

# 配置 .env
cp .env.example .env
# 编辑 .env 添加 API_KEY
```

#### 2. 首次翻译

```bash
# 一键完成
npx vue-auto-i18n auto
```

这会：
1. 扫描代码中的中文
2. 生成 `src/locales/zh-CN.json`
3. 翻译生成 `src/locales/en-US.json` 等文件

#### 3. 后续更新

```bash
# 新增代码后
npx vue-auto-i18n auto  # 只翻译新增的文本
```

#### 4. 代码替换（可选）

如果你想将中文替换为 `$t()` 调用：

```bash
# 先预览
npx vue-auto-i18n replace --dry-run

# 确认无误后
npx vue-auto-i18n replace
```

## 最佳实践

### 1. 目录结构建议

```
src/
├── locales/           # 语言包目录
│   ├── zh-CN.json
│   ├── en-US.json
│   └── ja-JP.json
├── components/
│   └── HelloWorld.vue
└── App.vue
```

### 2. 配置文件管理

```javascript
// i18n.config.js
export default {
  include: ['src/**/*.{vue,js,ts}'],
  exclude: [
    'node_modules/**',
    'src/**/*.spec.{js,ts}',
    'src/**/*.test.{js,ts}'
  ],
  targetLanguages: ['en-US', 'ja-JP'],
  translateService: 'google',
  incremental: true,
  verbose: false
}
```

### 3. 环境变量管理

```bash
# .env.example（提交到 Git）
I18N_API_KEY=

# .env（不提交，添加到 .gitignore）
I18N_API_KEY=your_api_key_here
```

### 4. Git 配置

```gitignore
# .gitignore
.env
.env.local
.i18n-cache/
*.bak
```

### 5. 文本提取规则

#### ✅ 会被提取的文本

```vue
<template>
  <div>你好世界</div>        <!-- ✅ 提取 -->
</template>

<script setup>
const message = '欢迎'        // ✅ 提取
const title = `标题`           // ✅ 提取
</script>
```

#### ❌ 不会被提取的文本

```vue
<template>
  <div>{{ $t('已有key') }}</div>  <!-- ❌ 已是 i18n 调用 -->
</template>

<script setup>
const code = 'ERROR_MSG'      // ❌ 纯英文
const comment = '// TODO'      // ❌ 注释
</script>
```

### 6. 性能优化

#### 增量翻译

```javascript
// i18n.config.js
{
  incremental: true  // 只翻译新增文本
}
```

#### 文件过滤

```javascript
// i18n.config.js
{
  include: ['src/**/*.{vue,js}'],  // 只扫描需要的文件
  exclude: ['**/*.spec.ts', '**/test/**']
}
```

#### 并发翻译

某些翻译服务支持批量翻译，自动优化性能。

### 7. 翻译质量

#### 使用 OpenAI 获得最佳质量

```javascript
{
  translateService: 'openai',
  openaiModel: 'gpt-4'  // GPT-4 质量更好但更慢
}
```

#### 提供上下文

翻译器会根据上下文自动调整翻译结果。

## 常见问题

### Q1: 翻译失败怎么办？

**A:** 检查以下几点：
1. API 密钥是否正确
2. 网络连接是否正常
3. API 配额是否用完

```bash
# 查看详细日志
vue-auto-i18n translate --verbose
```

### Q2: 某些文本没有被提取？

**A:** 检查：
1. 文件类型是否支持
2. 文件是否在 `include` 模式中
3. 文件是否在 `exclude` 模式中

```bash
# 检查扫描的文件
vue-auto-i18n extract --verbose
```

### Q3: 如何添加新的目标语言？

**A:** 修改配置文件：

```javascript
// i18n.config.js
export default {
  targetLanguages: [
    'en-US',  // 英文
    'ja-JP',  // 日文
    'ko-KR',  // 韩文
    'fr-FR',  // 法文
    'de-DE'   // 德文
  ]
}
```

### Q4: 开发模式看不到效果？

**A:** 启用开发模式转换：

```javascript
// vite.config.js
createAutoI18nPlugin({
  devMode: true  // 开发时也转换
})
```

### Q5: 如何自定义翻译规则？

**A:** 可以扩展翻译器：

```javascript
import { BaseTranslator } from '@vue-auto-i18n/core'

class CustomTranslator extends BaseTranslator {
  async translate(texts, from, to) {
    // 自定义翻译逻辑
    return texts.map(text => customTranslate(text))
  }
}
```

### Q6: 构建后某些中文没有转换？

**A:** 检查：
1. 中文是否在语言包中
2. 文件是否在 `include` 模式中
3. 查看构建日志

```bash
# 清除缓存重新构建
rm -rf .i18n-cache dist
npm run build
```

### Q7: 如何回滚代码替换？

**A:** 使用备份文件：

```bash
# 删除替换后的文件，恢复备份
find . -name '*.bak' -exec sh -c 'mv "$1" "${1%.bak}"' _ {} \;
```

### Q8: 支持哪些 Vue 版本？

**A:** 支持 Vue 3.x。对于 Vue 2.x，请使用旧版本。

### Q9: 可以在 Nuxt 3 中使用吗？

**A:** 可以！Nuxt 3 支持 Vite 插件：

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  modules: [],
  vite: {
    plugins: [
      createAutoI18nPlugin()
    ]
  }
})
```

### Q10: 如何处理动态导入的文本？

**A:** 动态导入的文本需要手动添加到语言包中：

```javascript
// src/locales/zh-CN.json
{
  "动态文本": "这是动态文本"
}
```

## 示例项目

### 完整示例

查看 [examples](./examples) 目录获取完整的示例项目。

### 简单示例

```vue
<!-- src/components/Greeting.vue -->
<template>
  <div class="greeting">
    <h1>{{ $t('欢迎') }}</h1>
    <p>{{ $t('介绍') }}</p>
    <button>{{ $t('按钮') }}</button>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

const handleClick = () => {
  console.log(t('点击'))
}
</script>

<style scoped>
.greeting {
  text-align: center;
  padding: 20px;
}
</style>
```

```json
// src/locales/zh-CN.json
{
  "欢迎": "欢迎",
  "介绍": "这是一个自动国际化的示例",
  "按钮": "点击我",
  "点击": "按钮被点击"
}
```

```json
// src/locales/en-US.json
{
  "欢迎": "Welcome",
  "介绍": "This is an automated internationalization example",
  "按钮": "Click Me",
  "点击": "Button clicked"
}
```

## 更多资源

- [Vue I18n 官方文档](https://vue-i18n.intlify.dev/)
- [Vite 插件开发指南](./docs/VITE_PLUGIN_GUIDE.md)
- [语言切换实现指南](./docs/LANGUAGE_SWITCH_GUIDE.md)
