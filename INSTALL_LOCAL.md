# Vue Auto I18n - 安装指南

## 📦 已生成安装包

**vue-auto-i18n-2.0.0.tgz** (110KB) - 统一安装包

---

## 🚀 方式 1: 一键安装（推荐）

将 `vue-auto-i18n-2.0.0.tgz` 复制到你的项目根目录，然后运行：

### npm
```bash
npm install ./vue-auto-i18n-2.0.0.tgz
```

### pnpm
```bash
pnpm add ./vue-auto-i18n-2.0.0.tgz
```

### yarn
```bash
yarn add ./vue-auto-i18n-2.0.0.tgz
```

### bun
```bash
bun add ./vue-auto-i18n-2.0.0.tgz
```

---

## 🎯 方式 2: 使用 npx（无需复制文件）

如果文件在其他位置，使用完整路径：

```bash
npm install /path/to/vue-auto-i18n-2.0.0.tgz
```

---

## 📚 使用示例

安装后，在 `vite.config.ts` 中使用：

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoI18n from 'vue-auto-i18n/vite'

export default defineConfig({
  plugins: [
    vue(),
    AutoI18n({
      translator: {
        type: 'google',
        apiKey: process.env.GOOGLE_TRANSLATE_API_KEY
      },
      locales: ['en', 'ja', 'ko']
    })
  ]
})
```

使用 CLI：

```bash
vue-auto-i18n extract --translate
```

---

## 🔍 验证安装

安装完成后，检查 `package.json`：

```json
{
  "dependencies": {
    "vue-auto-i18n": "2.0.0",
    "@vue-auto-i18n/core": "2.0.0",
    "@vue-auto-i18n/replacer": "2.0.0",
    "@vue-auto-i18n/vite-plugin": "2.0.0",
    "@vue-auto-i18n/cli": "2.0.0"
  }
}
```

---

## 💡 提示

- 安装过程会自动按依赖顺序安装所有子包
- 首次安装可能需要 1-2 分钟
- 推荐使用 pnpm，速度更快

---

## ❓ 常见问题

**Q: 安装失败怎么办？**
A: 确保使用 Node.js >= 18.0.0，并尝试清除缓存后重新安装

**Q: 可以只安装某个包吗？**
A: 可以，使用单独的 .tgz 文件：
```bash
npm install ./packages/vite-plugin/vue-auto-i18n-vite-plugin-2.0.0.tgz
```

**Q: 支持哪些包管理器？**
A: 支持 npm、pnpm、yarn、bun
