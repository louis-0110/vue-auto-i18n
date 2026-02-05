/**
 * Translate Command
 * Translate extracted texts and generate language packs
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { promises as fs } from 'fs'
import { join } from 'path'
import { loadLocale, saveLocale, generateKey } from '@vue-auto-i18n/core'
import { loadConfigWithOverrides, createTranslator } from '../utils.js'

export const translateCommand = new Command('translate')
  .description('Translate extracted texts and generate language packs')
  .option('-l, --languages <langs>', 'Target languages (comma-separated)')
  .option('-s, --service <service>', 'Translation service (google|deepl|openai|baidu|glm)')
  .option('-k, --api-key <key>', 'API key')
  .option('-o, --output <dir>', 'Language pack output directory')
  .option('--no-incremental', 'Disable incremental translation (translate all texts)')
  .action(async (options) => {
    const spinner = ora('Loading config...').start()
    let config: any = {}

    try {
      // Load config
      config = await loadConfigWithOverrides(translateCommand.opts())

      // Apply command-line options
      if (options.languages) {
        config.targetLanguages = options.languages.split(',').map((l: string) => l.trim())
      }
      if (options.service) config.translateService = options.service
      if (options.apiKey) config.apiKey = options.apiKey
      if (options.output) config.localesDir = options.output
      if (options.incremental === false) config.incremental = false

      // Validate config - Google translator can use free API without key
      const needsApiKey = ['openai', 'deepl', 'baidu', 'glm'].includes(config.translateService)
      if (needsApiKey) {
        // 检查统一配置中的 API key
        const serviceConfig = config.translator?.[config.translateService]
        const hasApiKey = serviceConfig?.apiKey
        if (!hasApiKey) {
          spinner.fail(chalk.red('API key required'))
          console.log(chalk.gray('\nHint: Set API key in .env or use --api-key option'))
          process.exit(1)
        }
      }

      // Read extracted texts
      const cachePath = join(config.cacheDir, 'extracted.json')
      try {
        await fs.access(cachePath)
      } catch {
        spinner.fail(chalk.red('Please run extract command first'))
        console.log(chalk.gray('\nHint: Run vue-auto-i18n extract to extract texts first'))
        process.exit(1)
      }

      const content = await fs.readFile(cachePath, 'utf-8')
      const { uniqueTexts } = JSON.parse(content)

      spinner.text = 'Generating language packs...'

      // Read existing language pack (incremental translation)
      const existingZh: Record<string, string> = await loadLocale('zh-CN', config) || {}
      const zhPackage: Record<string, string> = {}
      const newTexts: Array<{ key: string; text: string }> = []

      uniqueTexts.forEach((item: any, index: number) => {
        const key = generateKey(item.text, index)
        if (config.incremental && existingZh[key]) {
          zhPackage[key] = existingZh[key]
        } else {
          zhPackage[key] = item.text
          newTexts.push({ key, text: item.text })
        }
      })

      // Ensure output directory exists
      await fs.mkdir(config.localesDir, { recursive: true })

      // Save Chinese language pack
      await saveLocale('zh-CN', zhPackage, config)

      if (newTexts.length === 0) {
        spinner.succeed(chalk.green('Language pack is up to date'))
        console.log(chalk.gray(`Language pack directory: ${config.localesDir}/`))
        return
      }

      // Translate new texts
      const translator = await createTranslator(config)
      const translationErrors: Array<{ text: string; error: string }> = []

      for (const lang of config.targetLanguages) {
        spinner.text = `Translating to ${lang}...`

        // Read existing language pack
        const existingLang: Record<string, string> = await loadLocale(lang, config) || {}
        const langPackage: Record<string, string> = { ...existingLang }

        const textsToTranslate = newTexts.map(item => item.text)

        try {
          const translations = await translator.translate(textsToTranslate, 'zh-CN', lang)

          newTexts.forEach((item, index) => {
            langPackage[item.key] = translations[index]
          })

          await saveLocale(lang, langPackage, config)
        } catch (error: any) {
          // 记录翻译失败的文本
          if (error.name === 'TranslationError') {
            translationErrors.push(...error.failures)
          } else {
            const errorMessage = error instanceof Error ? error.message : String(error)
            textsToTranslate.forEach(text => {
              translationErrors.push({ text, error: errorMessage })
            })
          }

          // 翻译失败时，使用原文作为翻译结果
          newTexts.forEach(item => {
            langPackage[item.key] = item.text
          })

          await saveLocale(lang, langPackage, config)
        }
      }

      spinner.succeed(chalk.green(`Translation complete! ${newTexts.length} new texts`))
      console.log(chalk.gray(`Language pack directory: ${config.localesDir}/`))
      console.log(chalk.cyan(`\nGenerated language packs:`))
      console.log(chalk.gray(`  - ${config.localesDir}/zh-CN.json`))
      config.targetLanguages.forEach((lang: string) => {
        console.log(chalk.gray(`  - ${config.localesDir}/${lang}.json`))
      })

      // 显示翻译错误提示
      if (translationErrors.length > 0) {
        console.log(chalk.yellow(`\n⚠️  Warning: ${translationErrors.length} text(s) failed to translate`))
        console.log(chalk.gray('The following texts were not translated and kept their original value:'))

        // 去重显示错误
        const uniqueErrors = new Map<string, string>()
        translationErrors.forEach(({ text, error }) => {
          if (!uniqueErrors.has(text)) {
            uniqueErrors.set(text, error)
          }
        })

        uniqueErrors.forEach((error, text) => {
          console.log(chalk.red(`  - "${text}"`))
          console.log(chalk.gray(`    Error: ${error}`))
        })

        console.log(chalk.cyan('\n💡 Tips:'))
        console.log(chalk.gray('  1. Check your API key is valid'))
        console.log(chalk.gray('  2. Check your network connection'))
        console.log(chalk.gray('  3. Check your API service quota/balance'))
        console.log(chalk.gray('  4. Try translating again later'))
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      spinner.fail(chalk.red('Translation failed: ' + errorMessage))
      if (config?.verbose) console.error(error)
      process.exit(1)
    }
  })
