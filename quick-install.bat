@echo off
REM Vue Auto I18n 快速安装脚本 (Windows)
REM 使用方法: quick-install.bat [path-to-tgz]

setlocal enabledelayedexpansion

set "TGZ_FILE=%~1"
if "%TGZ_FILE%"=="" set "TGZ_FILE=.\vue-auto-i18n-2.0.0.tgz"

if not exist "%TGZ_FILE%" (
    echo ❌ 错误: 找不到 %TGZ_FILE%
    echo 使用方法: %~nx0 [path-to-tgz-file]
    exit /b 1
)

echo 📦 正在安装 Vue Auto I18n...
echo 文件: %TGZ_FILE%
echo.

REM 检测包管理器
where pnpm >nul 2>nul
if %errorlevel% equ 0 (
    echo 🔧 使用 pnpm 安装...
    call pnpm add "%TGZ_FILE%"
    goto :success
)

where yarn >nul 2>nul
if %errorlevel% equ 0 (
    echo 🔧 使用 yarn 安装...
    call yarn add "%TGZ_FILE%"
    goto :success
)

where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo 🔧 使用 npm 安装...
    call npm install "%TGZ_FILE%"
    goto :success
)

where bun >nul 2>nul
if %errorlevel% equ 0 (
    echo 🔧 使用 bun 安装...
    call bun add "%TGZ_FILE%"
    goto :success
)

echo ❌ 错误: 未找到包管理器 (pnpm/yarn/npm/bun)
exit /b 1

:success
echo.
echo 🎉 安装完成！
echo.
echo 快速开始:
echo   1. 在 vite.config.ts 中导入: import AutoI18n from 'vue-auto-i18n/vite'
echo   2. 运行 CLI: vue-auto-i18n extract --translate
echo.
echo 📚 更多信息请查看: https://github.com/your-repo/vue-auto-i18n

endlocal
