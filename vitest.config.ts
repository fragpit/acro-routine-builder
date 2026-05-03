import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
  define: {
    __APP_VERSION__: JSON.stringify('test'),
    __CF_ANALYTICS_TOKEN__: JSON.stringify(null),
    __SHARE_SHORTENER_URL__: JSON.stringify('https://share.example.test'),
  },
});
