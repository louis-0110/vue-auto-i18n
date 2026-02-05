import { defineConfig } from 'tsup'

export default defineConfig([
  // Library entry (no shebang)
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    dts: true,
    clean: false,
    sourcemap: true,
    splitting: false,
    target: 'es2020',
    outDir: 'dist',
    esbuildOptions(options) {
      options.alias = {
        '@vue-auto-i18n/core': '../../core/src'
      }
    }
  },
  // CLI entry (with shebang)
  {
    entry: ['src/cli.ts'],
    format: ['esm'],
    dts: true,
    clean: false,
    sourcemap: true,
    splitting: false,
    target: 'es2020',
    outDir: 'dist',
    banner: {
      js: '#!/usr/bin/env node'
    },
    esbuildOptions(options) {
      options.alias = {
        '@vue-auto-i18n/core': '../../core/src',
        '@vue-auto-i18n/replacer': '../../replacer/src'
      }
    }
  }
])
