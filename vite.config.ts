import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { copyFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_BASE = '/acro-routine-builder/';

function resolveAppVersion(): string {
  const ref = process.env.GITHUB_REF_NAME;
  if (ref && /^v\d+\.\d+\.\d+/.test(ref)) {
    return ref.replace(/^v/, '');
  }
  try {
    return execSync('git describe --tags --always --dirty', {
      stdio: ['ignore', 'pipe', 'ignore'],
    })
      .toString()
      .trim()
      .replace(/^v/, '');
  } catch {
    return 'dev';
  }
}

function copyIndexAsFallback(): PluginOption {
  return {
    name: 'copy-index-as-404',
    closeBundle() {
      const dir = resolve(process.cwd(), 'dist');
      copyFileSync(resolve(dir, 'index.html'), resolve(dir, '404.html'));
    },
  };
}

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: null,
      manifest: false,
      manifestFilename: 'site.webmanifest',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        cleanupOutdatedCaches: true,
        navigateFallback: 'index.html',
      },
      includeAssets: [
        'favicon.svg',
        'favicon-32.png',
        'apple-touch-icon.png',
        'icon-192.png',
        'icon-512.png',
        'site.webmanifest',
      ],
    }),
    copyIndexAsFallback(),
  ],
  base: command === 'build' ? PROD_BASE : '/',
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
    __CF_ANALYTICS_TOKEN__: JSON.stringify(
      process.env.CF_ANALYTICS_TOKEN ?? null,
    ),
  },
}));
