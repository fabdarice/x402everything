import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    proxy: {
      '/api/trpc': {
        target: 'https://www.x402scan.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
