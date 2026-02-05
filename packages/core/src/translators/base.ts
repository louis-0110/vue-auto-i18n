/**
 * Base Translator Class
 * All translators should extend this class
 */

export interface TranslationResult {
  original: string
  translated: string
  error?: string
}

export interface TranslatorOptions {
  apiKey?: string
  apiUrl?: string
  maxRetries?: number
  timeout?: number
}

export abstract class BaseTranslator {
  protected options: TranslatorOptions
  protected abstract supportedLanguages: string[]

  constructor(options: TranslatorOptions = {}) {
    this.options = {
      maxRetries: 3,
      timeout: 30000,
      ...options
    }
  }

  /**
   * Translate texts from source language to target language
   * @param texts - Array of texts to translate
   * @param from - Source language code (e.g., 'zh-CN')
   * @param to - Target language code (e.g., 'en-US')
   * @returns Array of translation results
   */
  abstract translate(texts: string[], from: string, to: string): Promise<string[]>

  /**
   * Validate translator configuration
   * @param options - Options to validate
   * @returns true if configuration is valid
   * @throws Error if configuration is invalid
   */
  abstract validateConfig(options: TranslatorOptions): boolean

  /**
   * Check if language is supported
   * @param language - Language code to check
   * @returns true if language is supported
   */
  supportsLanguage(language: string): boolean {
    return this.supportedLanguages.includes(language)
  }

  /**
   * Batch translate with error handling
   * @param texts - Array of texts to translate
   * @param from - Source language code
   * @param to - Target language code
   * @param batchSize - Number of texts to translate per batch
   * @returns Array of translation results with error handling
   */
  async batchTranslate(
    texts: string[],
    from: string,
    to: string,
    batchSize: number = 10
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      try {
        const translated = await this.translate(batch, from, to)

        for (let j = 0; j < batch.length; j++) {
          results.push({
            original: batch[j],
            translated: translated[j] || batch[j] // Fallback to original if translation fails
          })
        }
      } catch (error) {
        // On error, return original texts for this batch
        for (const text of batch) {
          results.push({
            original: text,
            translated: text,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }
    }

    return results
  }

  /**
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
