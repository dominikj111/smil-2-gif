import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))

// ui-components-library is consumed as raw TS source (no build step) — the same
// pattern ui-components-library-dev uses. Aliases resolve the library + shared
// package directly; only the imports actually used must resolve from here.
const LIBS = '/development/ui-components-library/ui-components-library'

export default defineConfig({
  plugins: [react()],
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: [
      {
        find: '@ui-components-library/react/styles',
        replacement: path.resolve(__dirname, `${LIBS}/packages/react/src/styles/index.css`),
      },
      {
        find: '@ui-components-library/react',
        replacement: path.resolve(__dirname, `${LIBS}/packages/react/src/index.ts`),
      },
      {
        find: '@ui-components-library/shared',
        replacement: path.resolve(__dirname, `${LIBS}/packages/shared/src/index.ts`),
      },
    ],
  },
  server: {
    port: 5173,
    fs: {
      allow: ['..', LIBS],
    },
  },
})
