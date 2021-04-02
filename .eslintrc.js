module.exports = {
  root: true,
  globals: {
    'Promise': 'readonly',
  },
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:jest/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  env: {
    node: true,
    'jest/globals': true
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true
    }
  },
  settings: {
    jest: {
      version: 26
    }
  },
  rules: {
    'no-console': 'error',
    'array-bracket-spacing': ['error', 'never'],
    'computed-property-spacing': ['error', 'never'],
    '@typescript-eslint/consistent-type-imports': ['error', {prefer: 'type-imports'}],
    // '@typescript-eslint/await-thenable': 'error',
    // '@typescript-eslint/require-await': 'error',
    // '@typescript-eslint/no-implied-eval': 'error',
    '@typescript-eslint/no-empty-function': 'error',
    '@typescript-eslint/no-extra-semi': 'error',
    '@typescript-eslint/comma-dangle': ['error', 'always-multiline'],
    '@typescript-eslint/object-curly-spacing': ['error', 'never'],
    '@typescript-eslint/no-unused-vars': ['error', { 'argsIgnorePattern': 'next|h' }],
    '@typescript-eslint/no-use-before-define': ['error', { 'variables': false }],
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'warn',
    'jest/valid-expect': 'error'
  },
};