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
      '.vercel/',
      'drizzle/',
      'docs/',
      'playwright-report/',
      'test-results/',
      'public/',
      'screenshots/',
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
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      // Safari/VoiceOver drops list semantics when list-style is none: keep role="list".
      'astro/jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
    },
  },
  {
    files: ['scripts/**', 'tests/**'],
    rules: { 'no-console': 'off' },
  },
]
