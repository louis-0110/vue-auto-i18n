/**
 * Configuration Loader
 * Loads and merges configuration from i18n.config.js and environment variables
 */
interface I18nConfig {
    include: string[];
    exclude: string[];
    localesDir: string;
    cacheDir: string;
    translateService: 'google' | 'deepl' | 'openai' | 'baidu' | 'glm';
    targetLanguages: string[];
    incremental: boolean;
    translator: {
        google?: {
            apiKey?: string;
            useFreeAPI?: boolean;
        };
        openai?: {
            apiKey?: string;
            model?: string;
            baseUrl?: string;
            temperature?: number;
            maxTokens?: number;
        };
        glm?: {
            apiKey?: string;
            model?: string;
            baseUrl?: string;
            temperature?: number;
            top_p?: number;
        };
        deepl?: {
            apiKey?: string;
            apiUrl?: string;
        };
        baidu?: {
            appId?: string;
            secret?: string;
        };
    };
    extractMaxLength?: number;
    extractAllowMixed?: boolean;
    extractAllowPunctuation?: boolean;
    verbose: boolean;
}
/**
 * Load config from i18n.config.js
 */
declare function loadConfig(overrides?: Partial<I18nConfig>): Promise<I18nConfig>;

/**
 * Base Translator Class
 * All translators should extend this class
 */
interface TranslationResult {
    original: string;
    translated: string;
    error?: string;
}
interface TranslatorOptions {
    apiKey?: string;
    apiUrl?: string;
    maxRetries?: number;
    timeout?: number;
}
declare abstract class BaseTranslator {
    protected options: TranslatorOptions;
    protected abstract supportedLanguages: string[];
    constructor(options?: TranslatorOptions);
    /**
     * Translate texts from source language to target language
     * @param texts - Array of texts to translate
     * @param from - Source language code (e.g., 'zh-CN')
     * @param to - Target language code (e.g., 'en-US')
     * @returns Array of translation results
     */
    abstract translate(texts: string[], from: string, to: string): Promise<string[]>;
    /**
     * Validate translator configuration
     * @param options - Options to validate
     * @returns true if configuration is valid
     * @throws Error if configuration is invalid
     */
    abstract validateConfig(options: TranslatorOptions): boolean;
    /**
     * Check if language is supported
     * @param language - Language code to check
     * @returns true if language is supported
     */
    supportsLanguage(language: string): boolean;
    /**
     * Batch translate with error handling
     * @param texts - Array of texts to translate
     * @param from - Source language code
     * @param to - Target language code
     * @param batchSize - Number of texts to translate per batch
     * @returns Array of translation results with error handling
     */
    batchTranslate(texts: string[], from: string, to: string, batchSize?: number): Promise<TranslationResult[]>;
    /**
     * Delay execution for specified milliseconds
     * @param ms - Milliseconds to delay
     */
    protected delay(ms: number): Promise<void>;
}

/**
 * Google Translate Translator
 * Uses both official API and free API
 */

interface GoogleTranslatorOptions extends TranslatorOptions {
    apiKey?: string;
    useFreeAPI?: boolean;
}
declare class GoogleTranslator extends BaseTranslator {
    protected supportedLanguages: string[];
    protected options: GoogleTranslatorOptions;
    private baseUrl;
    private languageCodeMap;
    constructor(options?: GoogleTranslatorOptions);
    validateConfig(options: GoogleTranslatorOptions): boolean;
    translate(texts: string[], from: string, to: string): Promise<string[]>;
    /**
     * Convert locale code to Google language code
     */
    private toGoogleLang;
    /**
     * Use official API (requires payment) with batch optimization
     */
    private translateWithAPI;
    /**
     * Use free Google Translate with concurrent batch optimization
     */
    private translateWithFreeAPI;
    /**
     * Translate a single text using free API
     */
    private translateSingleWithFreeAPI;
    protected delay(ms: number): Promise<void>;
}

/**
 * OpenAI Translator
 * Uses GPT models for translation, best contextual understanding
 */

interface OpenAITranslatorOptions extends TranslatorOptions {
    apiKey: string;
    model?: string;
    baseUrl?: string;
}
declare class OpenAITranslator extends BaseTranslator {
    protected supportedLanguages: string[];
    protected options: OpenAITranslatorOptions;
    constructor(options: OpenAITranslatorOptions);
    private getBaseUrl;
    validateConfig(options: OpenAITranslatorOptions): boolean;
    translate(texts: string[], from: string, to: string): Promise<string[]>;
    private buildPrompt;
}

/**
 * DeepL Translator
 * Best translation quality, but requires payment
 */

interface DeepLTranslatorOptions extends TranslatorOptions {
    apiKey: string;
    apiUrl?: string;
}
declare class DeepLTranslator extends BaseTranslator {
    protected supportedLanguages: string[];
    protected options: DeepLTranslatorOptions;
    constructor(options: DeepLTranslatorOptions);
    private getApiUrl;
    validateConfig(options: DeepLTranslatorOptions): boolean;
    translate(texts: string[], from: string, to: string): Promise<string[]>;
}

/**
 * Baidu Translator
 * Large free tier
 */

interface BaiduTranslatorOptions extends TranslatorOptions {
    appId: string;
    secret: string;
}
declare class BaiduTranslator extends BaseTranslator {
    protected supportedLanguages: string[];
    protected options: BaiduTranslatorOptions;
    private baseUrl;
    constructor(options: BaiduTranslatorOptions);
    validateConfig(options: BaiduTranslatorOptions): boolean;
    translate(texts: string[], from: string, to: string): Promise<string[]>;
    private generateSign;
}

/**
 * GLM (智谱AI) Translator
 * 使用 GLM-4 等模型进行翻译
 */

interface GLMTranslatorOptions extends TranslatorOptions {
    apiKey: string;
    model?: string;
    baseUrl?: string;
}
declare class GLMTranslator extends BaseTranslator {
    protected supportedLanguages: string[];
    protected options: GLMTranslatorOptions;
    constructor(options: GLMTranslatorOptions);
    validateConfig(options: GLMTranslatorOptions): boolean;
    translate(texts: string[], from: string, to: string): Promise<string[]>;
    private translateBatch;
    private translateSingle;
    private getLanguageName;
    protected delay(ms: number): Promise<void>;
}

/**
 * Translators Module Entry Point
 */

/**
 * 根据配置创建翻译器实例（使用统一配置）
 * @param config - I18nConfig 配置对象
 * @returns 翻译器实例
 */
declare function createTranslatorFromConfig(config: I18nConfig): BaseTranslator;
/**
 * Translator Registry
 * Allows registering and creating translator instances
 */
declare class TranslatorRegistry {
    #private;
    register(name: string, TranslatorClass: any): void;
    create(name: string, config: any): any;
    list(): string[];
}
declare const defaultRegistry: TranslatorRegistry;

export { BaiduTranslator as B, DeepLTranslator as D, GLMTranslator as G, type I18nConfig as I, OpenAITranslator as O, type TranslationResult as T, type BaiduTranslatorOptions as a, BaseTranslator as b, type DeepLTranslatorOptions as c, type GLMTranslatorOptions as d, GoogleTranslator as e, type GoogleTranslatorOptions as f, type OpenAITranslatorOptions as g, type TranslatorOptions as h, TranslatorRegistry as i, createTranslatorFromConfig as j, defaultRegistry as k, loadConfig as l };
