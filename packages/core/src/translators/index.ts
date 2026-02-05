/**
 * Translators Module Entry Point
 */

import { BaseTranslator, type TranslationResult, type TranslatorOptions } from './base.js'
import { GoogleTranslator, type GoogleTranslatorOptions } from './google-translator.js'
import { OpenAITranslator, type OpenAITranslatorOptions } from './openai-translator.js'
import { DeepLTranslator, type DeepLTranslatorOptions } from './deepl-translator.js'
import { BaiduTranslator, type BaiduTranslatorOptions } from './baidu-translator.js'
import { GLMTranslator, type GLMTranslatorOptions } from './glm-translator.js'
import type { I18nConfig } from '../config.js'

export { BaseTranslator, type TranslationResult, type TranslatorOptions }
export { GoogleTranslator, type GoogleTranslatorOptions }
export { OpenAITranslator, type OpenAITranslatorOptions }
export { DeepLTranslator, type DeepLTranslatorOptions }
export { BaiduTranslator, type BaiduTranslatorOptions }
export { GLMTranslator, type GLMTranslatorOptions }

/**
 * 根据配置创建翻译器实例（使用统一配置）
 * @param config - I18nConfig 配置对象
 * @returns 翻译器实例
 */
export function createTranslatorFromConfig(config: I18nConfig): BaseTranslator {
  const { translateService, translator } = config

  switch (translateService) {
    case 'google': {
      const googleConfig = translator?.google || { useFreeAPI: true }
      return new GoogleTranslator({
        apiKey: googleConfig.apiKey || '',
        useFreeAPI: googleConfig.useFreeAPI ?? true,
      })
    }

    case 'openai': {
      const openaiConfig = translator?.openai || {}
      return new OpenAITranslator({
        apiKey: openaiConfig.apiKey || '',
        model: openaiConfig.model,
        baseUrl: openaiConfig.baseUrl,
      })
    }

    case 'glm': {
      const glmConfig = translator?.glm || {}
      return new GLMTranslator({
        apiKey: glmConfig.apiKey || '',
        model: glmConfig.model,
        baseUrl: glmConfig.baseUrl,
      })
    }

    case 'deepl': {
      const deeplConfig = translator?.deepl || {}
      return new DeepLTranslator({
        apiKey: deeplConfig.apiKey || '',
        apiUrl: deeplConfig.apiUrl,
      })
    }

    case 'baidu': {
      const baiduConfig = translator?.baidu || {}
      return new BaiduTranslator({
        appId: baiduConfig.appId || '',
        secret: baiduConfig.secret || '',
      })
    }

    default:
      throw new Error(`Unsupported translation service: ${translateService}`)
  }
}

/**
 * Translator Registry
 * Allows registering and creating translator instances
 */
export class TranslatorRegistry {
  #translators = new Map<string, any>()

  register(name: string, TranslatorClass: any) {
    this.#translators.set(name, TranslatorClass)
  }

  create(name: string, config: any) {
    const Class = this.#translators.get(name)
    if (!Class) {
      throw new Error(`Translator "${name}" not found in registry`)
    }
    return new Class(config)
  }

  list(): string[] {
    return Array.from(this.#translators.keys())
  }
}

// Create default registry and register built-in translators
export const defaultRegistry = new TranslatorRegistry()

// Register built-in translators
defaultRegistry.register('google', GoogleTranslator)
defaultRegistry.register('openai', OpenAITranslator)
defaultRegistry.register('glm', GLMTranslator)
defaultRegistry.register('deepl', DeepLTranslator)
defaultRegistry.register('baidu', BaiduTranslator)
