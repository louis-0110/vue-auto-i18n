/**
 * Extractors Module Entry Point
 */

export { BaseExtractor, type ExtractionResult, type ExtractorOptions } from './base.js'
export { VueExtractor, extractFromVueFile } from './vue-extractor.js'
export { JSExtractor, extractFromJSFile, type JSExtractorOptions } from './js-extractor.js'

// Re-export convenience functions for backward compatibility
export async function extractChineseFromProject(options: any = {}) {
  const { VueExtractor } = await import('./vue-extractor.js')
  const { JSExtractor } = await import('./js-extractor.js')
  const fg = (await import('fast-glob')).default
  const fs = (await import('fs')).default
  const path = (await import('path')).default

  const {
    include = ['src/**/*.{vue,js,ts,jsx,tsx}'],
    exclude = ['node_modules/**'],
    maxLength,
    allowMixed,
    allowPunctuation
  } = options

  // Scan all target files
  const files = await fg.glob(include, { cwd: process.cwd(), ignore: exclude })

  const results = {
    uniqueTexts: [],
    fileMap: {},
    fileCount: 0,
    totalOccurrences: 0
  } as any

  const textMap = new Map()

  // 创建提取器时传递过滤选项
  const extractorOptions = {
    maxLength,
    allowMixed,
    allowPunctuation
  }

  const vueExtractor = new VueExtractor(extractorOptions)
  const jsExtractor = new JSExtractor(extractorOptions)

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file)
    const content = fs.readFileSync(filePath, 'utf-8')

    let extracted: any[] = []

    // Select extractor based on file type
    if (file.endsWith('.vue')) {
      extracted = await vueExtractor.extract(filePath, content)
    } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
      extracted = await jsExtractor.extract(filePath, content)
    }

    if (extracted.length > 0) {
      results.fileMap[file] = extracted
      results.fileCount++
      results.totalOccurrences += extracted.length

      // Deduplicate and record file sources
      extracted.forEach((item: any) => {
        const key = item.text
        if (!textMap.has(key)) {
          textMap.set(key, {
            text: key,
            files: [{ file, line: item.line, column: item.column }]
          })
        } else {
          const existing = textMap.get(key)
          existing.files.push({ file, line: item.line, column: item.column })
        }
      })
    }
  }

  results.uniqueTexts = Array.from(textMap.values())

  return results
}
