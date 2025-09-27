import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

const stripEvalFromFileType = (): Plugin => ({
  name: 'strip-eval-file-type',
  enforce: 'pre',
  transform(code, id) {
    if (id.includes('node_modules/file-type/core.js') && code.includes("eval('require')")) {
      return code.replace("eval('require')", 'require')
    }
    return null
  },
})

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [mode === 'production' ? (stripEvalFromFileType() as Plugin) : null, react()].filter(Boolean) as Plugin[],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      stream: path.resolve(__dirname, './src/shims/stream.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
}))
