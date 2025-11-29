import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		root: './',
		include: ['**/*.spec.ts', '**/*.e2e-spec.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules', 'dist', '**/*.spec.ts', '**/*.e2e-spec.ts'],
		},
	},
	plugins: [swc.vite()],
});
