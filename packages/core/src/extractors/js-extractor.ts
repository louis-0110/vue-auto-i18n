/**
 * JS/TS/JSX/TSX File Extractor
 * Supports Babel Parser (with OXC planned for future)
 */

import { parse, ParserOptions } from '@babel/parser'
import traverse from '@babel/traverse'
import { BaseExtractor, ExtractionResult, ExtractorOptions } from './base.js'

export interface JSExtractorOptions extends ExtractorOptions {
  useBabel?: boolean
  babelPlugins?: ParserOptions['plugins']
}

export class JSExtractor extends BaseExtractor {
  protected options: JSExtractorOptions

  constructor(options: JSExtractorOptions = {}) {
    super(options)
    this.options = {
      useBabel: true,
      babelPlugins: [
        'jsx',
        'typescript'
      ],
      ...options
    }
  }

  supports(filePath: string): boolean {
    return /\.(js|ts|jsx|tsx)$/.test(filePath)
  }

  async extract(filePath: string, content: string): Promise<ExtractionResult[]> {
    if (this.options.useBabel) {
      return this.extractWithBabel(content, filePath)
    }
    return this.extractWithRegex(content)
  }

  /**
   * Extract Chinese text using Babel AST traversal
   */
  private extractWithBabel(content: string, filePath: string): ExtractionResult[] {
    const results: ExtractionResult[] = []

    try {
      const ast = parse(content, {
        sourceType: 'module',
        plugins: this.options.babelPlugins
      })

      // Handle ESM default export
      const traverseFn = (traverse as any).default || traverse

      traverseFn(ast, {
        // String literals
        StringLiteral: (path: any) => {
          const { node } = path
          if (this.shouldExtract(node.value)) {
            results.push({
              text: node.value,
              line: node.loc?.start?.line || 0,
              column: node.loc?.start?.column || 0,
              type: 'script'
            })
          }
        },

        // Template strings
        TemplateElement: (path: any) => {
          const { node } = path
          if (this.shouldExtract(node.value.raw)) {
            results.push({
              text: this.normalizeText(node.value.raw),
              line: node.loc?.start?.line || 0,
              column: node.loc?.start?.column || 0,
              type: 'script'
            })
          }
        }
      })

    } catch (error) {
      // AST parsing failed, fallback to regex
      const errorMessage = error instanceof Error ? error.message : String(error)
      if (process.env.VUE_I18N_VERBOSE === 'true') {
        console.warn(`AST parsing failed for ${filePath}: ${errorMessage}`)
      }
      // Silently use regex as fallback
      return this.extractWithRegex(content)
    }

    return results
  }

  /**
   * Regex matching (fallback method)
   */
  private extractWithRegex(content: string): ExtractionResult[] {
    const results: ExtractionResult[] = []

    // Match Chinese in various scenarios
    const patterns = [
      // Single quoted strings
      /'([^']*[\u4e00-\u9fa5]+[^']*)'/g,
      // Double quoted strings
      /"([^"]*[\u4e00-\u9fa5]+[^"]*)"/g,
      // Template strings
      /`([^`]*[\u4e00-\u9fa5]+[^`]*)`/g,
      // JSX text
      />([^<]*[\u4e00-\u9fa5]+[^<]*)</g
    ]

    patterns.forEach(pattern => {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(content)) !== null) {
        const text = match[1].trim()
        if (this.shouldExtract(text) && text.length > 0) {
          results.push({
            text,
            line: 0,
            column: 0,
            type: 'script'
          })
        }
      }
    })

    return results
  }
}

// Export convenience function for backward compatibility
export function extractFromJSFile(filePath: string, content: string): ExtractionResult[] {
  const extractor = new JSExtractor()
  return extractor.extract(filePath, content) as any
}
