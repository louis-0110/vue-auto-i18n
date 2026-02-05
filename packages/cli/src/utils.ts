/**
 * CLI Utility Functions
 */

import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import type { CLIOptions } from './types.js'
import { loadConfig } from '@vue-auto-i18n/core'

/**
 * 加载 .env 文件
 */
function loadEnvFile(): void {
  const envPath = join(process.cwd(), '.env')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf-8')
    content.split('\n').forEach(line => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=')
        const value = valueParts.join('=').trim()
        if (key && value) {
          process.env[key] = value
        }
      }
    })
  }
}

/**
 * Load config with command-line overrides
 */
export async function loadConfigWithOverrides(options: CLIOptions): Promise<any> {
  // 加载 .env 文件
  loadEnvFile()

  const overrides: any = {}

  if (options.output) {
    overrides.localesDir = options.output
  }

  if (options.verbose) {
    overrides.verbose = true
  }

  if (options.config) {
    process.env.CONFIG_PATH = options.config
  }

  // Load config using the core package's config loader
  const config = await loadConfig(overrides)

  return config
}

/**
 * Create translator instance based on config
 */
export async function createTranslator(config: any): Promise<any> {
  const { createTranslatorFromConfig } = await import('@vue-auto-i18n/core')

  // 使用统一配置创建翻译器
  return createTranslatorFromConfig(config)
}

/**
 * Load package.json for version info
 */
export function loadPackageJSON(): any {
  const pkgPath = join(process.cwd(), 'package.json')
  try {
    return JSON.parse(readFileSync(pkgPath, 'utf-8'))
  } catch {
    return { version: '2.0.0' }
  }
}
