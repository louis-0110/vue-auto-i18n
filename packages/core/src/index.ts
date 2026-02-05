/**
 * @vue-auto-i18n/core
 * Main entry point for the core package
 */

// Export config
export {
  loadConfig,
  type I18nConfig
} from './config.js'

// Export extractors
export {
  BaseExtractor,
  VueExtractor,
  JSExtractor,
  extractChineseFromProject,
  extractFromVueFile,
  extractFromJSFile,
  type ExtractionResult,
  type ExtractorOptions,
  type JSExtractorOptions
} from './extractors/index.js'

// Export translators
export {
  BaseTranslator,
  GoogleTranslator,
  OpenAITranslator,
  DeepLTranslator,
  BaiduTranslator,
  GLMTranslator,
  TranslatorRegistry,
  defaultRegistry,
  createTranslatorFromConfig,
  type TranslationResult,
  type TranslatorOptions,
  type GoogleTranslatorOptions,
  type OpenAITranslatorOptions,
  type DeepLTranslatorOptions,
  type BaiduTranslatorOptions,
  type GLMTranslatorOptions
} from './translators/index.js'

// Export utilities
export {
  ensureDir,
  saveExtractedText,
  loadExtractedText,
  saveLocale,
  loadLocale,
  generateKey,
  hasChinese,
  normalizeText,
  readFile,
  writeFile,
  fileExists
} from './utils/index.js'
