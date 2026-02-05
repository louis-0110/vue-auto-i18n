/**
 * Monorepo Build Script
 * Builds all packages in the correct order
 */

import { execSync } from 'child_process'
import { readFileSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

// Build order (dependencies first)
const packages = [
  '@vue-auto-i18n/core',
  '@vue-auto-i18n/replacer',
  '@vue-auto-i18n/vite-plugin',
  '@vue-auto-i18n/cli'
]

console.log('\n🚀 Building Vue Auto I18n Monorepo...\n')

for (const pkg of packages) {
  const pkgPath = join(rootDir, 'packages', pkg.replace('@vue-auto-i18n/', ''))

  if (!existsSync(pkgPath)) {
    console.log(`⚠️  Package ${pkg} not found, skipping...`)
    continue
  }

  console.log(`\n📦 Building ${pkg}...`)

  try {
    execSync('pnpm build', {
      cwd: pkgPath,
      stdio: 'inherit'
    })
    console.log(`✅ ${pkg} built successfully`)
  } catch (error) {
    console.error(`❌ Failed to build ${pkg}`)
    process.exit(1)
  }
}

console.log('\n✨ All packages built successfully!\n')
