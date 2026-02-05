/**
 * Extract Command
 * Extract Chinese text from source code
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { extractChineseFromProject, saveExtractedText } from '@vue-auto-i18n/core'
import { loadConfigWithOverrides } from '../utils.js'

export const extractCommand = new Command('extract')
  .description('Extract Chinese text from source code')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-o, --output <dir>', 'Cache output directory')
  .action(async (options) => {
    const spinner = ora('Loading config...').start()
    let config: any = {}

    try {
      // Load config with command-line overrides
      config = await loadConfigWithOverrides(extractCommand.opts())

      // Apply command-line options
      if (options.include) config.include = options.include
      if (options.exclude) config.exclude = options.exclude
      if (options.output) config.cacheDir = options.output

      spinner.text = 'Extracting text...'

      const result = await extractChineseFromProject({
        include: config.include,
        exclude: config.exclude,
        maxLength: config.extractMaxLength,
        allowMixed: config.extractAllowMixed,
        allowPunctuation: config.extractAllowPunctuation
      })

      await saveExtractedText(result, config)

      spinner.succeed(chalk.green(`Extraction complete! Found ${result.uniqueTexts.length} unique texts`))
      console.log(chalk.gray(`Cache file: ${config.cacheDir}/extracted.json`))

      if (config.verbose) {
        console.log(chalk.cyan('\n📊 Detailed statistics:'))
        console.log(chalk.gray(`  - Files scanned: ${result.fileCount}`))
        console.log(chalk.gray(`  - Total occurrences: ${result.totalOccurrences}`))
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      spinner.fail(chalk.red('Extraction failed: ' + errorMessage))
      if (config?.verbose) console.error(error)
      process.exit(1)
    }
  })
