import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

/** Files that are helpers/utilities, not test suites */
const nonTestFiles = [
  'test/commands.js',
  'test/server.js',
  'test/utils/**/*.js',
  'test/download-write-read.js',
]

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['lib/**/*.js'],
      exclude: ['lib/types.ts'],
    },
    projects: [
      {
        test: {
          name: 'node',
          pool: 'forks',
          environment: 'node',
          include: ['test/**/*.js'],
          exclude: nonTestFiles,
        },
      },
      {
        test: {
          name: 'browser',
          include: ['test/write-read.js'],
          browser: {
            enabled: true,
            headless: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
            commands: {
              readdir: (await import('./test/commands.js')).readdir,
              randomImage: (await import('./test/commands.js')).randomImage,
            },
          },
        },
        resolve: {
          alias: [
            // Swap Node.js file I/O helpers with browser-compatible versions
            {
              find: './utils/io.js',
              replacement: fileURLToPath(new URL('./test/utils/io.browser.js', import.meta.url)),
            },
            // Stub node:stream so lib/writer.js can be bundled for the browser
            {
              find: 'node:stream',
              replacement: fileURLToPath(
                new URL('./test/utils/stubs/node-stream.js', import.meta.url),
              ),
            },

          ],
        },
        optimizeDeps: {
          // Prevent Vite from pre-bundling Node.js-only modules
          exclude: [
            'node:stream',
            'node:fs/promises',
            'sharp',
            'random-bytes-readable-stream',
            '@gmaclennan/zip-reader/file-source',
          ],
        },
      },
    ],
  },
})
