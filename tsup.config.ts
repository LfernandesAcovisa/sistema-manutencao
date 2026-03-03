import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/**/*.ts'],
  splitting: false,
  sourcemap: true,
  clean: true,
  format: ['esm'],
  outDir: 'dist',
  skipNodeModulesBundle: true,
});
