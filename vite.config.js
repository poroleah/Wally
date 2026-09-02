import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// dev 프록시 없음: endpoints.js가 모든 요청을 게이트웨이 절대 URL로 만들기
// 때문에 프록시를 타지 않는다 (mewly와 동일 — 백엔드 CORS 허용 전제).
export default defineConfig({
  plugins: [
    vue(),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5176,
    strictPort: true,
    allowedHosts: true,
    hmr: {
      port: 5177,
      clientPort: 5177,
    },
    watch: {
      usePolling: true,
    },
  },
})
