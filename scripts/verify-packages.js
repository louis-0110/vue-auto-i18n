/**
 * 验证包是否可以在外部项目中使用
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

console.log('🧪 验证包配置...\n')

const packagesDir = join(process.cwd(), 'packages')
const packages = ['core', 'cli', 'vite-plugin', 'replacer']

const errors = []

for (const pkgName of packages) {
  console.log(`📦 检查 @vue-auto-i18n/${pkgName}...`)

  const pkgPath = join(packagesDir, pkgName, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  // 1. 检查 version
  if (!pkg.version) {
    errors.push(`${pkgName}: 缺少版本号`)
    continue
  }
  console.log(`  ✅ 版本: ${pkg.version}`)

  // 2. 检查 main/exports
  if (!pkg.main && !pkg.exports) {
    errors.push(`${pkgName}: 缺少 main 或 exports 字段`)
    continue
  }
  console.log(`  ✅ 入口: ${pkg.main || Object.keys(pkg.exports)[0]}`)

  // 3. 检查 files
  if (!pkg.files || !pkg.files.includes('dist')) {
    errors.push(`${pkgName}: files 字段缺少 dist`)
    continue
  }
  console.log(`  ✅ 发布文件: ${pkg.files.join(', ')}`)

  // 4. 检查 dist 目录
  const distPath = join(packagesDir, pkgName, 'dist')
  if (!existsSync(distPath)) {
    errors.push(`${pkgName}: dist 目录不存在`)
    continue
  }
  console.log(`  ✅ dist 目录存在`)

  // 5. 检查依赖配置
  const deps = pkg.dependencies || {}
  for (const [depName, depVersion] of Object.entries(deps)) {
    if (depVersion === 'workspace:*') {
      errors.push(`${pkgName}: 依赖 ${depName} 仍使用 workspace:*`)
      continue
    }
  }
  if (Object.keys(deps).length > 0) {
    console.log(`  ✅ 依赖正确 (${Object.keys(deps).length} 个)`)
  }

  console.log()
}

// 6. 检查 pnpm workspace 配置
const pnpmWorkspace = join(process.cwd(), 'pnpm-workspace.yaml')
if (!existsSync(pnpmWorkspace)) {
  console.log('⚠️  警告: pnpm-workspace.yaml 不存在')
  console.log('   发布到 npm 后，用户需要手动安装依赖\n')
}

if (errors.length === 0) {
  console.log('✅ 所有包配置正确！\n')
  console.log('📝 下一步：')
  console.log('1. 测试发布（dry-run）:')
  console.log('   pnpm publish --dry-run')
  console.log('2. 正式发布:')
  console.log('   pnpm publish -r')
  console.log('3. 或发布单个包:')
  console.log('   pnpm --filter @vue-auto-i18n/core publish')
} else {
  console.log('❌ 发现问题：\n')
  errors.forEach(err => console.log(`  - ${err}`))
  process.exit(1)
}
