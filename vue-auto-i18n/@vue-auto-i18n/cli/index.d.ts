import { Command } from 'commander';

/**
 * CLI Type Definitions
 */
interface CLIOptions {
    config?: string;
    output?: string;
    verbose?: boolean;
    include?: string[];
    exclude?: string[];
    languages?: string;
    service?: string;
    apiKey?: string;
    incremental?: boolean;
    force?: boolean;
    dryRun?: boolean;
    backup?: boolean;
}
interface CommandContext {
    options: CLIOptions;
    config: any;
    rootConfig: any;
}

/**
 * CLI Utility Functions
 */

/**
 * Load config with command-line overrides
 */
declare function loadConfigWithOverrides(options: CLIOptions): Promise<any>;
/**
 * Create translator instance based on config
 */
declare function createTranslator(config: any): Promise<any>;

/**
 * Extract Command
 * Extract Chinese text from source code
 */

declare const extractCommand: Command;

/**
 * Translate Command
 * Translate extracted texts and generate language packs
 */

declare const translateCommand: Command;

/**
 * Auto Command
 * Automatically extract and translate (one-click)
 */

declare const autoCommand: Command;

/**
 * Init Command
 * Initialize configuration file
 */

declare const initCommand: Command;

/**
 * Config Command
 * Display current configuration
 */

declare const configCommand: Command;

/**
 * Replace Command
 * Replace hardcoded Chinese text with $t() calls
 */

declare const replaceCommand: Command;

export { type CLIOptions, type CommandContext, autoCommand, configCommand, createTranslator, extractCommand, initCommand, loadConfigWithOverrides, replaceCommand, translateCommand };
