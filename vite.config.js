import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/leetcode-api': {
        target: 'https://leetcode.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/leetcode-api/, ''),
        configure: (proxy, _options) => {
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            const leetcodeCookie = req.headers['x-leetcode-cookie'];
            if (leetcodeCookie) {
              proxyReq.setHeader('Cookie', leetcodeCookie);
            }
          });
        }
      }
    }
  }
});
