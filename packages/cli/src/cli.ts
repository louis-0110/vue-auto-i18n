/**
 * Vue Auto I18n CLI
 * Command-line tool for automatic internationalization
 */

import { Command } from 'commander'
import { extractCommand } from './commands/extract.js'
import { translateCommand } from './commands/translate.js'
import { autoCommand } from './commands/auto.js'
import { initCommand } from './commands/init.js'
import { configCommand } from './commands/config.js'
import { replaceCommand } from './commands/replace.js'
import { loadPackageJSON } from './utils.js'
import { config } from 'dotenv' // 加载 .env 文件

// 加载 .env 文件（如果存在）
config()

const program = new Command()

// Load package info
const pkg = loadPackageJSON()

program
  .name('vue-auto-i18n')
  .description(pkg.description || 'Vue 3 Automatic Internationalization Tool')
  .version(pkg.version || '2.0.0')
  .option('-c, --config <path>', 'Configuration file path')
  .option('-o, --output <dir>', 'Language pack output directory')
  .option('-v, --verbose', 'Show verbose logs')

// Register all commands
program.addCommand(extractCommand)
program.addCommand(translateCommand)
program.addCommand(autoCommand)
program.addCommand(initCommand)
program.addCommand(configCommand)
program.addCommand(replaceCommand)

// Parse command-line arguments
program.parse()
