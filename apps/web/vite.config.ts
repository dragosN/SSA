import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'node:https'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const cesiumMod = require('vite-plugin-cesium') as
  | ((options?: object) => Plugin)
  | { default: (options?: object) => Plugin }

const viteCesium =
  typeof cesiumMod === 'function' ? cesiumMod : cesiumMod.default

/** HostPapa IP — avoids Node ENOTFOUND when DNS for celestrak.org fails in the dev process. */
const CELESTRAK_IP = '104.168.149.178'

export default defineConfig({
  plugins: [react(), viteCesium()],
  server: {
    port: 5173,
    proxy: {
      // Live GP API. Pin IP + SNI so the proxy works even when Node DNS is broken.
      '/celestrak': {
        target: `https://${CELESTRAK_IP}`,
        changeOrigin: true,
        secure: true,
        timeout: 45_000,
        proxyTimeout: 45_000,
        rewrite: (path) => path.replace(/^\/celestrak/, ''),
        agent: new https.Agent({ servername: 'celestrak.org' }),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.setHeader('Host', 'celestrak.org')
          })
        },
      },
      // CORS-free mirror when bundled files are missing or stale.
      '/mirror/celestrak': {
        target:
          'https://raw.githubusercontent.com/satvisorcom/satvisor-data/master/celestrak/json',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/mirror\/celestrak/, ''),
      },
    },
  },
  worker: {
    format: 'es',
  },
})
