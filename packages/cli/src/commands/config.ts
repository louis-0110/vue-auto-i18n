/**
 * Config Command
 * Display current configuration
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { loadConfigWithOverrides } from '../utils.js'

export const configCommand = new Command('config')
  .description('Display current configuration')
  .action(async () => {
    const spinner = ora('Loading configuration...').start()

    try {
      const config = await loadConfigWithOverrides(configCommand.opts())

      spinner.succeed(chalk.green('Configuration loaded'))

      console.log(chalk.cyan('\n📋 Current Configuration:\n'))
      console.log(chalk.gray('Include patterns:'))
      config.include?.forEach((pattern: string) => {
        console.log(chalk.gray(`  - ${pattern}`))
      })
      console.log(chalk.gray('\nExclude patterns:'))
      config.exclude?.forEach((pattern: string) => {
        console.log(chalk.gray(`  - ${pattern}`))
      })
      console.log(chalk.gray(`\nLanguage pack directory: ${config.localesDir}`))
      console.log(chalk.gray(`Cache directory: ${config.cacheDir}`))
      console.log(chalk.gray(`Target languages: ${config.targetLanguages?.join(', ')}`))
      console.log(chalk.gray(`Translation service: ${config.translateService}`))
      console.log(chalk.gray(`Incremental: ${config.incremental ? 'Yes' : 'No'}`))
      console.log(chalk.gray(`Verbose: ${config.verbose ? 'Yes' : 'No'}`))

      // Show translator configuration
      if (config.translator) {
        console.log(chalk.cyan('\n🔑 Translator Configuration:'))
        const serviceConfig = config.translator[config.translateService]
        if (serviceConfig) {
          console.log(chalk.gray(`  Service: ${config.translateService}`))
          if (serviceConfig.apiKey) {
            const maskedKey = serviceConfig.apiKey.substring(0, 8) + '...'
            console.log(chalk.gray(`  API Key: ${maskedKey}`))
          } else if (config.translateService === 'google') {
            console.log(chalk.gray(`  API Key: (using free API)`))
          } else {
            console.log(chalk.red(`  API Key: (not configured)`))
          }
          if (serviceConfig.model) {
            console.log(chalk.gray(`  Model: ${serviceConfig.model}`))
          }
        }
      }

      // Validate config
      let isValid = true
      const errors: string[] = []

      // 检查统一配置中的 API key
      const needsApiKey = ['openai', 'deepl', 'baidu', 'glm'].includes(config.translateService)
      if (needsApiKey) {
        const serviceConfig = config.translator?.[config.translateService]
        const hasApiKey = serviceConfig?.apiKey
        if (!hasApiKey) {
          isValid = false
          errors.push('API key is required')
        }
      }

      if (!isValid) {
        console.log(chalk.red('\n⚠️  Configuration validation failed:'))
        errors.forEach(error => console.log(chalk.red(`   - ${error}`)))
      } else {
        console.log(chalk.green('\n✅ Configuration validation passed'))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      spinner.fail(chalk.red('Failed to load configuration: ' + errorMessage))
      process.exit(1)
    }
  })
