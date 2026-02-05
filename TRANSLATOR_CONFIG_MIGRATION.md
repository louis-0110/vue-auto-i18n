# 翻译模型配置统一说明

## 变更概述

已将所有翻译模型（Google、OpenAI、GLM、DeepL、百度）的配置统一到 `translator` 配置对象中，实现了配置的一致性和易用性。

## 主要变更

### 1. i18n.config.example.js 更新

#### 旧配置（仍兼容）：
```javascript
export default {
  translateService: "openai",
  apiKey: process.env.TRANSLATE_API_KEY || "",
  openai: {
    model: "gpt-3.5-turbo",
    temperature: 0.3,
    maxTokens: 1000,
  },
}
```

#### 新配置（推荐）：
```javascript
export default {
  translateService: "openai",
  translator: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY || "",
      model: process.env.OPENAI_MODEL || "gpt-3.5-turbo",
      baseUrl: process.env.OPENAI_BASE_URL || "https://api.openai.com/v1/chat/completions",
      temperature: 0.3,
      maxTokens: 1000,
    },
    glm: {
      apiKey: process.env.GLM_API_KEY || "",
      model: process.env.GLM_MODEL || "glm-4",
      baseUrl: process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions",
      temperature: 0.3,
      top_p: 0.7,
    },
    google: {
      apiKey: process.env.GOOGLE_API_KEY || "",
      useFreeAPI: true,
    },
    deepl: {
      apiKey: process.env.DEEPL_API_KEY || "",
      apiUrl: process.env.DEEPL_API_URL || "https://api-free.deepl.com/v2/translate",
    },
    baidu: {
      appId: process.env.BAIDU_APP_ID || "",
      secret: process.env.BAIDU_SECRET || "",
    },
  },
}
```

### 2. .env.example 新增环境变量

新增了 GLM 相关的环境变量：

```bash
# GLM (智谱AI) API Key
GLM_API_KEY=
# GLM 模型选择（可选，默认 glm-4）
GLM_MODEL=glm-4
# GLM API Base URL（可选）
GLM_BASE_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
```

### 3. 配置加载逻辑更新

- 新增 `translator` 配置字段支持
- 保持向后兼容，旧的配置方式仍然有效
- 自动从环境变量中读取配置
- 优先级：`translator.{service}` > 环境变量 > 旧配置

### 4. 新增工厂函数

在 `packages/core/src/translators/index.ts` 中新增了 `createTranslatorFromConfig` 函数：

```typescript
import { createTranslatorFromConfig } from '@vue-auto-i18n/core/translators'
import { loadConfig } from '@vue-auto-i18n/core/config'

const config = await loadConfig()
const translator = createTranslatorFromConfig(config)
```

## 使用方式

### 方式一：使用新配置（推荐）

```javascript
// i18n.config.js
export default {
  translateService: "glm",
  translator: {
    glm: {
      apiKey: process.env.GLM_API_KEY,
      model: "glm-4",
    },
  },
}
```

### 方式二：使用环境变量

```bash
# .env
TRANSLATE_SERVICE=glm
GLM_API_KEY=your-api-key
GLM_MODEL=glm-4
```

### 方式三：使用旧配置（向后兼容）

```javascript
// i18n.config.js
export default {
  translateService: "glm",
  apiKey: process.env.GLM_API_KEY,
  glmModel: "glm-4",
}
```

## 各翻译器配置说明

### Google Translate
- `apiKey`: API 密钥（可选，不提供则使用免费 API）
- `useFreeAPI`: 是否使用免费 API（默认 true）

### OpenAI
- `apiKey`: API 密钥（必需）
- `model`: 模型名称（默认 gpt-3.5-turbo）
- `baseUrl`: API 端点（可选）
- `temperature`: 温度参数（默认 0.3）
- `maxTokens`: 最大 token 数（默认 1000）

### GLM (智谱AI)
- `apiKey`: API 密钥（必需）
- `model`: 模型名称（默认 glm-4）
- `baseUrl`: API 端点（可选）
- `temperature`: 温度参数（默认 0.3）
- `top_p`: top_p 参数（默认 0.7）

### DeepL
- `apiKey`: API 密钥（必需）
- `apiUrl`: API 端点（可选，默认免费版）

### 百度翻译
- `appId`: 应用 ID（必需）
- `secret`: 密钥（必需）

## 迁移指南

如果您当前使用的是旧配置：

### 从 OpenAI 旧配置迁移：
```javascript
// 旧配置
{
  translateService: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  openaiModel: "gpt-3.5-turbo",
}

// 新配置
{
  translateService: "openai",
  translator: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY,
      model: "gpt-3.5-turbo",
    },
  },
}
```

### 从 GLM 旧配置迁移：
```javascript
// 旧配置
{
  translateService: "glm",
  apiKey: process.env.GLM_API_KEY,
  glmModel: "glm-4",
}

// 新配置
{
  translateService: "glm",
  translator: {
    glm: {
      apiKey: process.env.GLM_API_KEY,
      model: "glm-4",
    },
  },
}
```

## 兼容性

- ✅ 完全向后兼容旧配置
- ✅ 支持环境变量配置
- ✅ 支持混合使用新旧配置
- ✅ 新旧配置可以共存，新配置优先级更高

## 示例

完整的配置示例请参考：
- [i18n.config.example.js](./i18n.config.example.js)
- [.env.example](./.env.example)
