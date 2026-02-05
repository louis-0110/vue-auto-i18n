/**
 * Base Extractor Class
 * All extractors should extend this class
 */

export interface ExtractionResult {
  text: string
  line: number
  column: number
  type?: 'template' | 'script' | 'style'
  context?: string
}

export interface ExtractorOptions {
  include?: string[]
  exclude?: string[]
  useContext?: boolean
  maxLength?: number
  allowMixed?: boolean
  allowPunctuation?: boolean
}

export abstract class BaseExtractor {
  protected options: ExtractorOptions

  constructor(options: ExtractorOptions = {}) {
    this.options = {
      include: ['src/**/*.{vue,js,ts,jsx,tsx}'],
      exclude: ['node_modules/**'],
      useContext: false,
      maxLength: 20,           // 默认最大20个字符
      allowMixed: false,       // 不允许中英混合
      allowPunctuation: false, // 不允许标点符号
      ...options
    }
  }

  /**
   * Extract Chinese text from file content
   * @param filePath - Absolute path to the file
   * @param content - File content
   * @returns Array of extraction results
   */
  abstract extract(filePath: string, content: string): Promise<ExtractionResult[]> | ExtractionResult[]

  /**
   * Check if this extractor supports the given file
   * @param filePath - Absolute path to the file
   * @returns true if this extractor can handle the file
   */
  abstract supports(filePath: string): boolean

  /**
   * Check if text contains Chinese characters
   * @param text - Text to check
   * @returns true if text contains Chinese
   */
  protected hasChinese(text: string): boolean {
    return /[\u4e00-\u9fa5]/.test(text)
  }

  /**
   * Check if text should be extracted based on filtering rules
   * @param text - Text to check
   * @returns true if text should be extracted
   */
  protected shouldExtract(text: string): boolean {
    // 必须包含中文
    if (!this.hasChinese(text)) {
      return false
    }

    const normalized = text.trim()

    // 检查长度（只计算中文字符）
    const chineseChars = normalized.match(/[\u4e00-\u9fa5]/g) || []
    if (chineseChars.length > (this.options.maxLength || 20)) {
      return false
    }

    // 检查中英混合
    if (!this.options.allowMixed) {
      const hasEnglish = /[a-zA-Z]/.test(normalized)
      const hasChinese = /[\u4e00-\u9fa5]/.test(normalized)
      if (hasEnglish && hasChinese) {
        return false
      }
    }

    // 检查标点符号（任何标点符号都不允许，除非明确允许）
    if (!this.options.allowPunctuation) {
      // 检查是否有任何标点符号（包括中文和英文标点）
      const hasPunctuation = /[,\.\!?;:'"~@#\$%\^&\*\(\)\[\]{}|\\\/\+\-=<>]/.test(normalized) ||
        /[\u3002\uff0c\u3001\uff1f\uff01\uff1b\uff1a\u201c\u201d\u2018\u2019\uff08uff09\u300a\u300b\uff1c\uff5e\uff5f\u2026\u2014\u2022\u25cf\u25cb]/.test(normalized)

      if (hasPunctuation) {
        return false
      }
    }

    return true
  }

  /**
   * Remove whitespace and normalize text
   * @param text - Text to normalize
   * @returns Normalized text
   */
  protected normalizeText(text: string): string {
    return text.trim().replace(/\s+/g, ' ')
  }
}
