import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginImport from 'eslint-plugin-import';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const languageOptions = {
	parser: tseslint.parser,
	parserOptions: {
		project: './tsconfig.json',
		tsconfigRootDir: import.meta.dirname,
		ecmaVersion: 'latest',
		sourceType: 'module',
	},
	globals: {
		...globals.node,
		...globals.es2021,
	},
};

export default [
	js.configs.recommended,
	...tseslint.configs.recommended,
	{
		ignores: ['dist/**', 'node_modules/**', 'coverage/**', '.*/**'],
	},
	{
		plugins: {
			'@stylistic': stylistic,
		},
		rules: {
			// Stylistic rules (replaces Prettier)
			'@stylistic/semi': 'error',
			'@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
			'@stylistic/indent': ['error', 'tab', { SwitchCase: 1, ignoredNodes: ['PropertyDefinition', 'Decorator'] }],
			'@stylistic/comma-dangle': ['error', 'always-multiline'],
			'@stylistic/arrow-parens': ['error', 'always'],
			'@stylistic/brace-style': ['error', '1tbs'],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/array-bracket-spacing': ['error', 'never'],
			'@stylistic/no-trailing-spaces': 'error',
			'@stylistic/eol-last': 'error',
			'@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
			'@stylistic/comma-spacing': ['error', { before: false, after: true }],
			'@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
			'@stylistic/space-before-blocks': 'error',
			'@stylistic/keyword-spacing': ['error', { before: true, after: true }],
			'@stylistic/space-infix-ops': 'error',
		},
	},
	{
		files: ['**/*.ts'],
		languageOptions,
		plugins: {
			'@typescript-eslint': tseslint.plugin,
		},
		rules: {
			'@typescript-eslint/consistent-type-imports': ['error', {
				prefer: 'type-imports',
				fixStyle: 'separate-type-imports',
			}],
			'@typescript-eslint/no-unused-vars': 'warn',
			'@typescript-eslint/no-explicit-any': 'warn',
			'@typescript-eslint/require-await': 'off',
			'@typescript-eslint/no-floating-promises': 'off',
			'no-console': ['warn', { allow: ['warn', 'error'] }],
		},
	},
	{
		files: ['**/*.spec.ts', '**/*.e2e-spec.ts', '**/*.test.ts'],
		languageOptions: {
			...languageOptions,
			globals: {
				...languageOptions.globals,
				...globals.vitest,
			},
		},
		rules: {
			'@typescript-eslint/no-explicit-any': 'off',
		},
	},
	{
		plugins: {
			import: eslintPluginImport,
		},
		rules: {
			'import/order': [
				'error',
				{
					groups: ['builtin', 'external', 'internal', ['parent', 'sibling'], 'index', 'unknown'],
					alphabetize: { order: 'asc', caseInsensitive: true },
				},
			],
		},
	},
];
