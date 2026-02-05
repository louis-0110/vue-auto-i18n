/**
 * Vue Single File Component Extractor
 * Uses @vue/compiler-sfc to parse .vue files
 */

import { parse, SFCDescriptor } from '@vue/compiler-sfc'
import { BaseExtractor, ExtractionResult, ExtractorOptions } from './base.js'

export class VueExtractor extends BaseExtractor {
  constructor(options: ExtractorOptions = {}) {
    super(options)
  }

  supports(filePath: string): boolean {
    return filePath.endsWith('.vue')
  }

  async extract(filePath: string, content: string): Promise<ExtractionResult[]> {
    const results: ExtractionResult[] = []

    try {
      const { descriptor, errors } = parse(content)

      if (errors && errors.length > 0) {
        console.warn(`Failed to parse Vue file: ${filePath}`, errors)
        return results
      }

      // Extract from template
      if (descriptor.template) {
        const templateTexts = this.extractFromTemplate(descriptor.template.ast)
        results.push(...templateTexts)
      }

      // Extract from script
      if (descriptor.script || descriptor.scriptSetup) {
        const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''
        const scriptTexts = this.extractFromScript(scriptContent, 'script')
        results.push(...scriptTexts)
      }

    } catch (error) {
      console.error(`Error processing Vue file: ${filePath}`, error)
    }

    return results
  }

  /**
   * Extract Chinese text from template AST
   */
  private extractFromTemplate(templateAst: any): ExtractionResult[] {
    const texts: ExtractionResult[] = []

    const traverse = (node: any) => {
      if (!node) return

      // Extract text nodes
      if (node.type === 2 && this.shouldExtract(node.content)) {
        // type 2 is TEXT type in Vue compiler
        texts.push({
          text: this.normalizeText(node.content),
          line: node.loc?.start?.line || 0,
          column: node.loc?.start?.column || 0,
          type: 'template'
        })
      }

      // Extract Chinese from attributes
      if (node.type === 1 && node.props) {
        // type 1 is ELEMENT type
        node.props.forEach((prop: any) => {
          if (prop.type === 6 && this.shouldExtract(prop.value?.content)) {
            // type 6 is ATTRIBUTE type
            texts.push({
              text: prop.value.content,
              line: prop.loc?.start?.line || 0,
              column: prop.loc?.start?.column || 0,
              type: 'template',
              context: `attribute: ${prop.name}`
            })
          }
        })
      }

      // Recursively traverse children
      if (node.children) {
        node.children.forEach(traverse)
      }
    }

    traverse(templateAst)
    return texts
  }

  /**
   * Extract Chinese text from script content (using regex as fallback)
   */
  private extractFromScript(scriptContent: string, source: string): ExtractionResult[] {
    const texts: ExtractionResult[] = []

    if (!scriptContent) return texts

    // Match string literals with Chinese
    const patterns = [
      /['"`]([^'"`]*[\u4e00-\u9fa5]+[^'"`]*)['"`]/g
    ]

    patterns.forEach(pattern => {
      let match: RegExpExecArray | null
      while ((match = pattern.exec(scriptContent)) !== null) {
        const text = match[1]
        if (this.shouldExtract(text) && text.trim().length > 0) {
          texts.push({
            text: this.normalizeText(text),
            line: 0,
            column: 0,
            type: 'script'
          })
        }
      }
    })

    return texts
  }
}

// Export convenience function for backward compatibility
export function extractFromVueFile(filePath: string, content: string): ExtractionResult[] {
  const extractor = new VueExtractor()
  return extractor.extract(filePath, content) as any
}
