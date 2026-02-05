// src/utils.ts
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { loadConfig } from "@vue-auto-i18n/core";
function loadEnvFile() {
  const envPath = join(process.cwd(), ".env");
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, "utf-8");
    content.split("\n").forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const [key, ...valueParts] = trimmed.split("=");
        const value = valueParts.join("=").trim();
        if (key && value) {
          process.env[key] = value;
        }
      }
    });
  }
}
async function loadConfigWithOverrides(options) {
  loadEnvFile();
  const overrides = {};
  if (options.output) {
    overrides.localesDir = options.output;
  }
  if (options.verbose) {
    overrides.verbose = true;
  }
  if (options.config) {
    process.env.CONFIG_PATH = options.config;
  }
  const config = await loadConfig(overrides);
  return config;
}
async function createTranslator(config) {
  const { createTranslatorFromConfig } = await import("@vue-auto-i18n/core");
  return createTranslatorFromConfig(config);
}

// src/commands/extract.ts
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { extractChineseFromProject, saveExtractedText } from "@vue-auto-i18n/core";
var extractCommand = new Command("extract").description("Extract Chinese text from source code").option("-i, --include <patterns...>", "File patterns to include").option("-e, --exclude <patterns...>", "File patterns to exclude").option("-o, --output <dir>", "Cache output directory").action(async (options) => {
  const spinner = ora("Loading config...").start();
  let config = {};
  try {
    config = await loadConfigWithOverrides(extractCommand.opts());
    if (options.include) config.include = options.include;
    if (options.exclude) config.exclude = options.exclude;
    if (options.output) config.cacheDir = options.output;
    spinner.text = "Extracting text...";
    const result = await extractChineseFromProject({
      include: config.include,
      exclude: config.exclude,
      maxLength: config.extractMaxLength,
      allowMixed: config.extractAllowMixed,
      allowPunctuation: config.extractAllowPunctuation
    });
    await saveExtractedText(result, config);
    spinner.succeed(chalk.green(`Extraction complete! Found ${result.uniqueTexts.length} unique texts`));
    console.log(chalk.gray(`Cache file: ${config.cacheDir}/extracted.json`));
    if (config.verbose) {
      console.log(chalk.cyan("\n\u{1F4CA} Detailed statistics:"));
      console.log(chalk.gray(`  - Files scanned: ${result.fileCount}`));
      console.log(chalk.gray(`  - Total occurrences: ${result.totalOccurrences}`));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(chalk.red("Extraction failed: " + errorMessage));
    if (config?.verbose) console.error(error);
    process.exit(1);
  }
});

// src/commands/translate.ts
import { Command as Command2 } from "commander";
import chalk2 from "chalk";
import ora2 from "ora";
import { promises as fs } from "fs";
import { join as join2 } from "path";
import { loadLocale, saveLocale, generateKey } from "@vue-auto-i18n/core";
var translateCommand = new Command2("translate").description("Translate extracted texts and generate language packs").option("-l, --languages <langs>", "Target languages (comma-separated)").option("-s, --service <service>", "Translation service (google|deepl|openai|baidu|glm)").option("-k, --api-key <key>", "API key").option("-o, --output <dir>", "Language pack output directory").option("--no-incremental", "Disable incremental translation (translate all texts)").action(async (options) => {
  const spinner = ora2("Loading config...").start();
  let config = {};
  try {
    config = await loadConfigWithOverrides(translateCommand.opts());
    if (options.languages) {
      config.targetLanguages = options.languages.split(",").map((l) => l.trim());
    }
    if (options.service) config.translateService = options.service;
    if (options.apiKey) config.apiKey = options.apiKey;
    if (options.output) config.localesDir = options.output;
    if (options.incremental === false) config.incremental = false;
    const needsApiKey = ["openai", "deepl", "baidu", "glm"].includes(config.translateService);
    if (needsApiKey) {
      const serviceConfig = config.translator?.[config.translateService];
      const hasApiKey = serviceConfig?.apiKey;
      if (!hasApiKey) {
        spinner.fail(chalk2.red("API key required"));
        console.log(chalk2.gray("\nHint: Set API key in .env or use --api-key option"));
        process.exit(1);
      }
    }
    const cachePath = join2(config.cacheDir, "extracted.json");
    try {
      await fs.access(cachePath);
    } catch {
      spinner.fail(chalk2.red("Please run extract command first"));
      console.log(chalk2.gray("\nHint: Run vue-auto-i18n extract to extract texts first"));
      process.exit(1);
    }
    const content = await fs.readFile(cachePath, "utf-8");
    const { uniqueTexts } = JSON.parse(content);
    spinner.text = "Generating language packs...";
    const existingZh = await loadLocale("zh-CN", config) || {};
    const zhPackage = {};
    const newTexts = [];
    uniqueTexts.forEach((item, index) => {
      const key = generateKey(item.text, index);
      if (config.incremental && existingZh[key]) {
        zhPackage[key] = existingZh[key];
      } else {
        zhPackage[key] = item.text;
        newTexts.push({ key, text: item.text });
      }
    });
    await fs.mkdir(config.localesDir, { recursive: true });
    await saveLocale("zh-CN", zhPackage, config);
    if (newTexts.length === 0) {
      spinner.succeed(chalk2.green("Language pack is up to date"));
      console.log(chalk2.gray(`Language pack directory: ${config.localesDir}/`));
      return;
    }
    const translator = await createTranslator(config);
    const translationErrors = [];
    for (const lang of config.targetLanguages) {
      spinner.text = `Translating to ${lang}...`;
      const existingLang = await loadLocale(lang, config) || {};
      const langPackage = { ...existingLang };
      const textsToTranslate = newTexts.map((item) => item.text);
      try {
        const translations = await translator.translate(textsToTranslate, "zh-CN", lang);
        newTexts.forEach((item, index) => {
          langPackage[item.key] = translations[index];
        });
        await saveLocale(lang, langPackage, config);
      } catch (error) {
        if (error.name === "TranslationError") {
          translationErrors.push(...error.failures);
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          textsToTranslate.forEach((text) => {
            translationErrors.push({ text, error: errorMessage });
          });
        }
        newTexts.forEach((item) => {
          langPackage[item.key] = item.text;
        });
        await saveLocale(lang, langPackage, config);
      }
    }
    spinner.succeed(chalk2.green(`Translation complete! ${newTexts.length} new texts`));
    console.log(chalk2.gray(`Language pack directory: ${config.localesDir}/`));
    console.log(chalk2.cyan(`
Generated language packs:`));
    console.log(chalk2.gray(`  - ${config.localesDir}/zh-CN.json`));
    config.targetLanguages.forEach((lang) => {
      console.log(chalk2.gray(`  - ${config.localesDir}/${lang}.json`));
    });
    if (translationErrors.length > 0) {
      console.log(chalk2.yellow(`
\u26A0\uFE0F  Warning: ${translationErrors.length} text(s) failed to translate`));
      console.log(chalk2.gray("The following texts were not translated and kept their original value:"));
      const uniqueErrors = /* @__PURE__ */ new Map();
      translationErrors.forEach(({ text, error }) => {
        if (!uniqueErrors.has(text)) {
          uniqueErrors.set(text, error);
        }
      });
      uniqueErrors.forEach((error, text) => {
        console.log(chalk2.red(`  - "${text}"`));
        console.log(chalk2.gray(`    Error: ${error}`));
      });
      console.log(chalk2.cyan("\n\u{1F4A1} Tips:"));
      console.log(chalk2.gray("  1. Check your API key is valid"));
      console.log(chalk2.gray("  2. Check your network connection"));
      console.log(chalk2.gray("  3. Check your API service quota/balance"));
      console.log(chalk2.gray("  4. Try translating again later"));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(chalk2.red("Translation failed: " + errorMessage));
    if (config?.verbose) console.error(error);
    process.exit(1);
  }
});

// src/commands/auto.ts
import { Command as Command3 } from "commander";
import chalk3 from "chalk";
import ora3 from "ora";
import { promises as fs2 } from "fs";
import { extractChineseFromProject as extractChineseFromProject2, saveExtractedText as saveExtractedText2, loadLocale as loadLocale2, saveLocale as saveLocale2, generateKey as generateKey2 } from "@vue-auto-i18n/core";
var autoCommand = new Command3("auto").description("Automatically extract and translate (one-click)").option("-i, --include <patterns...>", "File patterns to include").option("-e, --exclude <patterns...>", "File patterns to exclude").option("-l, --languages <langs>", "Target languages (comma-separated)").option("-s, --service <service>", "Translation service").option("-k, --api-key <key>", "API key").option("-o, --output <dir>", "Language pack output directory").option("--no-incremental", "Disable incremental translation").action(async (options) => {
  console.log(chalk3.bold.blue("\n\u{1F680} Vue Auto I18n - Automatic Internationalization\n"));
  const configSpinner = ora3("Loading config...").start();
  let config = {};
  try {
    config = await loadConfigWithOverrides(autoCommand.opts());
    if (options.include) config.include = options.include;
    if (options.exclude) config.exclude = options.exclude;
    if (options.languages) {
      config.targetLanguages = options.languages.split(",").map((l) => l.trim());
    }
    if (options.service) config.translateService = options.service;
    if (options.apiKey) config.apiKey = options.apiKey;
    if (options.output) config.localesDir = options.output;
    if (options.incremental === false) config.incremental = false;
    const needsApiKey = ["openai", "deepl", "baidu", "glm"].includes(config.translateService);
    if (needsApiKey) {
      const serviceConfig = config.translator?.[config.translateService];
      const hasApiKey = serviceConfig?.apiKey;
      if (!hasApiKey) {
        configSpinner.fail(chalk3.red("API key required"));
        console.log(chalk3.gray("\nHint: Set API key in .env or use --api-key option"));
        process.exit(1);
      }
    }
    if (config.verbose) {
    }
    configSpinner.succeed(chalk3.green("Config loaded"));
    const extractSpinner = ora3("Step 1/2: Extracting texts...").start();
    const extractResult = await extractChineseFromProject2({
      include: config.include,
      exclude: config.exclude
    });
    await saveExtractedText2(extractResult, config);
    extractSpinner.succeed(chalk3.green(`Extraction complete! Found ${extractResult.uniqueTexts.length} texts`));
    if (extractResult.uniqueTexts.length === 0) {
      console.log(chalk3.yellow("\n\u2728 No texts to translate"));
      return;
    }
    const translateSpinner = ora3("Step 2/2: Generating language packs...").start();
    const existingZh = await loadLocale2("zh-CN", config) || {};
    const zhPackage = {};
    const newTexts = [];
    extractResult.uniqueTexts.forEach((item, index) => {
      const key = generateKey2(item.text, index);
      if (config.incremental && existingZh[key]) {
        zhPackage[key] = existingZh[key];
      } else {
        zhPackage[key] = item.text;
        newTexts.push({ key, text: item.text });
      }
    });
    await fs2.mkdir(config.localesDir, { recursive: true });
    await saveLocale2("zh-CN", zhPackage, config);
    if (newTexts.length === 0) {
      translateSpinner.succeed(chalk3.green("Language pack is up to date"));
      console.log(chalk3.green("\n\u2705 Automatic internationalization complete!\n"));
      console.log(chalk3.cyan(`\u{1F4C1} Language pack directory: ${config.localesDir}/`));
      return;
    }
    const translator = await createTranslator(config);
    const translationErrors = [];
    for (const lang of config.targetLanguages) {
      translateSpinner.text = `Translating to ${lang}...`;
      const existingLang = await loadLocale2(lang, config) || {};
      const langPackage = { ...existingLang };
      const textsToTranslate = newTexts.map((item) => item.text);
      try {
        const translations = await translator.translate(textsToTranslate, "zh-CN", lang);
        newTexts.forEach((item, index) => {
          langPackage[item.key] = translations[index];
        });
        await saveLocale2(lang, langPackage, config);
      } catch (error) {
        if (error.name === "TranslationError") {
          translationErrors.push(...error.failures);
        } else {
          const errorMessage = error instanceof Error ? error.message : String(error);
          textsToTranslate.forEach((text) => {
            translationErrors.push({ text, error: errorMessage });
          });
        }
        newTexts.forEach((item) => {
          langPackage[item.key] = item.text;
        });
        await saveLocale2(lang, langPackage, config);
      }
    }
    translateSpinner.succeed(chalk3.green(`Translation complete! ${newTexts.length} new texts`));
    console.log(chalk3.bold.green("\n\u2705 Automatic internationalization complete!\n"));
    console.log(chalk3.cyan("\u{1F4C1} Generated files:"));
    console.log(chalk3.gray(`  - ${config.localesDir}/zh-CN.json`));
    config.targetLanguages.forEach((lang) => {
      console.log(chalk3.gray(`  - ${config.localesDir}/${lang}.json`));
    });
    console.log(chalk3.cyan("\n\u{1F4CA} Statistics:"));
    console.log(chalk3.gray(`  - Total texts: ${extractResult.uniqueTexts.length}`));
    console.log(chalk3.gray(`  - New texts: ${newTexts.length}`));
    console.log(chalk3.gray(`  - Target languages: ${config.targetLanguages.length}`));
    if (translationErrors.length > 0) {
      console.log(chalk3.yellow(`
\u26A0\uFE0F  Warning: ${translationErrors.length} text(s) failed to translate`));
      console.log(chalk3.gray("The following texts were not translated and kept their original value:"));
      const uniqueErrors = /* @__PURE__ */ new Map();
      translationErrors.forEach(({ text, error }) => {
        if (!uniqueErrors.has(text)) {
          uniqueErrors.set(text, error);
        }
      });
      uniqueErrors.forEach((error, text) => {
        console.log(chalk3.red(`  - "${text}"`));
        console.log(chalk3.gray(`    Error: ${error}`));
      });
      console.log(chalk3.cyan("\n\u{1F4A1} Tips:"));
      console.log(chalk3.gray("  1. Check your API key is valid"));
      console.log(chalk3.gray("  2. Check your network connection"));
      console.log(chalk3.gray("  3. Check your API service quota/balance"));
      console.log(chalk3.gray("  4. Try translating again later"));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(chalk3.red("\n\u274C Error: "), errorMessage);
    if (config?.verbose) console.error(error);
    process.exit(1);
  }
});

// src/commands/init.ts
import { Command as Command4 } from "commander";
import chalk4 from "chalk";
import ora4 from "ora";
import { promises as fs3 } from "fs";
import { join as join3 } from "path";
var initCommand = new Command4("init").description("Initialize configuration file").option("-f, --force", "Overwrite existing configuration file").action(async (options) => {
  const spinner = ora4("Creating configuration file...").start();
  try {
    const configPath = "i18n.config.js";
    const envPath = ".env";
    if (!options.force) {
      try {
        await fs3.access(configPath);
        spinner.fail(chalk4.red("Configuration file already exists"));
        console.log(chalk4.gray(`
${configPath} already exists`));
        console.log(chalk4.gray("Use --force option to overwrite"));
        process.exit(1);
      } catch {
      }
    }
    const exampleConfigPath = join3(process.cwd(), "i18n.config.example.js");
    let exampleConfig = `// Vue Auto I18n Configuration
export default {
  // ========== \u6587\u4EF6\u626B\u63CF\u914D\u7F6E ==========
  include: ['src/**/*.{vue,js,ts,jsx,tsx}'],
  exclude: ['node_modules/**'],

  // ========== \u7FFB\u8BD1\u914D\u7F6E ==========
  targetLanguages: ['en-US', 'ja-JP'],

  // \u7FFB\u8BD1\u670D\u52A1\u9009\u62E9: google | deepl | openai | baidu | glm
  translateService: 'google',

  // ========== \u7EDF\u4E00\u7684\u7FFB\u8BD1\u5668\u914D\u7F6E\uFF08\u63A8\u8350\u4F7F\u7528\uFF09 ==========
  translator: {
    // Google Translate\uFF08\u514D\u8D39 API\uFF09
    google: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.I18N_API_KEY || "",
      useFreeAPI: true,  // \u4F7F\u7528\u514D\u8D39 API\uFF08\u65E0\u9700 key\uFF09
    },

    // OpenAI (GPT)
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      temperature: 0.3,
      maxTokens: 1000,
    },

    // GLM (\u667A\u8C31AI)
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

  // ========== \u8F93\u51FA\u914D\u7F6E ==========
  output: {
    dir: 'src/locales',
    useContext: false,
    generateTypes: false,
  },

  // ========== \u7F13\u5B58\u914D\u7F6E ==========
  cache: {
    dir: '.i18n-cache',
    enabled: true,
  },

  // ========== \u5176\u4ED6\u914D\u7F6E ==========
  incremental: true,
  verbose: false
}
`;
    try {
      await fs3.access(exampleConfigPath);
      exampleConfig = await fs3.readFile(exampleConfigPath, "utf-8");
    } catch {
    }
    await fs3.writeFile(configPath, exampleConfig, "utf-8");
    try {
      await fs3.access(envPath);
    } catch {
      const exampleEnv = `# Translation API Keys
# Configure the API keys for your chosen translation service

# Google Translate API Key (optional - can use free API without key)
# GOOGLE_API_KEY=your_google_api_key

# OpenAI API Key (if using OpenAI/GPT)
# OPENAI_API_KEY=your_openai_key_here
# OPENAI_MODEL=gpt-3.5-turbo
# OPENAI_BASE_URL=https://api.openai.com/v1/chat/completions

# GLM API Key (\u667A\u8C31AI)
# GLM_API_KEY=your_glm_api_key_here
# GLM_MODEL=glm-4
# GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions

# DeepL API Key (if using DeepL)
# DEEPL_API_KEY=your_deepl_key_here

# Baidu App ID and Secret (if using Baidu)
# BAIDU_APP_ID=your_app_id
# BAIDU_SECRET=your_secret
`;
      await fs3.writeFile(envPath, exampleEnv, "utf-8");
    }
    spinner.succeed(chalk4.green("Configuration file created successfully"));
    console.log(chalk4.cyan("\n\u{1F4C1} Created files:"));
    console.log(chalk4.gray(`  - ${configPath}`));
    try {
      await fs3.access(envPath);
      console.log(chalk4.gray(`  - ${envPath}`));
    } catch {
    }
    console.log(chalk4.cyan("\n\u{1F4A1} Next steps:"));
    console.log(chalk4.gray("  1. Edit i18n.config.js to configure your project"));
    console.log(chalk4.gray("  2. Configure API key in .env if needed"));
    console.log(chalk4.gray("  3. Run vue-auto-i18n auto to start extraction and translation"));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(chalk4.red("Creation failed: " + errorMessage));
    process.exit(1);
  }
});

// src/commands/config.ts
import { Command as Command5 } from "commander";
import chalk5 from "chalk";
import ora5 from "ora";
var configCommand = new Command5("config").description("Display current configuration").action(async () => {
  const spinner = ora5("Loading configuration...").start();
  try {
    const config = await loadConfigWithOverrides(configCommand.opts());
    spinner.succeed(chalk5.green("Configuration loaded"));
    console.log(chalk5.cyan("\n\u{1F4CB} Current Configuration:\n"));
    console.log(chalk5.gray("Include patterns:"));
    config.include?.forEach((pattern) => {
      console.log(chalk5.gray(`  - ${pattern}`));
    });
    console.log(chalk5.gray("\nExclude patterns:"));
    config.exclude?.forEach((pattern) => {
      console.log(chalk5.gray(`  - ${pattern}`));
    });
    console.log(chalk5.gray(`
Language pack directory: ${config.localesDir}`));
    console.log(chalk5.gray(`Cache directory: ${config.cacheDir}`));
    console.log(chalk5.gray(`Target languages: ${config.targetLanguages?.join(", ")}`));
    console.log(chalk5.gray(`Translation service: ${config.translateService}`));
    console.log(chalk5.gray(`Incremental: ${config.incremental ? "Yes" : "No"}`));
    console.log(chalk5.gray(`Verbose: ${config.verbose ? "Yes" : "No"}`));
    if (config.translator) {
      console.log(chalk5.cyan("\n\u{1F511} Translator Configuration:"));
      const serviceConfig = config.translator[config.translateService];
      if (serviceConfig) {
        console.log(chalk5.gray(`  Service: ${config.translateService}`));
        if (serviceConfig.apiKey) {
          const maskedKey = serviceConfig.apiKey.substring(0, 8) + "...";
          console.log(chalk5.gray(`  API Key: ${maskedKey}`));
        } else if (config.translateService === "google") {
          console.log(chalk5.gray(`  API Key: (using free API)`));
        } else {
          console.log(chalk5.red(`  API Key: (not configured)`));
        }
        if (serviceConfig.model) {
          console.log(chalk5.gray(`  Model: ${serviceConfig.model}`));
        }
      }
    }
    let isValid = true;
    const errors = [];
    const needsApiKey = ["openai", "deepl", "baidu", "glm"].includes(config.translateService);
    if (needsApiKey) {
      const serviceConfig = config.translator?.[config.translateService];
      const hasApiKey = serviceConfig?.apiKey;
      if (!hasApiKey) {
        isValid = false;
        errors.push("API key is required");
      }
    }
    if (!isValid) {
      console.log(chalk5.red("\n\u26A0\uFE0F  Configuration validation failed:"));
      errors.forEach((error) => console.log(chalk5.red(`   - ${error}`)));
    } else {
      console.log(chalk5.green("\n\u2705 Configuration validation passed"));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(chalk5.red("Failed to load configuration: " + errorMessage));
    process.exit(1);
  }
});

// src/commands/replace.ts
import { Command as Command6 } from "commander";
import chalk6 from "chalk";
import ora6 from "ora";
var replaceCommand = new Command6("replace").description("Replace hardcoded Chinese text with $t() calls").option("--no-backup", "Do not create backup files").option("--dry-run", "Preview replacements without modifying files").action(async (options) => {
  console.log(chalk6.bold.yellow("\n\u26A0\uFE0F  Code Replacement Tool\n"));
  console.log(chalk6.red("This tool will modify your source code, replacing hardcoded Chinese with $t() calls"));
  console.log(chalk6.gray("Recommendations:"));
  console.log(chalk6.gray("  1. Ensure code is committed to Git"));
  console.log(chalk6.gray("  2. Try on a test branch first"));
  console.log(chalk6.gray("  3. Carefully review code after replacement\n"));
  if (!options.dryRun) {
    const readline = await import("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    const confirmed = await new Promise((resolve) => {
      rl.question(chalk6.yellow("Are you sure you want to continue? (y/n): "), (answer) => {
        rl.close();
        resolve(/^y|yes|是$/i.test(answer));
      });
    });
    if (!confirmed) {
      console.log(chalk6.gray("\nOperation cancelled"));
      return;
    }
  }
  const spinner = ora6("Loading configuration and extracted texts...").start();
  let config = {};
  try {
    config = await loadConfigWithOverrides(replaceCommand.opts());
    const { replaceFiles } = await import("@vue-auto-i18n/replacer");
    const result = await replaceFiles(config, {
      createBackup: options.backup !== false && !options.dryRun,
      dryRun: options.dryRun
    });
    spinner.succeed(chalk6.green("Replacement complete"));
    console.log(chalk6.bold.green("\n\u2705 Replacement complete!"));
    console.log(chalk6.gray(`  - Modified files: ${result.files}`));
    console.log(chalk6.gray(`  - Replacements: ${result.replacements}`));
    if (result.dryRun) {
      console.log(chalk6.yellow("\n\u26A0\uFE0F  This is preview mode, files were not actually modified"));
      console.log(chalk6.gray("Run without --dry-run to perform actual replacement"));
    }
    if (result.backups > 0) {
      console.log(chalk6.cyan(`
\u{1F4C1} Created ${result.backups} backup files`));
      console.log(chalk6.yellow("\n\u{1F4A1} Delete backup files after confirming everything is correct"));
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    spinner.fail(chalk6.red("Replacement failed: " + errorMessage));
    if (config?.verbose) console.error(error);
    process.exit(1);
  }
});
export {
  autoCommand,
  configCommand,
  createTranslator,
  extractCommand,
  initCommand,
  loadConfigWithOverrides,
  replaceCommand,
  translateCommand
};
//# sourceMappingURL=index.js.map