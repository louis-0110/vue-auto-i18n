# 使用示例

## 在新项目中使用

### 1. 安装依赖

```bash
# 创建新项目
npm create vite@latest my-i18n-app -- --template vue-ts
cd my-i18n-app

# 安装 vue-auto-i18n
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin
npm install vue-i18n
```

### 2. 配置 Vite

创建 `vite.config.ts`:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createAutoI18nPlugin } from '@vue-auto-i18n/vite-plugin'

export default defineConfig({
  plugins: [
    vue(),
    createAutoI18nPlugin({
      localesDir: 'src/locales',
      devMode: false  // 只在生产构建时转换
    })
  ]
})
```

### 3. 创建 i18n 配置

创建 `i18n.config.js`:

```javascript
export default {
  include: ["src/**/*.{vue,ts,js}"],
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

### 4. 创建环境变量

创建 `.env`:

```env
GLM_API_KEY=your-api-key-here
```

### 5. 配置 main.ts

```typescript
import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'

const i18n = createI18n({
  legacy: false,
  locale: 'zh-CN',
  fallbackLocale: 'zh-CN',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS
  }
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')
```

### 6. 添加 package.json scripts

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc && vite build",
    "i18n": "vue-auto-i18n auto",
    "i18n:extract": "vue-auto-i18n extract",
    "i18n:translate": "vue-auto-i18n translate"
  }
}
```

### 7. 在组件中使用

创建 `src/App.vue`:

```vue
<template>
  <div class="app">
    <h1>欢迎使用 Vue Auto I18n</h1>
    <p>这是一个零侵入性的国际化解决方案</p>
    <button>按钮</button>
  </div>
</template>

<script setup lang="ts">
const title = '标题'
</script>
```

### 8. 运行流程

```bash
# 1. 提取并翻译
npm run i18n

# 2. 开发模式（显示原始中文）
npm run dev

# 3. 生产构建（自动转换为 $t()）
npm run build

# 4. 预览构建结果
npm run preview
```

## 语言切换

在组件中添加语言切换功能：

```vue
<template>
  <div>
    <h1>{{ $t('欢迎使用 Vue Auto I18n') }}</h1>
    <button @click="switchLanguage('zh-CN')">中文</button>
    <button @click="switchLanguage('en-US')">English</button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { locale } = useI18n()

const switchLanguage = (lang: string) => {
  locale.value = lang
}
</script>
```

## 完整示例

查看 `examples/test-project` 获取完整的可运行示例。

## 常见问题

### Q: 开发模式能看到翻译效果吗？

A: 默认不可以。开发模式显示原始中文，只有生产构建才会转换。
   如果需要在开发模式也启用，设置 `devMode: true`。

### Q: 如何在构建时验证转换？

A: 检查构建输出：
   ```bash
   npm run build
   cat dist/assets/*.js | grep "\$t("
   ```

### Q: 翻译失败怎么办？

A: 检查配置和 API Key：
   ```bash
   npm run i18n --verbose
   ```

### Q: 如何添加新语言？

A: 修改 `i18n.config.js`:
   ```javascript
   targetLanguages: ["en-US", "ja-JP", "ko-KR"]
   ```
   然后重新运行 `npm run i18n`。
