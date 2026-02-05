/**
 * Baidu Translator
 * Large free tier
 */

import { createHash } from 'crypto'
import { BaseTranslator, TranslatorOptions } from './base.js'

export interface BaiduTranslatorOptions extends TranslatorOptions {
  appId: string
  secret: string
}

export class BaiduTranslator extends BaseTranslator {
  protected supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU']
  protected options: BaiduTranslatorOptions
  private baseUrl = 'https://fanyi-api.baidu.com/api/trans/vip/translate'

  constructor(options: BaiduTranslatorOptions) {
    super(options)
    this.options = options
  }

  validateConfig(options: BaiduTranslatorOptions): boolean {
    if (!options.appId || !options.secret) {
      throw new Error('Baidu Translator requires appId and secret')
    }
    return true
  }

  async translate(texts: string[], from: string, to: string): Promise<string[]> {
    const results: string[] = []

    for (const text of texts) {
      try {
        const salt = Date.now()
        const sign = this.generateSign(text, salt)

        const url = `${this.baseUrl}?q=${encodeURIComponent(text)}&from=${from}&to=${to}&appid=${this.options.appId}&salt=${salt}&sign=${sign}`

        const response = await fetch(url)
        const data = await response.json() as {
          trans_code?: string
          error_code?: string
          trans_result?: Array<{ dst: string }>
        }

        if (data.trans_code === '200' || data.error_code === '52000') {
          results.push(data.trans_result?.[0]?.dst || text)
        } else {
          console.warn('Baidu translation failed:', data)
          results.push(text)
        }
      } catch (error) {
        console.warn('Baidu translation error:', error)
        results.push(text)
      }
    }

    return results
  }

  private generateSign(text: string, salt: number): string {
    // MD5(appId + text + salt + secret)
    const str = this.options.appId + text + salt + this.options.secret
    return createHash('md5').update(str).digest('hex')
  }
}
