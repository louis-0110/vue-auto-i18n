# 发布到 npm

## ✅ 准备工作完成

所有包已构建完成并验证通过！

## 🧪 验证包配置

```bash
pnpm run verify:packages
```

输出显示：
- ✅ 所有包版本一致 (2.0.0)
- ✅ 入口文件正确
- ✅ 依赖配置正确（不再使用 workspace:*）

## 📝 发布步骤

### 1. 测试发布（推荐先执行）

```bash
# 测试发布到 npm（不会真正发布）
pnpm publish --dry-run -r
```

### 2. 正式发布

```bash
# 发布所有包
pnpm publish -r
```

### 3. 发布单个包（如果需要）

```bash
# 只发布 core 包
pnpm --filter @vue-auto-i18n/core publish

# 只发布 CLI 工具
pnpm --filter @vue-auto-i18n/cli publish

# 只发布 Vite 插件
pnpm --filter @vue-auto-i18n/vite-plugin publish

# 只发布 Replacer 工具
pnpm --filter @vue-auto-i18n/replacer publish
```

## 📦 发布的包

| 包名 | 版本 | 说明 |
|------|------|------|
| @vue-auto-i18n/core | 2.0.0 | 核心库（提取器 + 翻译器） |
| @vue-auto-i18n/cli | 2.0.0 | CLI 工具 |
| @vue-auto-i18n/vite-plugin | 2.0.0 | Vite 插件 |
| @vue-auto-i18n/replacer | 2.0.0 | 代码替换工具 |

## 🔧 依赖关系

```
@vue-auto-i18n/cli
  ├─→ @vue-auto-i18n/core
  └─→ @vue-auto-i18n/replacer
       └─→ @vue-auto-i18n/core

@vue-auto-i18n/vite-plugin
  └─→ @vue-auto-i18n/core
```

## 📝 发布后使用

### 在其他项目中安装

```bash
# 安装 CLI 和 Vite 插件
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin

# 或只安装 CLI（手动处理）
npm install @vue-auto-i18n/cli

# 或只安装 Vite 插件（使用自己的翻译方案）
npm install -D @vue-auto-i18n/vite-plugin
```

### 从本地引用（测试用）

```bash
npm install /path/to/vue-auto-i18n/packages/cli
npm install -D /path/to/vue-auto-i18n/packages/vite-plugin
```

## ⚠️ 注意事项

1. **发布前检查**：
   - 版本号是否正确
   - 所有包是否已构建
   - 依赖关系是否正确

2. **API Key 安全**：
   - 不要在示例代码中包含真实的 API Key
   - 使用环境变量配置

3. **文档更新**：
   - 更新 README.md
   - 更新 CHANGELOG.md（如果有的话）

4. **测试**：
   - 在新项目中测试安装
   - 验证所有功能正常工作

## 🎉 发布成功后

用户可以通过以下命令使用：

```bash
# 安装
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin

# 使用
vue-auto-i18n init
vue-auto-i18n auto
```

## 🔗 相关文档

- [INSTALL.md](./INSTALL.md) - 安装指南
- [USAGE_EXAMPLE.md](./USAGE_EXAMPLE.md) - 使用示例
- [PUBLISH.md](./PUBLISH.md) - 发布说明
