/**
 * Init Command
 * Initialize configuration file
 */

import { Command } from 'commander'
import chalk from 'chalk'
import ora from 'ora'
import { promises as fs } from 'fs'
import { join } from 'path'

export const initCommand = new Command('init')
  .description('Initialize configuration file')
  .option('-f, --force', 'Overwrite existing configuration file')
  .action(async (options) => {
    const spinner = ora('Creating configuration file...').start()

    try {
      const configPath = 'i18n.config.js'
      const envPath = '.env'

      // Check if already exists
      if (!options.force) {
        try {
          await fs.access(configPath)
          spinner.fail(chalk.red('Configuration file already exists'))
          console.log(chalk.gray(`\n${configPath} already exists`))
          console.log(chalk.gray('Use --force option to overwrite'))
          process.exit(1)
        } catch {
          // File doesn't exist, continue
        }
      }

      // Check if example config exists
      const exampleConfigPath = join(process.cwd(), 'i18n.config.example.js')
      let exampleConfig = `// Vue Auto I18n Configuration
export default {
  // ========== 文件扫描配置 ==========
  include: ['src/**/*.{vue,js,ts,jsx,tsx}'],
  exclude: ['node_modules/**'],

  // ========== 翻译配置 ==========
  targetLanguages: ['en-US', 'ja-JP'],

  // 翻译服务选择: google | deepl | openai | baidu | glm
  translateService: 'google',

  // ========== 统一的翻译器配置（推荐使用） ==========
  translator: {
    // Google Translate（免费 API）
    google: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.I18N_API_KEY || "",
      useFreeAPI: true,  // 使用免费 API（无需 key）
    },

    // OpenAI (GPT)
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      temperature: 0.3,
      maxTokens: 1000,
    },

    // GLM (智谱AI)
    glm: {
      apiKey: process.env.GLM_API_KEY || "",
      model: process.env.GLM_MODEL || "glm-4",
      baseUrl: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      temperature: 0.3,
      top_p: 0.7,
    },

    // DeepL
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || "",
    },

    // Baidu
    baidu: {
      appId: process.env.BAIDU_APP_ID || "",
      secret: process.env.BAIDU_SECRET || "",
    },
  },

  // ========== 输出配置 ==========
  output: {
    dir: 'src/locales',
    useContext: false,
    generateTypes: false,
  },

  // ========== 缓存配置 ==========
  cache: {
    dir: '.i18n-cache',
    enabled: true,
  },

  // ========== 其他配置 ==========
  incremental: true,
  verbose: false
}
`

      try {
        await fs.access(exampleConfigPath)
        exampleConfig = await fs.readFile(exampleConfigPath, 'utf-8')
      } catch {
        // Example doesn't exist, use default
      }

      await fs.writeFile(configPath, exampleConfig, 'utf-8')

      // Create .env file
      try {
        await fs.access(envPath)
      } catch {
        const exampleEnv = `# Translation API Keys
# Configure the API keys for your chosen translation service

# Google Translate API Key (optional - can use free API without key)
# GOOGLE_API_KEY=your_google_api_key

# OpenAI API Key (if using OpenAI/GPT)
# OPENAI_API_KEY=your_openai_key_here
# OPENAI_MODEL=gpt-3.5-turbo
# OPENAI_BASE_URL=https://api.openai.com/v1/chat/completions

# GLM API Key (智谱AI)
# GLM_API_KEY=your_glm_api_key_here
# GLM_MODEL=glm-4
# GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions

# DeepL API Key (if using DeepL)
# DEEPL_API_KEY=your_deepl_key_here

# Baidu App ID and Secret (if using Baidu)
# BAIDU_APP_ID=your_app_id
# BAIDU_SECRET=your_secret
`
        await fs.writeFile(envPath, exampleEnv, 'utf-8')
      }

      spinner.succeed(chalk.green('Configuration file created successfully'))
      console.log(chalk.cyan('\n📁 Created files:'))
      console.log(chalk.gray(`  - ${configPath}`))
      try {
        await fs.access(envPath)
        console.log(chalk.gray(`  - ${envPath}`))
      } catch {
        // .env already existed
      }
      console.log(chalk.cyan('\n💡 Next steps:'))
      console.log(chalk.gray('  1. Edit i18n.config.js to configure your project'))
      console.log(chalk.gray('  2. Configure API key in .env if needed'))
      console.log(chalk.gray('  3. Run vue-auto-i18n auto to start extraction and translation'))

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      spinner.fail(chalk.red('Creation failed: ' + errorMessage))
      process.exit(1)
    }
  })
