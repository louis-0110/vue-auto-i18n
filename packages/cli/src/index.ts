/**
 * @vue-auto-i18n/cli
 * Main entry point for CLI functionality
 */

export { loadConfigWithOverrides, createTranslator } from './utils.js'
export type { CLIOptions, CommandContext } from './types.js'
export { extractCommand, translateCommand, autoCommand, initCommand, configCommand, replaceCommand } from './commands/index.js'
