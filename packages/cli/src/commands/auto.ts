/**
 * Auto Command
 * Automatically extract and translate (one-click)
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { promises as fs } from 'fs'
import { extractChineseFromProject, saveExtractedText, loadLocale, saveLocale, generateKey } from '@vue-auto-i18n/core'
import { loadConfigWithOverrides, createTranslator } from '../utils.js'

export const autoCommand = new Command('auto')
  .description('Automatically extract and translate (one-click)')
  .option('-i, --include <patterns...>', 'File patterns to include')
  .option('-e, --exclude <patterns...>', 'File patterns to exclude')
  .option('-l, --languages <langs>', 'Target languages (comma-separated)')
  .option('-s, --service <service>', 'Translation service')
  .option('-k, --api-key <key>', 'API key')
  .option('-o, --output <dir>', 'Language pack output directory')
  .option('--no-incremental', 'Disable incremental translation')
  .action(async (options) => {
    console.log(chalk.bold.blue('\n🚀 Vue Auto I18n - Automatic Internationalization\n'))

    const configSpinner = ora('Loading config...').start()
    let config: any = {}

    try {
      // Load config
      config = await loadConfigWithOverrides(autoCommand.opts())

      // Apply command-line options
      if (options.include) config.include = options.include
      if (options.exclude) config.exclude = options.exclude
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
          configSpinner.fail(chalk.red('API key required'))
          console.log(chalk.gray('\nHint: Set API key in .env or use --api-key option'))
          process.exit(1)
        }
      }

      if (config.verbose) {
        // Print config info
      }

      configSpinner.succeed(chalk.green('Config loaded'))

      // Step 1: Extract
      const extractSpinner = ora('Step 1/2: Extracting texts...').start()
      const extractResult = await extractChineseFromProject({
        include: config.include,
        exclude: config.exclude
      })

      await saveExtractedText(extractResult, config)
      extractSpinner.succeed(chalk.green(`Extraction complete! Found ${extractResult.uniqueTexts.length} texts`))

      if (extractResult.uniqueTexts.length === 0) {
        console.log(chalk.yellow('\n✨ No texts to translate'))
        return
      }

      // Step 2: Generate language packs
      const translateSpinner = ora('Step 2/2: Generating language packs...').start()

      // Read existing language pack
      const existingZh: Record<string, string> = await loadLocale('zh-CN', config) || {}
      const zhPackage: Record<string, string> = {}
      const newTexts: Array<{ key: string; text: string }> = []

      extractResult.uniqueTexts.forEach((item: any, index: number) => {
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
        translateSpinner.succeed(chalk.green('Language pack is up to date'))
        console.log(chalk.green('\n✅ Automatic internationalization complete!\n'))
        console.log(chalk.cyan(`📁 Language pack directory: ${config.localesDir}/`))
        return
      }

      // Translate new texts
      const translator = await createTranslator(config)
      const translationErrors: Array<{ text: string; error: string }> = []

      for (const lang of config.targetLanguages) {
        translateSpinner.text = `Translating to ${lang}...`

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

      translateSpinner.succeed(chalk.green(`Translation complete! ${newTexts.length} new texts`))

      console.log(chalk.bold.green('\n✅ Automatic internationalization complete!\n'))
      console.log(chalk.cyan('📁 Generated files:'))
      console.log(chalk.gray(`  - ${config.localesDir}/zh-CN.json`))
      config.targetLanguages.forEach((lang: string) => {
        console.log(chalk.gray(`  - ${config.localesDir}/${lang}.json`))
      })
      console.log(chalk.cyan('\n📊 Statistics:'))
      console.log(chalk.gray(`  - Total texts: ${extractResult.uniqueTexts.length}`))
      console.log(chalk.gray(`  - New texts: ${newTexts.length}`))
      console.log(chalk.gray(`  - Target languages: ${config.targetLanguages.length}`))

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
      console.error(chalk.red('\n❌ Error: '), errorMessage)
      if (config?.verbose) console.error(error)
      process.exit(1)
    }
  })
