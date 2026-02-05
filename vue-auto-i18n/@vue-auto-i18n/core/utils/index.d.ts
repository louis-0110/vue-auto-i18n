/**
 * Utility Functions
 */
/**
 * Ensure directory exists
 */
declare function ensureDir(dir: string): Promise<void>;
/**
 * Save extracted text to cache file
 */
declare function saveExtractedText(result: any, config?: any): Promise<string>;
/**
 * Load extracted text from cache
 */
declare function loadExtractedText(config?: any): Promise<any>;
/**
 * Save locale file
 */
declare function saveLocale(lang: string, data: any, config?: any): Promise<string>;
/**
 * Load locale file
 */
declare function loadLocale(lang: string, config?: any): Promise<any>;
/**
 * Generate unique key for text
 */
declare function generateKey(text: string, index: number): string;
/**
 * Check if string contains Chinese characters
 */
declare function hasChinese(text: string): boolean;
/**
 * Normalize whitespace in text
 */
declare function normalizeText(text: string): string;
/**
 * Read file with encoding
 */
declare function readFile(filePath: string, encoding?: BufferEncoding): Promise<string>;
/**
 * Write file with encoding
 */
declare function writeFile(filePath: string, content: string, encoding?: BufferEncoding): Promise<void>;
/**
 * Check if file exists
 */
declare function fileExists(filePath: string): Promise<boolean>;

export { ensureDir, fileExists, generateKey, hasChinese, loadExtractedText, loadLocale, normalizeText, readFile, saveExtractedText, saveLocale, writeFile };
