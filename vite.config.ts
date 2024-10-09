import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue(), vueDevTools()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  define: {
    'import.meta.env.CF_PAGES_COMMIT_SHA': JSON.stringify(process.env.CF_PAGES_COMMIT_SHA),
    'import.meta.env.CF_PAGES_BRANCH': JSON.stringify(process.env.CF_PAGES_BRANCH)
  }
})
