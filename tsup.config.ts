import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/index': 'src/plugins/index.ts',
    'plugins/jwt': 'src/plugins/jwt/index.ts',
    'plugins/sessions': 'src/plugins/sessions/index.ts',
    'plugins/oauth': 'src/plugins/oauth/index.ts',
    'plugins/two-factor': 'src/plugins/two-factor/index.ts',
  },
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  splitting: false,
  minify: false,
  external: ['drizzle-orm', 'argon2', 'jose', 'zod'],
  treeshake: true,
  esbuildOptions: (options) => {
    options.alias = {
      '@/core': './src/core',
      '@/plugins': './src/plugins',
      '@/types': './src/types',
      '@/utils': './src/utils',
      '@': './src',
    }
  },
})
