import { existsSync } from 'node:fs'
import node from '@astrojs/node'
import { defineConfig } from 'astro/config'

// Load .env into process.env so server code and scripts read the same variables.
if (existsSync('.env')) process.loadEnvFile('.env')

export default defineConfig({
  // Every page is rendered on demand: a change saved in the back office is visible on the next request.
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  site: process.env.PUBLIC_BASE_URL ?? 'http://localhost:4321',
  trailingSlash: 'never',
  security: { checkOrigin: true },
  server: { port: 4321 },
  devToolbar: { enabled: false },
  prefetch: false,
  build: { inlineStylesheets: 'always' },
})
