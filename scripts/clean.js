/**
 * Clean Script
 * Removes dist folders and node_modules from all packages
 */

import { execSync } from 'child_process'
import { rmSync, existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const rootDir = join(__dirname, '..')

const packages = ['core', 'vite-plugin', 'cli', 'replacer']

console.log('\n🧹 Cleaning Vue Auto I18n Monorepo...\n')

// Clean dist folders
for (const pkg of packages) {
  const pkgPath = join(rootDir, 'packages', pkg)
  const distPath = join(pkgPath, 'dist')

  if (existsSync(distPath)) {
    rmSync(distPath, { recursive: true, force: true })
    console.log(`✅ Cleaned ${pkg}/dist`)
  }
}

// Clean root node_modules and reinstall
console.log('\n📦 Reinstalling dependencies...')
execSync('pnpm install', {
  cwd: rootDir,
  stdio: 'inherit'
})

console.log('\n✨ Cleanup complete!\n')
