import { createApp } from 'vue'
import { createI18n } from 'vue-i18n'
import App from './App.vue'

// 导入语言包
import zhCN from './locales/zh-CN.json'
import enUS from './locales/en-US.json'
import jaJP from './locales/ja-JP.json'

// 创建 i18n 实例
const i18n = createI18n({
  legacy: false, // 使用 Composition API 模式
  locale: 'zh-CN', // 默认语言
  fallbackLocale: 'zh-CN', // 回退语言
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
    'ja-JP': jaJP
  }
})

const app = createApp(App)
app.use(i18n)
app.mount('#app')

// 将 i18n 实例挂载到 window，方便调试
if (import.meta.env.DEV) {
  window.__i18n__ = i18n
}
