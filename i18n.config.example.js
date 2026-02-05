/**
 * 国际化配置文件
 * 复制此文件为 i18n.config.js 并根据需要修改
 */

export default {
  // ========== 文件扫描配置 ==========
  include: ["src/**/*.{vue,js,ts,jsx,tsx}", "packages/**/*.{vue,js,ts}"],

  exclude: [
    "node_modules/**",
    "dist/**",
    "build/**",
    "**/*.spec.js",
    "**/*.test.js",
    "**/*.min.js",
  ],

  // ========== 翻译配置 ==========
  targetLanguages: ["en-US", "ja-JP", "ko-KR"],

  // 翻译服务选择: google | deepl | openai | glm | baidu
  translateService: "google",

  // 通用 API 密钥（也可以通过环境变量配置，用于兼容旧配置）
  apiKey: process.env.TRANSLATE_API_KEY || "",

  // ========== 各翻译服务的详细配置（推荐使用） ==========
  translator: {
    // Google Translate 配置
    google: {
      apiKey: process.env.GOOGLE_API_KEY || process.env.TRANSLATE_API_KEY || "",
      useFreeAPI: true, // true = 使用免费 API，false = 使用官方付费 API
    },

    // OpenAI 配置
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      temperature: 0.3,
      maxTokens: 1000,
    },

    // GLM (智谱AI) 配置
    glm: {
      apiKey: process.env.GLM_API_KEY || "",
      model: process.env.GLM_MODEL || "glm-4",
      baseUrl: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      temperature: 0.3,
      top_p: 0.7,
    },

    // DeepL 配置
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || "",
      // 使用免费版还是专业版 API
      apiUrl: process.env.DEEPL_API_URL || "https://api-free.deepl.com/v2/translate",
    },

    // 百度翻译配置
    baidu: {
      appId: process.env.BAIDU_APP_ID || "",
      secret: process.env.BAIDU_SECRET || "",
    },
  },

  // ========== 提取规则配置 ==========
  excludePatterns: [
    // 排除 console 中的文本
    /console\.(log|warn|error|debug|info)/,

    // 排除注释
    /\/\/.*$/,
    /\/\*[\s\S]*?\*\//,

    // 排除调试代码
    /debugger/,

    // 排除特定的函数调用
    /translate\(/, // 已经是翻译函数调用的不处理
  ],

  // ========== 生成配置 ==========
  keyGeneration: {
    // key 生成策略：'auto' | 'text' | 'indexed'
    // auto: 短文本用文本作为 key，长文本用 text_N
    // text: 总是使用文本本身作为 key
    // indexed: 总是使用 text_N 格式
    strategy: "auto",

    // 长文本的阈值（字符数）
    longTextThreshold: 6,

    // key 前缀
    prefix: "",
  },

  // ========== 术语表 ==========
  // 优先使用术语表中的翻译，而不是 API 翻译
  terminology: {
    用户: {
      "en-US": "User",
      "ja-JP": "ユーザー",
      "ko-KR": "사용자",
    },
    登录: {
      "en-US": "Sign In",
      "ja-JP": "サインイン",
      "ko-KR": "로그인",
    },
    注册: {
      "en-US": "Sign Up",
      "ja-JP": "サインアップ",
      "ko-KR": "회원가입",
    },
    提交: {
      "en-US": "Submit",
      "ja-JP": "送信",
      "ko-KR": "제출",
    },
    取消: {
      "en-US": "Cancel",
      "ja-JP": "キャンセル",
      "ko-KR": "취소",
    },
    保存: {
      "en-US": "Save",
      "ja-JP": "保存",
      "ko-KR": "저장",
    },
    删除: {
      "en-US": "Delete",
      "ja-JP": "削除",
      "ko-KR": "삭제",
    },
    编辑: {
      "en-US": "Edit",
      "ja-JP": "編集",
      "ko-KR": "편집",
    },
  },

  // ========== 输出配置 ==========
  output: {
    // 语言包输出目录
    dir: "src/locales",

    // 是否生成带上下文的 key
    useContext: true,

    // 是否生成 TypeScript 类型定义
    generateTypes: true,
  },

  // ========== 代码替换配置 ==========
  replace: {
    // 是否启用代码替换功能
    enabled: false, // 默认关闭，需要手动启用

    // 替换模式：'conservative' | 'aggressive'
    // conservative: 只替换明确的文本
    // aggressive: 替换所有可能的文本
    mode: "conservative",

    // 备份原文件
    backup: true,
  },

  // ========== 缓存配置 ==========
  cache: {
    // 缓存目录
    dir: ".i18n-cache",

    // 是否启用缓存
    enabled: true,
  },
};
