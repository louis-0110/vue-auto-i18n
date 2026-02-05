var __typeError = (msg) => {
  throw TypeError(msg);
};
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);

// src/translators/base.ts
var BaseTranslator = class {
  constructor(options = {}) {
    this.options = {
      maxRetries: 3,
      timeout: 3e4,
      ...options
    };
  }
  /**
   * Check if language is supported
   * @param language - Language code to check
   * @returns true if language is supported
   */
  supportsLanguage(language) {
    return this.supportedLanguages.includes(language);
  }
  /**
   * Batch translate with error handling
   * @param texts - Array of texts to translate
   * @param from - Source language code
   * @param to - Target language code
   * @param batchSize - Number of texts to translate per batch
   * @returns Array of translation results with error handling
   */
  async batchTranslate(texts, from, to, batchSize = 10) {
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      try {
        const translated = await this.translate(batch, from, to);
        for (let j = 0; j < batch.length; j++) {
          results.push({
            original: batch[j],
            translated: translated[j] || batch[j]
            // Fallback to original if translation fails
          });
        }
      } catch (error) {
        for (const text of batch) {
          results.push({
            original: text,
            translated: text,
            error: error instanceof Error ? error.message : String(error)
          });
        }
      }
    }
    return results;
  }
  /**
   * Delay execution for specified milliseconds
   * @param ms - Milliseconds to delay
   */
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/translators/google-translator.ts
var GoogleTranslator = class extends BaseTranslator {
  constructor(options = {}) {
    super(options);
    this.supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", "ru-RU", "pt-BR", "it-IT"];
    this.baseUrl = "https://translation.googleapis.com/language/translate/v2";
    // Google Translate uses different language codes (zh instead of zh-CN)
    this.languageCodeMap = {
      "zh-CN": "zh",
      "en-US": "en",
      "ja-JP": "ja",
      "ko-KR": "ko",
      "fr-FR": "fr",
      "de-DE": "de",
      "es-ES": "es",
      "ru-RU": "ru",
      "pt-BR": "pt",
      "it-IT": "it",
      "zh-TW": "zh-TW",
      "ar": "ar",
      "hi": "hi",
      "th": "th",
      "vi": "vi"
    };
    this.options = {
      useFreeAPI: !options.apiKey,
      ...options
    };
  }
  validateConfig(options) {
    if (!options.useFreeAPI && !options.apiKey) {
      throw new Error("Google Translate requires API Key when not using free API");
    }
    return true;
  }
  async translate(texts, from, to) {
    if (texts.length === 0) {
      return [];
    }
    if (this.options.useFreeAPI) {
      return this.translateWithFreeAPI(texts, from, to);
    } else {
      return this.translateWithAPI(texts, from, to);
    }
  }
  /**
   * Convert locale code to Google language code
   */
  toGoogleLang(code) {
    return this.languageCodeMap[code] || code.split("-")[0];
  }
  /**
   * Use official API (requires payment) with batch optimization
   */
  async translateWithAPI(texts, from, to) {
    const googleFrom = this.toGoogleLang(from);
    const googleTo = this.toGoogleLang(to);
    const batchSize = 50;
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
      const response = await fetch(`${this.baseUrl}?key=${this.options.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: batch,
          source: googleFrom,
          target: googleTo,
          format: "text"
        })
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Google API error: ${response.status} ${response.statusText} - ${errorText}`);
      }
      const data = await response.json();
      if (data.error) {
        throw new Error(`Google API error: ${data.error.message || JSON.stringify(data.error)}`);
      }
      const translations = data.data?.translations || [];
      results.push(...translations.map((t) => t.translatedText));
    }
    return results;
  }
  /**
   * Use free Google Translate with concurrent batch optimization
   */
  async translateWithFreeAPI(texts, from, to) {
    const googleFrom = this.toGoogleLang(from);
    const googleTo = this.toGoogleLang(to);
    const concurrency = 5;
    const delayBetweenBatches = 50;
    const results = [];
    const errors = [];
    console.log(`  \u{1F680} \u4F7F\u7528\u5E76\u53D1\u6A21\u5F0F (\u5E76\u53D1\u6570: ${concurrency})`);
    for (let i = 0; i < texts.length; i += concurrency) {
      const batch = texts.slice(i, Math.min(i + concurrency, texts.length));
      const batchNumber = Math.floor(i / concurrency) + 1;
      const totalBatches = Math.ceil(texts.length / concurrency);
      console.log(`  [\u6279\u6B21 ${batchNumber}/${totalBatches}] \u6B63\u5728\u5E76\u53D1\u7FFB\u8BD1 ${batch.length} \u4E2A\u6587\u672C...`);
      const batchPromises = batch.map(
        (text, index) => this.translateSingleWithFreeAPI(text, googleFrom, googleTo).then((result) => ({ success: true, result, text })).catch((error) => ({
          success: false,
          result: text,
          // 失败时使用原文
          text,
          error: error instanceof Error ? error.message : String(error)
        }))
      );
      const batchResults = await Promise.all(batchPromises);
      for (const item of batchResults) {
        if (item.success) {
          results.push(item.result);
        } else {
          errors.push({ text: item.text, error: item.error });
          results.push(item.result);
        }
      }
      if (i + concurrency < texts.length) {
        await this.delay(delayBetweenBatches);
      }
    }
    if (errors.length > 0) {
      console.warn(`
\u26A0\uFE0F  ${errors.length} \u4E2A\u6587\u672C\u7FFB\u8BD1\u5931\u8D25\uFF0C\u5DF2\u4F7F\u7528\u539F\u6587`);
      errors.forEach(({ text, error }) => {
        console.warn(`  - "${text}": ${error}`);
      });
    }
    return results;
  }
  /**
   * Translate a single text using free API
   */
  async translateSingleWithFreeAPI(text, from, to) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;
    const response = await fetch(url, {
      signal: AbortSignal.timeout(1e4)
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    const translated = data[0]?.map((item) => item[0]).join("") || text;
    return translated;
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/translators/openai-translator.ts
var OpenAITranslator = class extends BaseTranslator {
  constructor(options) {
    super(options);
    this.supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", "ru-RU"];
    this.options = {
      model: "gpt-3.5-turbo",
      baseUrl: "https://api.openai.com/v1/chat/completions",
      ...options
    };
  }
  getBaseUrl() {
    return this.options.baseUrl || "https://api.openai.com/v1/chat/completions";
  }
  validateConfig(options) {
    if (!options.apiKey) {
      throw new Error("OpenAI requires API Key");
    }
    return true;
  }
  async translate(texts, from, to) {
    const batchSize = 10;
    const results = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      try {
        const prompt = this.buildPrompt(batch, from, to);
        const response = await fetch(this.getBaseUrl(), {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${this.options.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: this.options.model,
            messages: [
              {
                role: "system",
                content: "You are a professional translation assistant. Translate the provided text to the target language and return only the translation results without any explanation."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.3
          })
        });
        const data = await response.json();
        const translated = data.choices[0]?.message?.content || "";
        const translations = translated.split("\n").filter((t) => t.trim());
        results.push(...translations);
      } catch (error) {
        console.warn("OpenAI translation failed:", error);
        results.push(...batch);
      }
    }
    return results;
  }
  buildPrompt(texts, from, to) {
    const langNames = {
      "zh-CN": "Chinese",
      "en-US": "English",
      "ja-JP": "Japanese",
      "ko-KR": "Korean",
      "fr-FR": "French",
      "de-DE": "German",
      "es-ES": "Spanish",
      "ru-RU": "Russian"
    };
    const sourceLang = langNames[from] || from;
    const targetLang = langNames[to] || to;
    const textList = texts.map((text, i) => `${i + 1}. ${text}`).join("\n");
    return `Please translate the following ${sourceLang} texts into ${targetLang}, one translation result per line:

${textList}`;
  }
};

// src/translators/deepl-translator.ts
var DeepLTranslator = class extends BaseTranslator {
  constructor(options) {
    super(options);
    this.supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", "ru-RU"];
    this.options = {
      apiUrl: "https://api-free.deepl.com/v2/translate",
      ...options
    };
  }
  getApiUrl() {
    return this.options.apiUrl || "https://api-free.deepl.com/v2/translate";
  }
  validateConfig(options) {
    if (!options.apiKey) {
      throw new Error("DeepL requires API Key");
    }
    return true;
  }
  async translate(texts, from, to) {
    const results = [];
    const batchSize = 50;
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, i + batchSize);
      try {
        const response = await fetch(this.getApiUrl(), {
          method: "POST",
          headers: {
            "Authorization": `DeepL-Auth-Key ${this.options.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            text: batch,
            source_lang: from.toUpperCase().replace("-", "-"),
            target_lang: to.toUpperCase().replace("-", "-")
          })
        });
        const data = await response.json();
        const translations = data.translations.map((t) => t.text);
        results.push(...translations);
      } catch (error) {
        console.warn("DeepL translation failed:", error);
        results.push(...batch);
      }
    }
    return results;
  }
};

// src/translators/baidu-translator.ts
import { createHash } from "crypto";
var BaiduTranslator = class extends BaseTranslator {
  constructor(options) {
    super(options);
    this.supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", "ru-RU"];
    this.baseUrl = "https://fanyi-api.baidu.com/api/trans/vip/translate";
    this.options = options;
  }
  validateConfig(options) {
    if (!options.appId || !options.secret) {
      throw new Error("Baidu Translator requires appId and secret");
    }
    return true;
  }
  async translate(texts, from, to) {
    const results = [];
    for (const text of texts) {
      try {
        const salt = Date.now();
        const sign = this.generateSign(text, salt);
        const url = `${this.baseUrl}?q=${encodeURIComponent(text)}&from=${from}&to=${to}&appid=${this.options.appId}&salt=${salt}&sign=${sign}`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.trans_code === "200" || data.error_code === "52000") {
          results.push(data.trans_result?.[0]?.dst || text);
        } else {
          console.warn("Baidu translation failed:", data);
          results.push(text);
        }
      } catch (error) {
        console.warn("Baidu translation error:", error);
        results.push(text);
      }
    }
    return results;
  }
  generateSign(text, salt) {
    const str = this.options.appId + text + salt + this.options.secret;
    return createHash("md5").update(str).digest("hex");
  }
};

// src/translators/glm-translator.ts
var TranslationError = class extends Error {
  constructor(message, failures) {
    super(message);
    this.name = "TranslationError";
    this.failures = failures;
  }
};
var GLMTranslator = class extends BaseTranslator {
  constructor(options) {
    super(options);
    this.supportedLanguages = ["zh-CN", "en-US", "ja-JP", "ko-KR", "fr-FR", "de-DE", "es-ES", "ru-RU"];
    this.options = {
      model: "glm-4",
      baseUrl: "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      ...options
    };
  }
  validateConfig(options) {
    if (!options.apiKey) {
      throw new Error("GLM Translator requires API Key");
    }
    return true;
  }
  async translate(texts, from, to) {
    this.validateConfig(this.options);
    if (texts.length === 0) {
      return [];
    }
    const batchSize = 10;
    const results = [];
    const errors = [];
    for (let i = 0; i < texts.length; i += batchSize) {
      const batch = texts.slice(i, Math.min(i + batchSize, texts.length));
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(texts.length / batchSize);
      try {
        console.log(`  [\u6279\u6B21 ${batchNumber}/${totalBatches}] \u6B63\u5728\u7FFB\u8BD1 ${batch.length} \u4E2A\u6587\u672C...`);
        const translations = await this.translateBatch(batch, from, to);
        results.push(...translations);
      } catch (error) {
        console.log(`  [\u6279\u6B21 ${batchNumber}] \u6279\u91CF\u7FFB\u8BD1\u5931\u8D25\uFF0C\u964D\u7EA7\u4E3A\u9010\u4E2A\u7FFB\u8BD1...`);
        for (const text of batch) {
          try {
            const translation = await this.translateSingle(text, from, to);
            results.push(translation);
          } catch (singleError) {
            const errorMessage = singleError instanceof Error ? singleError.message : String(singleError);
            errors.push({ text, error: errorMessage });
            results.push(text);
          }
        }
      }
    }
    if (errors.length > 0) {
      const error = new TranslationError("Some texts failed to translate", errors);
      throw error;
    }
    return results;
  }
  async translateBatch(texts, from, to) {
    const items = texts.map((text, index) => `${index + 1}. ${text}`).join("\n");
    const prompt = `\u8BF7\u5C06\u4EE5\u4E0B${this.getLanguageName(from)}\u7FFB\u8BD1\u6210${this.getLanguageName(to)}\uFF0C\u4E3A\u6BCF\u4E00\u884C\u63D0\u4F9B\u5BF9\u5E94\u7684\u7FFB\u8BD1\u7ED3\u679C\u3002\u4E25\u683C\u6309\u7167\u4EE5\u4E0B JSON \u683C\u5F0F\u8FD4\u56DE\uFF0C\u4E0D\u8981\u6709\u4EFB\u4F55\u5176\u4ED6\u5185\u5BB9\uFF1A
{
  "translations": ["\u7FFB\u8BD11", "\u7FFB\u8BD12", "\u7FFB\u8BD13", ...]
}

\u5F85\u7FFB\u8BD1\u6587\u672C\uFF1A
${items}`;
    const response = await fetch(this.options.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.7,
        stream: false
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(`GLM API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    const content = data.choices?.[0]?.message?.content || "";
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      const result = JSON.parse(jsonMatch[0]);
      const translations = result.translations || [];
      if (translations.length !== texts.length) {
        throw new Error(`Expected ${texts.length} translations, got ${translations.length}`);
      }
      return translations;
    } catch (error) {
      throw new Error(`Failed to parse batch translation response: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  async translateSingle(text, from, to) {
    const prompt = `\u8BF7\u5C06\u4EE5\u4E0B${this.getLanguageName(from)}\u7FFB\u8BD1\u6210${this.getLanguageName(to)}\uFF0C\u53EA\u8FD4\u56DE\u7FFB\u8BD1\u7ED3\u679C\uFF0C\u4E0D\u8981\u6709\u4EFB\u4F55\u89E3\u91CA\u3002

${text}`;
    const response = await fetch(this.options.baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.options.apiKey}`
      },
      body: JSON.stringify({
        model: this.options.model,
        messages: [
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.3,
        top_p: 0.7,
        stream: false
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`GLM API error: ${response.status} ${response.statusText} - ${errorText}`);
    }
    const data = await response.json();
    if (data.error) {
      throw new Error(`GLM API error: ${data.error.message || JSON.stringify(data.error)}`);
    }
    const content = data.choices?.[0]?.message?.content || text;
    return content.trim();
  }
  getLanguageName(code) {
    const names = {
      "zh-CN": "\u4E2D\u6587",
      "en-US": "\u82F1\u6587",
      "ja-JP": "\u65E5\u6587",
      "ko-KR": "\u97E9\u6587"
    };
    return names[code] || code;
  }
  delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
};

// src/translators/index.ts
function createTranslatorFromConfig(config) {
  const { translateService, translator } = config;
  switch (translateService) {
    case "google": {
      const googleConfig = translator?.google || { useFreeAPI: true };
      return new GoogleTranslator({
        apiKey: googleConfig.apiKey || "",
        useFreeAPI: googleConfig.useFreeAPI ?? true
      });
    }
    case "openai": {
      const openaiConfig = translator?.openai || {};
      return new OpenAITranslator({
        apiKey: openaiConfig.apiKey || "",
        model: openaiConfig.model,
        baseUrl: openaiConfig.baseUrl
      });
    }
    case "glm": {
      const glmConfig = translator?.glm || {};
      return new GLMTranslator({
        apiKey: glmConfig.apiKey || "",
        model: glmConfig.model,
        baseUrl: glmConfig.baseUrl
      });
    }
    case "deepl": {
      const deeplConfig = translator?.deepl || {};
      return new DeepLTranslator({
        apiKey: deeplConfig.apiKey || "",
        apiUrl: deeplConfig.apiUrl
      });
    }
    case "baidu": {
      const baiduConfig = translator?.baidu || {};
      return new BaiduTranslator({
        appId: baiduConfig.appId || "",
        secret: baiduConfig.secret || ""
      });
    }
    default:
      throw new Error(`Unsupported translation service: ${translateService}`);
  }
}
var _translators;
var TranslatorRegistry = class {
  constructor() {
    __privateAdd(this, _translators, /* @__PURE__ */ new Map());
  }
  register(name, TranslatorClass) {
    __privateGet(this, _translators).set(name, TranslatorClass);
  }
  create(name, config) {
    const Class = __privateGet(this, _translators).get(name);
    if (!Class) {
      throw new Error(`Translator "${name}" not found in registry`);
    }
    return new Class(config);
  }
  list() {
    return Array.from(__privateGet(this, _translators).keys());
  }
};
_translators = new WeakMap();
var defaultRegistry = new TranslatorRegistry();
defaultRegistry.register("google", GoogleTranslator);
defaultRegistry.register("openai", OpenAITranslator);
defaultRegistry.register("glm", GLMTranslator);
defaultRegistry.register("deepl", DeepLTranslator);
defaultRegistry.register("baidu", BaiduTranslator);
export {
  BaiduTranslator,
  BaseTranslator,
  DeepLTranslator,
  GLMTranslator,
  GoogleTranslator,
  OpenAITranslator,
  TranslatorRegistry,
  createTranslatorFromConfig,
  defaultRegistry
};
//# sourceMappingURL=index.js.map