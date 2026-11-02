import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Build-time facts. Set by the Dockerfile build args in CI; harmless defaults locally.
// Nothing here names an environment or a release: those are runtime facts, see docker/40-app-config.sh.
const buildInfo = {
  commit: process.env.APP_COMMIT ?? 'local',
  builtAt: process.env.APP_BUILD_TIME ?? new Date().toISOString(),
}

// Emits /build-info.json next to the bundle so a deploy job can curl it.
function buildInfoFile(): Plugin {
  return {
    name: 'build-info-file',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'build-info.json',
        source: JSON.stringify(buildInfo, null, 2),
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), buildInfoFile()],
  define: { __BUILD_INFO__: JSON.stringify(buildInfo) },
  server: { fs: { allow: ['..'] } },
  test: {
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  },
})
