import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/extractors/index.ts', 'src/translators/index.ts', 'src/utils/index.ts'],
  format: ['esm'],
  dts: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  target: 'es2020',
  outDir: 'dist'
})
