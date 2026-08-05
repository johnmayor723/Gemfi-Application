import path from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    // ib-demo is GemFi's own demo host; the leading-dot pattern additionally
    // allows any live tenant subdomain (acme.gemfitech.com, etc.) proxied
    // here by the Gateway's wildcard tenant routing.
    allowedHosts: ['ib-demo.gemfitech.com', '.gemfitech.com'],
  },
});
