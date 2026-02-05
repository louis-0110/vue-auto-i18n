/**
 * Configuration Loader
 * Loads and merges configuration from i18n.config.js and environment variables
 */

import { existsSync } from 'fs'
import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export interface I18nConfig {
  // File patterns
  include: string[]
  exclude: string[]

  // Directories
  localesDir: string
  cacheDir: string

  // Translation
  translateService: 'google' | 'deepl' | 'openai' | 'baidu' | 'glm'
  targetLanguages: string[]
  incremental: boolean

  // ========== 翻译器配置（必需） ==========
  translator: {
    google?: {
      apiKey?: string
      useFreeAPI?: boolean
    }
    openai?: {
      apiKey?: string
      model?: string
      baseUrl?: string
      temperature?: number
      maxTokens?: number
    }
    glm?: {
      apiKey?: string
      model?: string
      baseUrl?: string
      temperature?: number
      top_p?: number
    }
    deepl?: {
      apiKey?: string
      apiUrl?: string
    }
    baidu?: {
      appId?: string
      secret?: string
    }
  }

  // Extraction filters
  extractMaxLength?: number       // 最大中文长度（默认20）
  extractAllowMixed?: boolean     // 是否允许中英混合（默认false）
  extractAllowPunctuation?: boolean // 是否允许标点符号（默认false）

  // Logging
  verbose: boolean
}

const defaultConfig: I18nConfig = {
  include: ['src/**/*.{vue,js,ts,jsx,tsx}'],
  exclude: ['node_modules/**', 'dist/**'],
  localesDir: 'src/locales',
  cacheDir: '.i18n-cache',
  translateService: 'google',
  targetLanguages: ['en-US', 'ja-JP'],
  incremental: true,
  translator: {
    google: {
      useFreeAPI: true,
    },
  },
  extractMaxLength: 20,           // 默认最大20个中文字符
  extractAllowMixed: false,       // 不允许中英混合
  extractAllowPunctuation: false, // 不允许标点符号
  verbose: false
}

/**
 * Load config from i18n.config.js
 */
export async function loadConfig(overrides: Partial<I18nConfig> = {}): Promise<I18nConfig> {
  let userConfig: Partial<I18nConfig> = {}

  // Try to load i18n.config.js from current working directory
  const configPath = join(process.cwd(), 'i18n.config.js')

  if (existsSync(configPath)) {
    try {
      // Using dynamic import for ES modules
      const configModule = await import(`file://${configPath}`)
      userConfig = configModule.default || {}
    } catch (error) {
      // If import fails, try to read and eval (for backward compatibility)
      try {
        const content = await readFile(configPath, 'utf-8')
        // Note: This is a simplified approach - in production you might want
        // to use a more sophisticated config loader
        const fn = new Function('module', 'require', 'process', content + '\nreturn module.exports;')({ exports: {} }, require, process)
        userConfig = fn || {}
      } catch (readError) {
        console.warn('Failed to load config file:', readError)
      }
    }
  }

  // Merge configs with priority: overrides > user config > defaults
  const merged: I18nConfig = {
    ...defaultConfig,
    ...userConfig,
    ...overrides
  }

  // ========== 确保翻译器配置完整 ==========
  // 如果用户没有提供 translator，使用默认的空配置
  if (!merged.translator) {
    merged.translator = {}
  }

  // 从环境变量填充翻译器配置
  if (merged.translator.google) {
    merged.translator.google = {
      apiKey: merged.translator.google.apiKey || process.env.GOOGLE_API_KEY || '',
      useFreeAPI: merged.translator.google.useFreeAPI ?? true,
    }
  }

  if (merged.translator.openai) {
    merged.translator.openai = {
      apiKey: merged.translator.openai.apiKey || process.env.OPENAI_API_KEY || '',
      model: merged.translator.openai.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
      baseUrl: merged.translator.openai.baseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1/chat/completions',
      temperature: merged.translator.openai.temperature || 0.3,
      maxTokens: merged.translator.openai.maxTokens || 1000,
    }
  }

  if (merged.translator.glm) {
    merged.translator.glm = {
      apiKey: merged.translator.glm.apiKey || process.env.GLM_API_KEY || '',
      model: merged.translator.glm.model || process.env.GLM_MODEL || 'glm-4',
      baseUrl: merged.translator.glm.baseUrl || process.env.GLM_BASE_URL || 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      temperature: merged.translator.glm.temperature || 0.3,
      top_p: merged.translator.glm.top_p || 0.7,
    }
  }

  if (merged.translator.deepl) {
    merged.translator.deepl = {
      apiKey: merged.translator.deepl.apiKey || process.env.DEEPL_API_KEY || '',
      apiUrl: merged.translator.deepl.apiUrl || process.env.DEEPL_API_URL || 'https://api-free.deepl.com/v2/translate',
    }
  }

  if (merged.translator.baidu) {
    merged.translator.baidu = {
      appId: merged.translator.baidu.appId || process.env.BAIDU_APP_ID || '',
      secret: merged.translator.baidu.secret || process.env.BAIDU_SECRET || '',
    }
  }

  return merged
}
