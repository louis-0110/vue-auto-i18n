/**
 * 国际化配置文件
 * 测试项目配置 - 使用 GLM 翻译器
 */

export default {
  // ========== 文件扫描配置 ==========
  include: ["src/**/*.{vue,js,ts}"],
  exclude: ["node_modules/**", "dist/**"],

  // ========== 翻译配置 ==========
  targetLanguages: ["en-US", "ja-JP"],
  translateService: "glm",  // GLM 翻译器（推荐，稳定可用）

  // ========== 翻译器配置 ==========
  translator: {
    glm: {
      apiKey: process.env.GLM_API_KEY || "",
      model: "glm-4.5-air",
      baseUrl: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      temperature: 0.3,
      top_p: 0.7,
    }
  },

  // ========== 输出和缓存配置 ==========
  localesDir: "src/locales",
  cacheDir: ".i18n-cache",

  // ========== 其他配置 ==========
  incremental: true,
  verbose: false
}

