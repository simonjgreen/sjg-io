// @ts-check

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintPluginAstro from 'eslint-plugin-astro';
import globals from 'globals';

export default [
  {
    ignores: ['.astro/**', 'dist/**'],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Node.js config files (*.config.*, astro.config.*.mjs, etc.)
  {
    files: ['*.config.mjs', '*.config.cjs', '*.config.js', '*.config.*.mjs', '*.config.*.cjs', '*.config.*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  // CommonJS files
  {
    files: ['**/*.cjs'],
    languageOptions: {
      globals: {
        ...globals.commonjs,
      },
    },
  },
  // Astro API routes and server files that use Web APIs
  {
    files: ['src/pages/**/*.js', 'src/pages/**/*.ts'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
  // Allow triple-slash references in type declaration files
  {
    files: ['**/*.d.ts'],
    rules: {
      '@typescript-eslint/triple-slash-reference': 'off',
    },
  },
];
