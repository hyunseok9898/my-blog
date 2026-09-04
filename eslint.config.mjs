import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-config-prettier';
import eslintPluginTailwindcss from 'eslint-plugin-tailwindcss';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ...eslintPluginTailwindcss.configs.recommended,
    languageOptions: {
      ...eslintPluginTailwindcss.configs.recommended.languageOptions,
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      tailwindcss: {
        cssConfigPath: './app/globals.css',
      },
    },
    rules: {
      ...eslintPluginTailwindcss.configs.recommended.rules,
      'no-unused-vars': 'warn',
      'no-console': 'warn',
      // 클래스 순서는 prettier-plugin-tailwindcss가 담당
      'tailwindcss/classnames-order': 'off',
      // 임의 값·커스텀 클래스는 허용하고, 스케일로 바꿀 수 있는 것만 고친다
      'tailwindcss/no-custom-classname': 'off',
      'tailwindcss/no-unnecessary-arbitrary-value': 'warn',
      'tailwindcss/enforces-canonical-classname': 'warn',
    },
  },
  prettier,
];

export default eslintConfig;
