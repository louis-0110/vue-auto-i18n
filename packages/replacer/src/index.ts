/**
 * @vue-auto-i18n/replacer
 * Code replacement tool for transforming Chinese text to $t() calls
 */

import { promises as fs } from 'fs'
import path from 'path'
import { parse } from '@vue/compiler-sfc'
import { parse as babelParse } from '@babel/parser'
import traverse from '@babel/traverse'
import generate from '@babel/generator'
import { loadLocale, generateKey } from '@vue-auto-i18n/core'

export interface ReplacerOptions {
  localesDir?: string
  include?: string[]
  exclude?: string[]
  createBackup?: boolean
  dryRun?: boolean
}

export interface ReplacerResult {
  files: number
  replacements: number
  backups: number
  dryRun: boolean
}

/**
 * Replace files with $t() calls
 */
export async function replaceFiles(
  config: any,
  options: ReplacerOptions = {}
): Promise<ReplacerResult> {
  const {
    localesDir = config.localesDir || 'src/locales',
    include = config.include || ['src/**/*.{vue,js,ts}'],
    exclude = config.exclude || ['node_modules/**'],
    createBackup = true,
    dryRun = false
  } = options

  // Load language pack to get key mappings
  const zhPack = await loadLocale('zh-CN', { localesDir })

  if (Object.keys(zhPack).length === 0) {
    throw new Error('No language pack found. Please run extract and translate first.')
  }

  // Build reverse map (text -> key)
  const textToKeyMap: Record<string, string> = {}
  for (const [key, value] of Object.entries(zhPack)) {
    textToKeyMap[value as string] = key
  }

  // Scan files
  const fg = await import('fast-glob')
  const files = await fg.glob(include, { cwd: process.cwd(), ignore: exclude })

  let totalFiles = 0
  let totalReplacements = 0
  let totalBackups = 0

  for (const file of files) {
    const filePath = path.resolve(process.cwd(), file)

    try {
      const content = await fs.readFile(filePath, 'utf-8')
      let newContent = content
      let replacements = 0

      if (file.endsWith('.vue')) {
        const result = replaceVueFile(content, textToKeyMap)
        newContent = result.content
        replacements = result.replacements
      } else if (/\.(js|ts|jsx|tsx)$/.test(file)) {
        const result = replaceJSFile(content, textToKeyMap)
        newContent = result.content
        replacements = result.replacements
      }

      if (replacements > 0) {
        totalFiles++
        totalReplacements += replacements

        if (!dryRun) {
          // Create backup
          if (createBackup) {
            const backupPath = filePath + '.bak'
            await fs.writeFile(backupPath, content, 'utf-8')
            totalBackups++
          }

          // Write modified content
          await fs.writeFile(filePath, newContent, 'utf-8')
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.warn(`Warning: Failed to process ${file}:`, errorMessage)
    }
  }

  return {
    files: totalFiles,
    replacements: totalReplacements,
    backups: totalBackups,
    dryRun
  }
}

/**
 * Replace Chinese text in Vue file
 */
function replaceVueFile(
  content: string,
  textToKeyMap: Record<string, string>
): { content: string; replacements: number } {
  let replacements = 0

  try {
    const { descriptor } = parse(content)

    // Process template
    if (descriptor.template) {
      const template = descriptor.template.content
      const newTemplate = replaceInTemplate(template, textToKeyMap)
      if (newTemplate !== template) {
        content = content.replace(template, newTemplate)
        replacements += countReplacements(template, newTemplate)
      }
    }

    // Process script
    const scriptContent = descriptor.script?.content || descriptor.scriptSetup?.content || ''
    if (scriptContent) {
      const newScript = replaceInScript(scriptContent, textToKeyMap)
      if (newScript !== scriptContent) {
        content = content.replace(scriptContent, newScript)
        replacements += countReplacements(scriptContent, newScript)
      }
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.warn('Failed to parse Vue file:', errorMessage)
  }

  return { content, replacements }
}

/**
 * Replace Chinese text in JS/TS file
 */
function replaceJSFile(
  content: string,
  textToKeyMap: Record<string, string>
): { content: string; replacements: number } {
  const newContent = replaceInScript(content, textToKeyMap)
  const replacements = countReplacements(content, newContent)

  return { content: newContent, replacements }
}

/**
 * Replace in template section
 */
function replaceInTemplate(
  template: string,
  textToKeyMap: Record<string, string>
): string {
  let result = template

  for (const [text, key] of Object.entries(textToKeyMap)) {
    // Escape special regex characters
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

    // Replace in attributes: placeholder="用户名" -> :placeholder="$t('key')"
    const attrRegex = new RegExp(`([a-zA-Z-]+)=["']${escapedText}["']`, 'g')
    result = result.replace(attrRegex, (match, attrName) => {
      return `:${attrName}="$t('${key}')"`
    })

    // Replace in text content: >用户名< -> >{{ $t('key') }}<
    const textRegex = new RegExp(`>([^<{]*)${escapedText}([^<}]*)<`, 'g')
    result = result.replace(textRegex, (match, prefix, suffix) => {
      if (prefix.includes('{') || suffix.includes('}')) return match
      return `>{{ $t('${key}') }}<`
    })
  }

  return result
}

/**
 * Replace in script section using Babel AST
 */
function replaceInScript(
  script: string,
  textToKeyMap: Record<string, string>
): string {
  try {
    const ast = babelParse(script, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'decorators-legacy']
    })

    let modified = false

    traverse(ast, {
      StringLiteral(path: any) {
        const { node } = path
        if (node.value in textToKeyMap) {
          const key = textToKeyMap[node.value]
          // Replace string with t() call
          path.replaceWith({
            type: 'CallExpression',
            callee: {
              type: 'Identifier',
              name: 't'
            },
            arguments: [
              {
                type: 'StringLiteral',
                value: key
              }
            ]
          })
          modified = true
        }
      }
    })

    if (modified) {
      const output = generate(ast, {}, script)
      return output.code
    }
  } catch (error) {
    // Fallback to regex replacement
    console.warn('AST parsing failed, using regex fallback')
    return replaceInScriptRegex(script, textToKeyMap)
  }

  return script
}

/**
 * Regex fallback for script replacement
 */
function replaceInScriptRegex(
  script: string,
  textToKeyMap: Record<string, string>
): string {
  let result = script

  for (const [text, key] of Object.entries(textToKeyMap)) {
    const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`['"]${escapedText}['"]`, 'g')
    result = result.replace(regex, `t('${key}')`)
  }

  return result
}

/**
 * Count number of replacements made
 */
function countReplacements(original: string, modified: string): number {
  // Simple heuristic: count $t( or t( occurrences
  const originalCount = (original.match(/\$t\(|t\(/g) || []).length
  const modifiedCount = (modified.match(/\$t\(|t\(/g) || []).length
  return Math.max(0, modifiedCount - originalCount)
}
