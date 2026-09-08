import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    ...(mode !== 'production' ? [babel({ presets: [reactCompilerPreset()] })] : []),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    globals: true,
    css: false,
    // Los 5s por defecto se quedan cortos con la suite entera en paralelo y el
    // coverage instrumentando encima: los tests que teclean con `userEvent`
    // pasan de sobra en aislado y caducaban de a dos o tres, distintos en cada
    // corrida. Lo que tardan es la máquina, no el componente.
    testTimeout: 15_000,
    coverage: {
      include: ['src/**'],
      exclude: ['src/test/**', 'src/**/*.d.ts'],
      reporter: ['text', 'html'],
      // Sin esto vitest omite el reporte cuando algún test falla.
      reportOnFailure: true,
    },
  },
}))
