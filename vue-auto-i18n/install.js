import { existsSync, mkdirSync, cpSync, symlink } from 'fs'
import { join, dirname, relative } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 安装后的包根目录
const packageRoot = __dirname

// 向上查找 node_modules 目录
let currentDir = packageRoot
while (currentDir !== dirname(currentDir)) {
  const nodeModulesDir = join(currentDir, 'node_modules')
  if (existsSync(nodeModulesDir)) {
    const targetDir = join(nodeModulesDir, '@vue-auto-i18n')
    const sourceDir = join(packageRoot, '@vue-auto-i18n')

    try {
      // 删除旧的目录
      const fs = await import('fs')
      if (existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true })
      }

      // 尝试创建符号链接（在支持的情况下）
      try {
        symlink(sourceDir, targetDir, 'junction')
      } catch (err) {
        // 如果符号链接失败，复制整个目录
        mkdirSync(targetDir, { recursive: true })
        const packages = ['core', 'replacer', 'vite-plugin', 'cli']

        for (const pkg of packages) {
          const source = join(sourceDir, pkg)
          const target = join(targetDir, pkg)

          if (existsSync(source)) {
            cpSync(source, target, { recursive: true })
          }
        }
      }
    } catch (err) {
      // 静默失败，不影响安装
    }

    break
  }
  currentDir = dirname(currentDir)
}
