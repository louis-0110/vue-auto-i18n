/**
 * Pack Monorepo Script
 * Creates a single .tgz package that includes all workspace packages
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, rmSync, copyFileSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { execSync } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = join(__dirname, '..')
const packagesDir = join(rootDir, 'packages')

console.log('📦 Preparing to pack monorepo...\n')

// Read package.json files
const packages = ['core', 'vite-plugin', 'cli', 'replacer']
const packageInfos = []

for (const pkg of packages) {
  const pkgJsonPath = join(packagesDir, pkg, 'package.json')
  const pkgJson = JSON.parse(readFileSync(pkgJsonPath, 'utf-8'))
  packageInfos.push({
    name: pkg,
    fullName: pkgJson.name,
    version: pkgJson.version,
    path: join(packagesDir, pkg),
    dependencies: pkgJson.dependencies || {}
  })
  console.log(`  ✓ Found ${pkgJson.name}@${pkgJson.version}`)
}

// Merge all dependencies from all packages
const mergedDependencies = {}
for (const pkg of packageInfos) {
  // Merge dependencies (excluding local @vue-auto-i18n/* dependencies)
  for (const [depName, depVersion] of Object.entries(pkg.dependencies)) {
    if (!depName.startsWith('@vue-auto-i18n/')) {
      mergedDependencies[depName] = depVersion
    }
  }
}

// Create aggregated package.json
const aggregatedPkgJson = {
  name: 'vue-auto-i18n',
  version: '2.0.0',
  description: 'Vue Auto I18n - Complete toolkit with automatic translation and AST transformation',
  type: 'module',
  private: false,
  license: 'MIT',
  author: '',
  // Add bin field for CLI command
  bin: {
    'vue-auto-i18n': './packages/cli/dist/cli.js'
  },
  keywords: [
    'vue',
    'i18n',
    'internationalization',
    'translation',
    'ast',
    'automation',
    'vite',
    'plugin',
    'cli'
  ],
  // Make all packages available
  exports: {
    '.': {
      import: './packages/core/dist/index.js',
      types: './packages/core/dist/index.d.ts'
    },
    './core': {
      import: './packages/core/dist/index.js',
      types: './packages/core/dist/index.d.ts'
    },
    './core/extractors': {
      import: './packages/core/dist/extractors/index.js',
      types: './packages/core/dist/extractors/index.d.ts'
    },
    './core/translators': {
      import: './packages/core/dist/translators/index.js',
      types: './packages/core/dist/translators/index.d.ts'
    },
    './core/utils': {
      import: './packages/core/dist/utils/index.js',
      types: './packages/core/dist/utils/index.d.ts'
    },
    './vite-plugin': {
      import: './packages/vite-plugin/dist/index.js',
      types: './packages/vite-plugin/dist/index.d.ts'
    },
    './cli': {
      import: './packages/cli/dist/index.js',
      types: './packages/cli/dist/index.d.ts'
    },
    './replacer': {
      import: './packages/replacer/dist/index.js',
      types: './packages/replacer/dist/index.d.ts'
    }
  },
  peerDependencies: {
    vite: '^4.0.0 || ^5.0.0',
    vue: '^3.0.0'
  },
  // Include all merged dependencies
  dependencies: mergedDependencies,
  // Include dist files
  files: [
    'packages/*/dist',
    'README.md'
  ]
}

// Create temporary directory for packing
const tempDir = join(rootDir, '.pack-temp')
if (existsSync(tempDir)) {
  rmSync(tempDir, { recursive: true, force: true })
}
mkdirSync(tempDir, { recursive: true })

console.log('\n📋 Creating aggregated package structure...')

// Write aggregated package.json
writeFileSync(join(tempDir, 'package.json'), JSON.stringify(aggregatedPkgJson, null, 2))
console.log('  ✓ Created package.json')

// Copy README
const readmePath = join(rootDir, 'README.md')
if (existsSync(readmePath)) {
  copyFileSync(readmePath, join(tempDir, 'README.md'))
  console.log('  ✓ Copied README.md')
}

// Copy packages directory (only dist files)
mkdirSync(join(tempDir, 'packages'), { recursive: true })
for (const pkg of packageInfos) {
  const pkgTempDir = join(tempDir, 'packages', pkg.name)
  mkdirSync(pkgTempDir, { recursive: true })

  // Copy dist directory recursively
  const distDir = join(pkg.path, 'dist')
  if (existsSync(distDir)) {
    copyDirectory(distDir, join(pkgTempDir, 'dist'))

    // Replace internal @vue-auto-i18n/* imports with vue-auto-i18n/*
    replaceImportsInDirectory(join(pkgTempDir, 'dist'))
  }

  // Note: NOT copying package.json for sub-packages to avoid dependency resolution issues
  // All dependencies are now in the root package.json

  console.log(`  ✓ Copied ${pkg.fullName}`)
}

console.log('\n📦 Creating .tgz file...')

try {
  // Pack the aggregated package
  const originalCwd = process.cwd()
  process.chdir(tempDir)
  const result = execSync('pnpm pack', { encoding: 'utf-8' })
  console.log(result)

  // Move the .tgz file to root directory
  const tgzFile = 'vue-auto-i18n-2.0.0.tgz'
  const sourcePath = join(tempDir, tgzFile)
  const targetPath = join(rootDir, tgzFile)

  if (existsSync(sourcePath)) {
    copyFileSync(sourcePath, targetPath)
    console.log(`\n✅ Successfully created: ${tgzFile}`)
    console.log(`📍 Location: ${targetPath}`)
  }

  // Cleanup
  process.chdir(originalCwd)
  rmSync(tempDir, { recursive: true, force: true })
  console.log('🧹 Cleaned up temporary files')

  console.log('\n📝 Usage:')
  console.log(`   npm install ${targetPath}`)
  console.log(`   pnpm add ${targetPath}`)

} catch (error) {
  console.error('\n❌ Error creating package:', error.message)
  process.exit(1)
}

// Helper function to copy directory recursively
function copyDirectory(src, dest) {
  mkdirSync(dest, { recursive: true })

  const entries = readdirSync(src, { withFileTypes: true })

  for (const entry of entries) {
    const srcPath = join(src, entry.name)
    const destPath = join(dest, entry.name)

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath)
    } else {
      copyFileSync(srcPath, destPath)
    }
  }
}

// Helper function to replace internal imports in JavaScript files
function replaceImportsInDirectory(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)

    if (entry.isDirectory()) {
      replaceImportsInDirectory(fullPath)
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.cjs') || fullPath.endsWith('.mjs'))) {
      // Replace @vue-auto-i18n/* with vue-auto-i18n/*
      let content = readFileSync(fullPath, 'utf-8')
      const original = content
      content = content.replace(/@vue-auto-i18n\//g, 'vue-auto-i18n/')

      if (content !== original) {
        writeFileSync(fullPath, content)
        console.log(`    Updated imports in: ${entry.name}`)
      }
    }
  }
}
