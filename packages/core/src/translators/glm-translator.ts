/**
 * GLM (智谱AI) Translator
 * 使用 GLM-4 等模型进行翻译
 */

import { BaseTranslator, TranslatorOptions } from './base.js'

/**
 * 翻译错误类
 */
export class TranslationError extends Error {
  public readonly failures: Array<{ text: string; error: string }>

  constructor(message: string, failures: Array<{ text: string; error: string }>) {
    super(message)
    this.name = 'TranslationError'
    this.failures = failures
  }
}

export interface GLMTranslatorOptions extends TranslatorOptions {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class GLMTranslator extends BaseTranslator {
  protected supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU']
  protected options: GLMTranslatorOptions

  constructor(options: GLMTranslatorOptions) {
    super(options)
    this.options = {
      model: 'glm-4',
      baseUrl: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
      ...options
    }
  }

  validateConfig(options: GLMTranslatorOptions): boolean {
    if (!options.apiKey) {
      throw new Error('GLM Translator requires API Key')
    }
    return true
  }

  async translate(texts: string[], from: string, to: string): Promise<string[]> {
    this.validateConfig(this.options)

    if (texts.length === 0) {
      return []
    }

    // 批量翻译配置
    const batchSize = 10 // 每批最多翻译 10 个文本
    const results: string[] = []
    const errors: Array<{ text: string; error: string }> = []

    // 分批处理
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length))
      const batchNumber = Math.floor(i / batchSize) + 1
      const totalBatches = Math.ceil(texts.length / batchSize)

      try {
        console.log(`  [批次 ${batchNumber}/${totalBatches}] 正在翻译 ${batch.length} 个文本...`)
        const translations = await this.translateBatch(batch, from, to)
        results.push(...translations)
      } catch (error) {
        // 批量失败时，降级为逐个翻译
        console.log(`  [批次 ${batchNumber}] 批量翻译失败，降级为逐个翻译...`)
        for (const text of batch) {
          try {
            const translation = await this.translateSingle(text, from, to)
            results.push(translation)
          } catch (singleError) {
            const errorMessage = singleError instanceof Error ? singleError.message : String(singleError)
            errors.push({ text, error: errorMessage })
            results.push(text) // 失败时使用原文
          }
        }
      }
    }

    // 如果有任何翻译失败，抛出错误
    if (errors.length > 0) {
      const error = new TranslationError('Some texts failed to translate', errors)
      throw error
    }

    return results
  }

  private async translateBatch(texts: string[], from: string, to: string): Promise<string[]> {
    // 构建批量翻译 prompt
    const items = texts.map((text, index) => `${index + 1}. ${text}`).join('\n')
    const prompt = `请将以下${this.getLanguageName(from)}翻译成${this.getLanguageName(to)}，为每一行提供对应的翻译结果。严格按照以下 JSON 格式返回，不要有任何其他内容：
{
  "translations": ["翻译1", "翻译2", "翻译3", ...]
}

待翻译文本：
${items}`

    const response = await fetch(this.options.baseUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as any

    if (data.error) {
      throw new Error(`GLM API error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    const content = data.choices?.[0]?.message?.content || ''

    // 解析 JSON 响应
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('No JSON found in response')
      }

      const result = JSON.parse(jsonMatch[0])
      const translations = result.translations || []

      if (translations.length !== texts.length) {
        throw new Error(`Expected ${texts.length} translations, got ${translations.length}`)
      }

      return translations
    } catch (error) {
      // JSON 解析失败，抛出错误让上层降级为单个翻译
      throw new Error(`Failed to parse batch translation response: ${error instanceof Error ? error.message : String(error)}`)
    }
  }

  private async translateSingle(text: string, from: string, to: string): Promise<string> {
    const prompt = `请将以下${this.getLanguageName(from)}翻译成${this.getLanguageName(to)}，只返回翻译结果，不要有任何解释。\n\n${text}`

    const response = await fetch(this.options.baseUrl!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.7,
        stream: false
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    const data = await response.json() as any

    if (data.error) {
      throw new Error(`GLM API error: ${data.error.message || JSON.stringify(data.error)}`)
    }

    const content = data.choices?.[0]?.message?.content || text
    return content.trim()
  }

  private getLanguageName(code: string): string {
    const names: Record<string, string> = {
      'zh-CN': '中文',
      'en-US': '英文',
      'ja-JP': '日文',
      'ko-KR': '韩文'
    }
    return names[code] || code
  }

 
 

  protected delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
