import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const appName = env.VITE_APP_NAME || 'ATOZIKA';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.png', 'ATOZIKA-Favicon.png', 'logo-green.png', 'logo-white.png', 'pwa-192.png', 'pwa-512.png'],
        manifest: {
          name: appName,
          short_name: 'ATOZIKA',
          description: 'Akademi Taktis Integritas, Kepemimpinan & Aparatur. Menempa Intelektual, Mengunci Kelulusan.',
          theme_color: '#070b12',
          background_color: '#070b12',
          display: 'standalone',
          icons: [
            {
              src: '/pwa-192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/pwa-512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      host: true,
      port: 5174,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 750,
    },
  };
});
