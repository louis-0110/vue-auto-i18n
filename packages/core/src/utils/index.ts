/**
 * Utility Functions
 */

import { promises as fs } from 'fs'
import path from 'path'

/**
 * Ensure directory exists
 */
export async function ensureDir(dir: string): Promise<void> {
  try {
    await fs.access(dir)
  } catch {
    await fs.mkdir(dir, { recursive: true })
  }
}

/**
 * Save extracted text to cache file
 */
export async function saveExtractedText(result: any, config: any = {}): Promise<string> {
  const cacheDir = config.cacheDir || '.i18n-cache'
  await ensureDir(cacheDir)

  const filePath = path.join(cacheDir, 'extracted.json')
  await fs.writeFile(filePath, JSON.stringify(result, null, 2), 'utf-8')

  return filePath
}

/**
 * Load extracted text from cache
 */
export async function loadExtractedText(config: any = {}): Promise<any> {
  const cacheDir = config.cacheDir || '.i18n-cache'
  const filePath = path.join(cacheDir, 'extracted.json')

  try {
    await fs.access(filePath)
  } catch {
    throw new Error('Please run extract command first to extract text')
  }

  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Save locale file
 */
export async function saveLocale(lang: string, data: any, config: any = {}): Promise<string> {
  const dir = config.localesDir || 'src/locales'
  await ensureDir(dir)

  const filePath = path.join(dir, `${lang}.json`)
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')

  return filePath
}

/**
 * Load locale file
 */
export async function loadLocale(lang: string, config: any = {}): Promise<any> {
  const localesDir = config.localesDir || 'src/locales'
  const filePath = path.join(localesDir, `${lang}.json`)

  try {
    await fs.access(filePath)
  } catch {
    return {}
  }

  const content = await fs.readFile(filePath, 'utf-8')
  return JSON.parse(content)
}

/**
 * Generate unique key for text
 */
export function generateKey(text: string, index: number): string {
  // If text is short and doesn't contain special characters, use text as key
  if (text.length <= 20 && /^[\u4e00-\u9fa5a-zA-Z0-9]+$/.test(text)) {
    return text
  }

  // Otherwise use auto-generated key
  return `text_${index}`
}

/**
 * Check if string contains Chinese characters
 */
export function hasChinese(text: string): boolean {
  return /[\u4e00-\u9fa5]/.test(text)
}

/**
 * Normalize whitespace in text
 */
export function normalizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ')
}

/**
 * Read file with encoding
 */
export async function readFile(filePath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
  return await fs.readFile(filePath, encoding)
}

/**
 * Write file with encoding
 */
export async function writeFile(filePath: string, content: string, encoding: BufferEncoding = 'utf-8'): Promise<void> {
  await ensureDir(path.dirname(filePath))
  await fs.writeFile(filePath, content, encoding)
}

/**
 * Check if file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}
