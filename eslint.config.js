import js from '@eslint/js'
import astro from 'eslint-plugin-astro'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default [
  {
    ignores: [
      'dist/',
      'node_modules/',
      '.astro/',
      'drizzle/',
      'docs/',
      'playwright-report/',
      'test-results/',
      'public/',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.strict,
  ...astro.configs.recommended,
  ...astro.configs['jsx-a11y-strict'],
  {
    languageOptions: { globals: { ...globals.node, ...globals.browser } },
    rules: {
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['scripts/**', 'tests/**'],
    rules: { 'no-console': 'off' },
  },
]
