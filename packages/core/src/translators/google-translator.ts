/**
 * Google Translate Translator
 * Uses both official API and free API
 */

import { BaseTranslator, TranslatorOptions } from './base.js'

export interface GoogleTranslatorOptions extends TranslatorOptions {
  apiKey?: string
  useFreeAPI?: boolean
}

export class GoogleTranslator extends BaseTranslator {
  protected supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU', 'pt-BR', 'it-IT']
  protected options: GoogleTranslatorOptions

  private baseUrl = 'https://translation.googleapis.com/language/translate/v2'

  // Google Translate uses different language codes (zh instead of zh-CN)
  private languageCodeMap: Record<string, string> = {
    'zh-CN': 'zh',
    'en-US': 'en',
    'ja-JP': 'ja',
    'ko-KR': 'ko',
    'fr-FR': 'fr',
    'de-DE': 'de',
    'es-ES': 'es',
    'ru-RU': 'ru',
    'pt-BR': 'pt',
    'it-IT': 'it',
    'zh-TW': 'zh-TW',
    'ar': 'ar',
    'hi': 'hi',
    'th': 'th',
    'vi': 'vi'
  }

  constructor(options: GoogleTranslatorOptions = {}) {
    super(options)
    this.options = {
      useFreeAPI: !options.apiKey,
      ...options
    }
  }

  validateConfig(options: GoogleTranslatorOptions): boolean {
    if (!options.useFreeAPI && !options.apiKey) {
      throw new Error('Google Translate requires API Key when not using free API')
    }
    return true
  }

  async translate(texts: string[], from: string, to: string): Promise<string[]> {
    if (texts.length === 0) {
      return []
    }

    if (this.options.useFreeAPI) {
      return this.translateWithFreeAPI(texts, from, to)
    } else {
      return this.translateWithAPI(texts, from, to)
    }
  }

  /**
   * Convert locale code to Google language code
   */
  private toGoogleLang(code: string): string {
    return this.languageCodeMap[code] || code.split('-')[0]
  }

  /**
   * Use official API (requires payment) with batch optimization
   */
  private async translateWithAPI(texts: string[], from: string, to: string): Promise<string[]> {
    const googleFrom = this.toGoogleLang(from)
    const googleTo = this.toGoogleLang(to)

    const batchSize = 50 // Official API supports up to 50 texts per request
    const results: string[] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length))

      const response = await fetch(`${this.baseUrl}?key=${this.options.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: batch,
          source: googleFrom,
          target: googleTo,
          format: 'text'
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Google API error: ${response.status} ${response.statusText} - ${errorText}`)
      }

      const data = await response.json() as any
      if (data.error) {
        throw new Error(`Google API error: ${data.error.message || JSON.stringify(data.error)}`)
      }

      const translations = data.data?.translations || []
      results.push(...translations.map((t: any) => t.translatedText))
    }

    return results
  }

  /**
   * Use free Google Translate with concurrent batch optimization
   */
  private async translateWithFreeAPI(texts: string[], from: string, to: string): Promise<string[]> {
    const googleFrom = this.toGoogleLang(from)
    const googleTo = this.toGoogleLang(to)

    const concurrency = 5 // 并发数量：一次处理 5 个请求
    const delayBetweenBatches = 50 // 批次间延迟（毫秒）

    const results: string[] = []
    const errors: Array<{ text: string; error: string }> = []

    console.log(`  🚀 使用并发模式 (并发数: ${concurrency})`)

    // 分批处理，每批并发执行
    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, Math.min(i + concurrency, texts.length))
      const batchNumber = Math.floor(i / concurrency) + 1
      const totalBatches = Math.ceil(texts.length / concurrency)

      console.log(`  [批次 ${batchNumber}/${totalBatches}] 正在并发翻译 ${batch.length} 个文本...`)

      // 并发翻译当前批次
      const batchPromises = batch.map((text, index) =>
        this.translateSingleWithFreeAPI(text, googleFrom, googleTo)
          .then(result => ({ success: true as const, result, text }))
          .catch(error => ({
            success: false as const,
            result: text, // 失败时使用原文
            text,
            error: error instanceof Error ? error.message : String(error)
          }))
      )

      const batchResults = await Promise.all(batchPromises)

      // 处理批次结果
      for (const item of batchResults) {
        if (item.success) {
          results.push(item.result)
        } else {
          errors.push({ text: item.text, error: item.error })
          results.push(item.result)
        }
      }

      // 批次之间添加短暂延迟
      if (i + concurrency < texts.length) {
        await this.delay(delayBetweenBatches)
      }
    }

    if (errors.length > 0) {
      console.warn(`\n⚠️  ${errors.length} 个文本翻译失败，已使用原文`)
      errors.forEach(({ text, error }) => {
        console.warn(`  - "${text}": ${error}`)
      })
    }

    return results
  }

  /**
   * Translate a single text using free API
   */
  private async translateSingleWithFreeAPI(text: string, from: string, to: string): Promise<string> {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000)
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json() as any
    const translated = data[0]?.map((item: any) => item[0]).join('') || text
    return translated
  }

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
