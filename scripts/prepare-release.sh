#!/bin/bash

# Vue Auto I18n 发布准备脚本

set -e

echo "🚀 准备发布 Vue Auto I18n..."
echo

# 1. 清理所有包
echo "📦 清理构建产物..."
pnpm run clean
echo

# 2. 构建所有包
echo "🔨 构建所有包..."
pnpm run build
echo

# 3. 运行测试
echo "🧪 运行测试..."
pnpm test
echo

# 4. 检查包版本
echo "📋 检查包版本..."
node scripts/check-versions.js
echo

# 5. 生成测试语言包
echo "🌍 生成测试语言包..."
cd examples/test-project
node ../../packages/cli/dist/cli.js auto
cd ../..
echo

echo "✅ 发布准备完成！"
echo
echo "📝 下一步："
echo "1. 检查 CHANGELOG.md"
echo "2. 运行: pnpm publish -r"
echo "3. 创建 Git tag: git tag v$(node -p \"require('./packages/core/package.json').version\")"
