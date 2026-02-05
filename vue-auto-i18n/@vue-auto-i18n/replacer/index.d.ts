/**
 * @vue-auto-i18n/replacer
 * Code replacement tool for transforming Chinese text to $t() calls
 */
interface ReplacerOptions {
    localesDir?: string;
    include?: string[];
    exclude?: string[];
    createBackup?: boolean;
    dryRun?: boolean;
}
interface ReplacerResult {
    files: number;
    replacements: number;
    backups: number;
    dryRun: boolean;
}
/**
 * Replace files with $t() calls
 */
declare function replaceFiles(config: any, options?: ReplacerOptions): Promise<ReplacerResult>;

export { type ReplacerOptions, type ReplacerResult, replaceFiles };
