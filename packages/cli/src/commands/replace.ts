/**
 * Replace Command
 * Replace hardcoded Chinese text with $t() calls
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { promises as fs } from 'fs'
import { loadConfigWithOverrides } from '../utils.js'

export const replaceCommand = new Command('replace')
  .description('Replace hardcoded Chinese text with $t() calls')
  .option('--no-backup', 'Do not create backup files')
  .option('--dry-run', 'Preview replacements without modifying files')
  .action(async (options) => {
    console.log(chalk.bold.yellow('\n⚠️  Code Replacement Tool\n'))
    console.log(chalk.red('This tool will modify your source code, replacing hardcoded Chinese with $t() calls'))
    console.log(chalk.gray('Recommendations:'))
    console.log(chalk.gray('  1. Ensure code is committed to Git'))
    console.log(chalk.gray('  2. Try on a test branch first'))
    console.log(chalk.gray('  3. Carefully review code after replacement\n'))

    if (!options.dryRun) {
      const readline = await import('readline')
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      const confirmed = await new Promise<boolean>(resolve => {
        rl.question(chalk.yellow('Are you sure you want to continue? (y/n): '), (answer) => {
          rl.close()
          resolve(/^y|yes|是$/i.test(answer))
        })
      })

      if (!confirmed) {
        console.log(chalk.gray('\nOperation cancelled'))
        return
      }
    }

    const spinner = ora('Loading configuration and extracted texts...').start()
    let config: any = {}

    try {
      // Load config
      config = await loadConfigWithOverrides(replaceCommand.opts())

      // Import replace functionality from replacer package
      const { replaceFiles } = await import('@vue-auto-i18n/replacer')

      const result = await replaceFiles(config, {
        createBackup: options.backup !== false && !options.dryRun,
        dryRun: options.dryRun
      })

      spinner.succeed(chalk.green('Replacement complete'))

      console.log(chalk.bold.green('\n✅ Replacement complete!'))
      console.log(chalk.gray(`  - Modified files: ${result.files}`))
      console.log(chalk.gray(`  - Replacements: ${result.replacements}`))

      if (result.dryRun) {
        console.log(chalk.yellow('\n⚠️  This is preview mode, files were not actually modified'))
        console.log(chalk.gray('Run without --dry-run to perform actual replacement'))
      }

      if (result.backups > 0) {
        console.log(chalk.cyan(`\n📁 Created ${result.backups} backup files`))
        console.log(chalk.yellow('\n💡 Delete backup files after confirming everything is correct'))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      spinner.fail(chalk.red('Replacement failed: ' + errorMessage))
      if (config?.verbose) console.error(error)
      process.exit(1)
    }
  })
