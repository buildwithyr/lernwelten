import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['eslint.config.js'],
  },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.browser,
        // Module-globale IIFEs (js/*.js, js/modules/*.js) - siehe CLAUDE.md Abschnitt 2/4
        Storage: 'readonly',
        Adaptive: 'readonly',
        Oskar: 'readonly',
        Profile: 'readonly',
        Clock: 'readonly',
        App: 'readonly',
        MathModule: 'readonly',
        WordsModule: 'readonly',
        PuzzlesModule: 'readonly',
        ScienceModule: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      eqeqeq: 'error',
      'no-undef': 'error',
      'no-console': 'warn',
      'no-redeclare': ['error', { builtinGlobals: false }],
    },
  },
];
