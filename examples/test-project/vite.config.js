import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { createAutoI18nPlugin } from '../../packages/vite-plugin/dist/index.js'

export default defineConfig({
  plugins: [
    vue(),
    createAutoI18nPlugin({
      localesDir: 'src/locales',
      devMode: true // 开发模式也启用转换
    })
  ]
})
