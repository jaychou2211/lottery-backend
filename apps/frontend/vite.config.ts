import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { config } from 'dotenv'
import { resolve } from 'path'

const backendEnv = config({ path: resolve(__dirname, '../backend/.env') }).parsed || {}
const apiPort = backendEnv.LOTTERY_FORWARD_API_PORT || '3000'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: `http://localhost:${apiPort}`,
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
})
