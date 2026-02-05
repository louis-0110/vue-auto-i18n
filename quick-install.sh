#!/bin/bash
# Vue Auto I18n 快速安装脚本
# 使用方法: ./quick-install.sh [path-to-tgz]

set -e

TGZ_FILE="${1:-./vue-auto-i18n-2.0.0.tgz}"

if [ ! -f "$TGZ_FILE" ]; then
    echo "❌ 错误: 找不到 $TGZ_FILE"
    echo "使用方法: $0 [path-to-tgz-file]"
    exit 1
fi

echo "📦 正在安装 Vue Auto I18n..."
echo "文件: $TGZ_FILE"
echo ""

# 检测包管理器
if command -v pnpm &> /dev/null; then
    echo "🔧 使用 pnpm 安装..."
    pnpm add "$TGZ_FILE"
elif command -v yarn &> /dev/null; then
    echo "🔧 使用 yarn 安装..."
    yarn add "$TGZ_FILE"
elif command -v npm &> /dev/null; then
    echo "🔧 使用 npm 安装..."
    npm install "$TGZ_FILE"
elif command -v bun &> /dev/null; then
    echo "🔧 使用 bun 安装..."
    bun add "$TGZ_FILE"
else
    echo "❌ 错误: 未找到包管理器 (pnpm/yarn/npm/bun)"
    exit 1
fi

echo ""
echo "🎉 安装完成！"
echo ""
echo "快速开始:"
echo "  1. 在 vite.config.ts 中导入: import AutoI18n from 'vue-auto-i18n/vite'"
echo "  2. 运行 CLI: vue-auto-i18n extract --translate"
echo ""
echo "📚 更多信息请查看: https://github.com/your-repo/vue-auto-i18n"
