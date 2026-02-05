/**
 * 检查所有包的版本号是否一致
 */

import { readFileSync, readdirSync, statSync } from 'fs'
import { join } from 'path'

const packagesDir = join(process.cwd(), 'packages')
const packages = readdirSync(packagesDir).filter(p => {
  const pkgPath = join(packagesDir, p, 'package.json')
  try {
    return statSync(pkgPath).isFile()
  } catch {
    return false
  }
})

console.log('📋 检查包版本:\n')

const versions = {}

for (const pkgName of packages) {
  const pkgPath = join(packagesDir, pkgName, 'package.json')
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'))

  const version = pkg.version
  versions[pkgName] = version

  console.log(`  @vue-auto-i18n/${pkgName}: ${version}`)
}

console.log()

// 检查版本是否一致
const versionValues = Object.values(versions)

if (versionValues.length === 0) {
  console.log('❌ 未找到任何包!')
  process.exit(1)
}

const firstVersion = versionValues[0]
const allSame = versionValues.every(v => v === firstVersion)

if (allSame) {
  console.log(`✅ 所有包版本一致: ${firstVersion}`)
} else {
  console.log('❌ 包版本不一致!')
  console.log('\n建议执行:')
  console.log('  pnpm version major  # 主版本')
  console.log('  pnpm version minor  # 次版本')
  console.log('  pnpm version patch  # 补丁版本')
  process.exit(1)
}
