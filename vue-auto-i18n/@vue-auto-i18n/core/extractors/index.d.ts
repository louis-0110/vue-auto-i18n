import { ParserOptions } from '@babel/parser';

/**
 * Base Extractor Class
 * All extractors should extend this class
 */
interface ExtractionResult {
    text: string;
    line: number;
    column: number;
    type?: 'template' | 'script' | 'style';
    context?: string;
}
interface ExtractorOptions {
    include?: string[];
    exclude?: string[];
    useContext?: boolean;
    maxLength?: number;
    allowMixed?: boolean;
    allowPunctuation?: boolean;
}
declare abstract class BaseExtractor {
    protected options: ExtractorOptions;
    constructor(options?: ExtractorOptions);
    /**
     * Extract Chinese text from file content
     * @param filePath - Absolute path to the file
     * @param content - File content
     * @returns Array of extraction results
     */
    abstract extract(filePath: string, content: string): Promise<ExtractionResult[]> | ExtractionResult[];
    /**
     * Check if this extractor supports the given file
     * @param filePath - Absolute path to the file
     * @returns true if this extractor can handle the file
     */
    abstract supports(filePath: string): boolean;
    /**
     * Check if text contains Chinese characters
     * @param text - Text to check
     * @returns true if text contains Chinese
     */
    protected hasChinese(text: string): boolean;
    /**
     * Check if text should be extracted based on filtering rules
     * @param text - Text to check
     * @returns true if text should be extracted
     */
    protected shouldExtract(text: string): boolean;
    /**
     * Remove whitespace and normalize text
     * @param text - Text to normalize
     * @returns Normalized text
     */
    protected normalizeText(text: string): string;
}

/**
 * Vue Single File Component Extractor
 * Uses @vue/compiler-sfc to parse .vue files
 */

declare class VueExtractor extends BaseExtractor {
    constructor(options?: ExtractorOptions);
    supports(filePath: string): boolean;
    extract(filePath: string, content: string): Promise<ExtractionResult[]>;
    /**
     * Extract Chinese text from template AST
     */
    private extractFromTemplate;
    /**
     * Extract Chinese text from script content (using regex as fallback)
     */
    private extractFromScript;
}
declare function extractFromVueFile(filePath: string, content: string): ExtractionResult[];

/**
 * JS/TS/JSX/TSX File Extractor
 * Supports Babel Parser (with OXC planned for future)
 */

interface JSExtractorOptions extends ExtractorOptions {
    useBabel?: boolean;
    babelPlugins?: ParserOptions['plugins'];
}
declare class JSExtractor extends BaseExtractor {
    protected options: JSExtractorOptions;
    constructor(options?: JSExtractorOptions);
    supports(filePath: string): boolean;
    extract(filePath: string, content: string): Promise<ExtractionResult[]>;
    /**
     * Extract Chinese text using Babel AST traversal
     */
    private extractWithBabel;
    /**
     * Regex matching (fallback method)
     */
    private extractWithRegex;
}
declare function extractFromJSFile(filePath: string, content: string): ExtractionResult[];

/**
 * Extractors Module Entry Point
 */

declare function extractChineseFromProject(options?: any): Promise<any>;

export { BaseExtractor, type ExtractionResult, type ExtractorOptions, JSExtractor, type JSExtractorOptions, VueExtractor, extractChineseFromProject, extractFromJSFile, extractFromVueFile };
