/**
 * @vue-auto-i18n/vite-plugin
 * Vite plugin for automatic i18n transformation
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import type { Plugin } from 'vite'
import { transform } from './transform.js'
import { createCacheManager } from './cache.js'

export interface PluginOptions {
  localesDir?: string
  cacheDir?: string
  devMode?: boolean
  injectI18n?: boolean
  transformMode?: 'replace' | 'inject'
}

/**
 * Create Vite Auto I18n Plugin
 */
export function createAutoI18nPlugin(options: PluginOptions = {}): Plugin {
  const {
    localesDir = 'src/locales',
    cacheDir = '.i18n-cache',
    devMode = false,
    injectI18n = true,
    transformMode = 'replace'
  } = options

  // Store language pack mapping
  let keyMap: Record<string, string> | null = null
  let isProduction = false
  const cacheManager = createCacheManager(cacheDir)

  // Track processed files to prevent duplicate transformation in dev mode
  const processedFiles = new Map<string, string>()
  const fileHashes = new Map<string, number>()

  return {
    name: 'vite-plugin-auto-i18n',
    enforce: 'pre', // 在 Vue 插件之前执行，确保能拿到原始 .vue 文件

    // Detect production mode
    config(config, { command }) {
      isProduction = command === 'build'
    },

    // Load language pack at build start
    buildStart() {
      // Clear cache and processed files to ensure fresh transformation
      cacheManager.clear()
      processedFiles.clear()
      fileHashes.clear()

      try {
        const zhPath = join(process.cwd(), localesDir, 'zh-CN.json')
        const content = readFileSync(zhPath, 'utf-8')
        keyMap = JSON.parse(content)

        if (!devMode) {
          console.log('\n🌍 [vite-plugin-auto-i18n] Language pack loaded')
          console.log(`   - Keys count: ${Object.keys(keyMap || {}).length}`)
          console.log(`   - Mode: ${isProduction ? 'production' : 'development'}`)
        }
      } catch (error) {
        console.warn('[vite-plugin-auto-i18n] Language pack not found, skipping transformation')
        keyMap = null
      }
    },

    // Transform code
    transform(code, id) {
      // Skip in dev mode unless enabled
      if (!devMode && !isProduction) {
        return null
      }

      // Skip if no language pack
      if (!keyMap) {
        return null
      }

      // Only process .vue, .js, .ts files
      if (!/\.(vue|js|ts|jsx|tsx)$/.test(id)) {
        return null
      }

      // Skip node_modules
      if (id.includes('node_modules')) {
        return null
      }

      // File-level duplicate check: compute hash and compare
      const currentHash = hashString(code)
      const previousHash = fileHashes.get(id)

      if (previousHash === currentHash && processedFiles.has(id)) {
        // File already processed with same content
        if (!devMode) {
          console.log(`[vite-plugin-auto-i18n] Skipping already processed file: ${id.split('/').pop()}`)
        }
        return processedFiles.get(id) || null
      }

      // Update hash
      fileHashes.set(id, currentHash)

      // Log that we're processing this file
      if (!devMode) {
        console.log(`[vite-plugin-auto-i18n] Processing: ${id.split('/').pop()}`)
      }

      // Check cache
      const cached = cacheManager.get(id, code)
      if (cached) {
        if (!devMode) {
          console.log(`[vite-plugin-auto-i18n] Using cached result`)
        }
        // Store cached result in processed files
        processedFiles.set(id, cached.code)
        return cached
      }

      // Perform transformation
      const result = transform(code, id, keyMap, transformMode)

      // Log result
      if (!devMode) {
        if (result && result.code !== code) {
          console.log(`[vite-plugin-auto-i18n] ✓ Transformed: ${id.split('/').pop()}`)
        } else if (result) {
          console.log(`[vite-plugin-auto-i18n] - No changes needed`)
        } else {
          console.log(`[vite-plugin-auto-i18n] - Skipped (no transformation)`)
        }
      }

      // Cache result and store in processed files
      if (result) {
        cacheManager.set(id, code, result)
        processedFiles.set(id, result.code)
      }

      return result
    },

    // Handle HTML (optional)
    transformIndexHtml: {
      order: 'post',
      handler(html) {
        if (!injectI18n || !keyMap) return html
        return html
      }
    }
  }
}

/**
 * Simple hash function for string comparison
 * Uses a basic DJB2 hash algorithm
 */
function hashString(str: string): number {
  let hash = 5381
  let i = str.length

  while (i) {
    hash = (hash * 33) ^ str.charCodeAt(--i)
  }

  return hash >>> 0 // Convert to unsigned 32-bit integer
}

export default createAutoI18nPlugin
