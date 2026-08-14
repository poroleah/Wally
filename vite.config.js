import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const wallyHost = env.VITE_WALLY_HOST || env.HOST_IP || '192.168.0.10'
  // The router (port 8000) is the single entry point; there is no separate
  // app port or direct MediaMTX port anymore.
  const wallyApiUrl = `http://${wallyHost}:8000`

  return {
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
      port: 5177,
      strictPort: true,
      allowedHosts: true,
      hmr: {
        port: 5177,
        clientPort: 5177,
      },
      watch: {
        usePolling: true,
      },
      proxy: {
        '/api': wallyApiUrl,
        '/clips': wallyApiUrl,
        '/camera': wallyApiUrl,
        '/state': wallyApiUrl,
        '/events': wallyApiUrl,
        '/prompt': wallyApiUrl,
        '/ptz': wallyApiUrl,
        '/vlm': wallyApiUrl,
        '/stream': wallyApiUrl,
        '/live': wallyApiUrl,
      },
    },
  }
})
