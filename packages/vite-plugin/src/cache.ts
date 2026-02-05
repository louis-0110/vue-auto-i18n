/**
 * Cache Manager for Incremental Builds
 */

import { promises as fs } from 'fs'
import { createHash } from 'crypto'
import path from 'path'

export interface CacheEntry {
  code: string
  timestamp: number
}

export interface CacheManager {
  get(id: string, code: string): { code: string; map: null } | null
  set(id: string, originalCode: string, result: { code: string; map: null }): void
  clear(): Promise<void>
}

/**
 * Create cache manager
 */
export function createCacheManager(cacheDir: string): CacheManager {
  const cachePath = path.join(process.cwd(), cacheDir, 'vite-plugin-cache.json')
  let cache: Map<string, CacheEntry> = new Map()

  // Load cache from disk
  async function loadCache() {
    try {
      const content = await fs.readFile(cachePath, 'utf-8')
      const data = JSON.parse(content)
      cache = new Map(Object.entries(data))
    } catch {
      // Cache file doesn't exist or is invalid
      cache = new Map()
    }
  }

  // Save cache to disk
  async function saveCache() {
    try {
      const data = Object.fromEntries(cache)
      await fs.mkdir(path.dirname(cachePath), { recursive: true })
      await fs.writeFile(cachePath, JSON.stringify(data), 'utf-8')
    } catch (error) {
      console.warn('Failed to save cache:', error)
    }
  }

  // Initialize cache
  loadCache()

  return {
    get(id: string, code: string): { code: string; map: null } | null {
      const hash = createHash('md5').update(code).digest('hex')
      const key = `${id}:${hash}`
      const entry = cache.get(key)

      if (entry) {
        return {
          code: entry.code,
          map: null
        }
      }

      return null
    },

    set(id: string, originalCode: string, result: { code: string; map: null }): void {
      const hash = createHash('md5').update(originalCode).digest('hex')
      const key = `${id}:${hash}`
      const entry: CacheEntry = {
        code: result.code,
        timestamp: Date.now()
      }
      cache.set(key, entry)
      saveCache()
    },

    async clear(): Promise<void> {
      cache.clear()
      try {
        await fs.unlink(cachePath)
      } catch {
        // File doesn't exist
      }
    }
  }
}
