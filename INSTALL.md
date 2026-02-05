# 安装指南

## 方式一：直接引用（推荐用于正式项目）

### 1. 安装 CLI 和 Vite 插件

```bash
cd your-project
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin
```

### 2. 添加 package.json scripts

```json
{
  "scripts": {
    "i18n": "vue-auto-i18n auto",
    "i18n:extract": "vue-auto-i18n extract",
    "i18n:translate": "vue-auto-i18n translate"
  }
}
```

### 3. 配置 vite.config.js

```javascript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    createAutoI18nPlugin({
      localesDir: 'src/locales',
      devMode: false  // 生产构建时转换
    })
  ]
})
```

### 4. 创建 i18n.config.js

```javascript
export default {
  include: ["src/**/*.{vue,js,ts}"],
  exclude: ["node_modules/**", "dist/**"],
  targetLanguages: ["en-US", "ja-JP"],
  translateService: "glm",
  translator: {
    glm: {
      apiKey: process.env.GLM_API_KEY,
      model: "glm-4.5-air"
    }
  },
  localesDir: "src/locales",
  cacheDir: ".i18n-cache",
  incremental: true,
  verbose: false
}
```

### 5. 创建 .env 文件

```env
GLM_API_KEY=your-api-key-here
```

### 6. 运行

```bash
# 提取并翻译
npm run i18n

# 构建
npm run build
```

## 方式二：从本地引用（开发模式）

### 1. 构建所有包

```bash
cd vue-auto-i18n
pnpm install
pnpm run build
```

### 2. 在你的项目中引用

```bash
cd your-project
npm install ../vue-auto-i18n/packages/cli
npm install -D ../vue-auto-i18n/packages/vite-plugin
```

### 3. 配置 vite.config.js

```javascript
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    createAutoI18nPlugin({
      localesDir: 'src/locales',
      devMode: false
    })
  ]
})
```

### 4. 添加 scripts

```json
{
  "scripts": {
    "i18n": "vue-auto-i18n auto"
  }
}
```

## 使用示例

查看 [examples/test-project](./examples/test-project) 获取完整示例。

## 故障排除

### 问题：找不到 vue-auto-i18n 命令

**解决方案：**
```bash
# 使用 npx 运行
npx vue-auto-i18n auto

# 或添加到 scripts
npm run i18n
```

### 问题：翻译失败

**检查清单：**
1. API Key 是否正确配置
2. 网络是否正常
3. 查看详细错误信息

```bash
# 显示详细日志
vue-auto-i18n auto --verbose
```

### 问题：构建后没有转换

**检查清单：**
1. 语言包是否已生成 (`src/locales/*.json`)
2. Vite 插件是否正确配置
3. 检查构建日志

## 下一步

- 查看 [README.md](./README.md) 了解完整功能
- 查看 [examples/test-project](./examples/test-project) 获取完整示例
