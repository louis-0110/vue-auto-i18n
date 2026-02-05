# 测试项目说明文档

## 项目概述

这是一个用于测试 vue-auto-i18n 核心功能的示例项目。

## 测试目标

### 1. 中文提取功能测试
- 从 Vue 组件模板中提取中文
- 从 Vue 组件脚本中提取中文
- 验证提取的准确性

### 2. GLM 翻译功能测试
- 使用 GLM-4 模型进行翻译
- 测试多语言翻译（英文、日文）
- 验证翻译结果的准确性

### 3. 语言包生成测试
- 验证 JSON 格式是否正确
- 验证多语言文件是否生成
- 检查语言包的完整性

## 项目结构

```
examples/test-project/
├── src/
│   ├── locales/          # 生成的语言包（测试后生成）
│   │   ├── zh-CN.json
│   │   ├── en-US.json
│ │   └── ja-JP.json
│   ├── App.vue           # 测试用 Vue 组件
│   └── main.js
├── .env                  # 环境变量配置
├── i18n.config.js       # 国际化配置
├── package.json
├── vite.config.js
└── index.html
```

## 测试步骤

### 步骤 1：安装依赖

```bash
cd examples/test-project
npm install
```

### 步骤 2：配置 GLM API Key

编辑 `.env` 文件，填入你的 GLM API Key：

```bash
GLM_API_KEY=your-glm-api-key-here
```

### 步骤 3：运行中文提取

```bash
npm run extract
```

预期结果：
- 在 `.i18n-cache` 目录中生成提取的中文缓存
- 控制台显示提取到的中文文本

### 步骤 4：运行 GLM 翻译

```bash
npm run translate
```

预期结果：
- 在 `src/locales/` 目录中生成语言包文件：
  - `zh-CN.json` - 中文原文
  - `en-US.json` - 英文翻译
  - `ja-JP.json` - 日文翻译

### 步骤 5：验证语言包

检查生成的语言包内容：

```bash
cat src/locales/zh-CN.json
cat src/locales/en-US.json
cat src/locales/ja-JP.json
```

### 步骤 6：测试构建（可选）

```bash
npm run build
npm run preview
```

验证：
- 页面是否能正确显示
- 语言切换是否正常工作
- 源代码未被修改

## 测试的中文文本

App.vue 中包含以下中文文本：

**模板中的中文：**
- 欢迎
- 介绍
- 功能特性
- 特性1：自动中文提取
- 特性2：AI 智能翻译
- 特性3：零侵入性
- 按钮
- 提交
- 取消
- 状态
- 成功消息
- 错误消息
- 页脚

**脚本中的中文：**
- 标题
- 描述
- 点击按钮

## 预期的语言包内容

### zh-CN.json

```json
{
  "欢迎": "欢迎",
  "介绍": "介绍",
  "功能特性": "功能特性",
  "特性1": "自动中文提取",
  "特性2": "AI 智能翻译",
  "特性3": "零侵入性",
  "按钮": "按钮",
  "提交": "提交",
  "取消": "取消",
  "状态": "状态",
  "成功消息": "成功消息",
  "错误消息": "错误消息",
  "页脚": "页脚",
  "标题": "标题",
  "描述": "描述",
  "点击按钮": "点击"
}
```

### en-US.json (GLM 翻译结果)

```json
{
  "欢迎": "Welcome",
  "介绍": "Introduction",
  "功能特性": "Features",
  "特性1": "Automatic Chinese extraction",
  "特性2": "AI intelligent translation",
  "特性3": "Zero intrusion",
  "按钮": "Button",
  "提交": "Submit",
  "取消": "Cancel",
  "状态": "Status",
  "成功消息": "Success message",
  "错误消息": "Error message",
  "页脚": "Footer",
  "标题": "Title",
  "描述": "Description",
  "点击按钮": "Click button"
}
```

## 注意事项

1. **API Key**: 需要有效的 GLM API Key 才能进行翻译测试
2. **网络连接**: 确保网络可以访问 GLM API 端点
3. **API 限制**: GLM 有请求频率限制，批量翻译时会自动添加延迟
4. **费用**: GLM API 调用可能产生费用，请注意使用量

## 故障排查

### 提取失败
- 检查 `i18n.config.js` 中的 `include` 配置
- 确认文件路径正确

### 翻译失败
- 检查 `.env` 文件中的 API Key 是否正确
- 查看控制台输出的错误信息
- 确认网络连接正常

### 构建失败
- 确保语言包文件已生成
- 检查 `vite.config.js` 中的插件配置
