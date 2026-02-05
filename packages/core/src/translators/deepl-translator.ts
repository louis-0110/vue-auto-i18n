/**
 * DeepL Translator
 * Best translation quality, but requires payment
 */

import { BaseTranslator, TranslatorOptions } from './base.js'

export interface DeepLTranslatorOptions extends TranslatorOptions {
  apiKey: string
  apiUrl?: string
}

export class DeepLTranslator extends BaseTranslator {
  protected supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU']
  protected options: DeepLTranslatorOptions

  constructor(options: DeepLTranslatorOptions) {
    super(options)
    this.options = {
      apiUrl: 'https://api-free.deepl.com/v2/translate',
      ...options
    }
  }

  private getApiUrl(): string {
    return this.options.apiUrl || 'https://api-free.deepl.com/v2/translate'
  }

  validateConfig(options: DeepLTranslatorOptions): boolean {
    if (!options.apiKey) {
      throw new Error('DeepL requires API Key')
    }
    return true
  }

  async translate(texts: string[], from: string, to: string): Promise<string[]> {
    // DeepL supports batch translation but has text length limits
    const results: string[] = []

    // Process in batches (max 50 texts per batch)
    const batchSize = 50
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      try {
        const response = await fetch(this.getApiUrl(), {
          method: 'POST',
          headers: {
            'Authorization': `DeepL-Auth-Key ${this.options.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            text: batch,
            source_lang: from.toUpperCase().replace('-', '-'),
            target_lang: to.toUpperCase().replace('-', '-')
          })
        })

        const data = await response.json() as { translations: Array<{ text: string }> }
        const translations = data.translations.map((t) => t.text)
        results.push(...translations)

      } catch (error) {
        console.warn('DeepL translation failed:', error)
        // Return original texts on failure
        results.push(...batch)
      }
    }

    return results
  }
}
