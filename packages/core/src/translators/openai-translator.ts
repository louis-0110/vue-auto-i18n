/**
 * OpenAI Translator
 * Uses GPT models for translation, best contextual understanding
 */

import { BaseTranslator, TranslatorOptions } from './base.js'

export interface OpenAITranslatorOptions extends TranslatorOptions {
  apiKey: string
  model?: string
  baseUrl?: string
}

export class OpenAITranslator extends BaseTranslator {
  protected supportedLanguages = ['zh-CN', 'en-US', 'ja-JP', 'ko-KR', 'fr-FR', 'de-DE', 'es-ES', 'ru-RU']
  protected options: OpenAITranslatorOptions

  constructor(options: OpenAITranslatorOptions) {
    super(options)
    this.options = {
      model: 'gpt-3.5-turbo',
      baseUrl: 'https://api.openai.com/v1/chat/completions',
      ...options
    }
  }

  private getBaseUrl(): string {
    return this.options.baseUrl || 'https://api.openai.com/v1/chat/completions'
  }

  validateConfig(options: OpenAITranslatorOptions): boolean {
    if (!options.apiKey) {
      throw new Error('OpenAI requires API Key')
    }
    return true
  }

  async translate(texts: string[], from: string, to: string): Promise<string[]> {
    const batchSize = 10
    const results: string[] = []

    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize)

      try {
        const prompt = this.buildPrompt(batch, from, to)

        const response = await fetch(this.getBaseUrl(), {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.options.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: this.options.model,
            messages: [
              {
                role: 'system',
                content: 'You are a professional translation assistant. Translate the provided text to the target language and return only the translation results without any explanation.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature: 0.3
          })
        })

        const data = await response.json() as { choices: Array<{ message: { content: string } }> }
        const translated = data.choices[0]?.message?.content || ''
        const translations = translated.split('\n').filter((t: string) => t.trim())

        results.push(...translations)

      } catch (error) {
        console.warn('OpenAI translation failed:', error)
        results.push(...batch)
      }
    }

    return results
  }

  private buildPrompt(texts: string[], from: string, to: string): string {
    const langNames: Record<string, string> = {
      'zh-CN': 'Chinese',
      'en-US': 'English',
      'ja-JP': 'Japanese',
      'ko-KR': 'Korean',
      'fr-FR': 'French',
      'de-DE': 'German',
      'es-ES': 'Spanish',
      'ru-RU': 'Russian'
    }

    const sourceLang = langNames[from] || from
    const targetLang = langNames[to] || to

    const textList = texts.map((text, i) => `${i + 1}. ${text}`).join('\n')

    return `Please translate the following ${sourceLang} texts into ${targetLang}, one translation result per line:\n\n${textList}`
  }
}
