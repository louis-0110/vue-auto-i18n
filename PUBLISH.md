# 发布说明

## 准备工作

### 1. 检查版本号

确保所有包的版本号一致：

```bash
pnpm run check:versions
```

### 2. 清理并构建

```bash
pnpm run clean
pnpm run build
```

### 3. 运行测试

```bash
pnpm test
```

## 发布到 npm

### 方式一：发布所有包

```bash
pnpm run release
```

### 方式二：单独发布某个包

```bash
# 发布 core 包
pnpm --filter @vue-auto-i18n/core publish

# 发布 vite-plugin 包
pnpm --filter @vue-auto-i18n/vite-plugin publish

# 发布 cli 包
pnpm --filter @vue-auto-i18n/cli publish

# 发布 replacer 包
pnpm --filter @vue-auto-i18n/replacer publish
```

## 发布后的文件

每个包的 `files` 字段定义了发布的内容：

```json
{
  "files": [
    "dist",
    "src"
  ]
}
```

这意味着发布的包包含：
- `dist/` - 构建后的代码
- `src/` - TypeScript 源代码

## 在其他项目中使用

### 安装

```bash
npm install @vue-auto-i18n/cli @vue-auto-i18n/vite-plugin
```

### 从本地安装（开发测试）

```bash
npm install /path/to/vue-auto-i18n/packages/cli
npm install -D /path/to/vue-auto-i18n/packages/vite-plugin
```

## 示例项目

查看 `examples/test-project` 了解如何使用这些包。

## 版本管理

使用以下命令更新版本：

```bash
# 更新所有包到新版本
pnpm version major  # 2.0.0 -> 3.0.0
pnpm version minor  # 2.0.0 -> 2.1.0
pnpm version patch  # 2.0.0 -> 2.0.1
```

## 注意事项

1. **API Key 安全**：确保 `.env` 文件不会被提交到版本控制
2. **依赖关系**：确保所有包的依赖关系正确
3. **类型定义**：确保 `.d.ts` 文件正确生成
4. **构建产物**：发布前确保所有包都已构建
