import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { copyFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const PROD_BASE = '/acro-routine-builder/';

function resolveBase(command: string): string {
  if (command !== 'build') {
    return '/';
  }
  return process.env.VITE_BASE_PATH ?? PROD_BASE;
}

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

function staticBuildFiles(appVersion: string): PluginOption {
  return {
    name: 'static-build-files',
    closeBundle() {
      const dir = resolve(process.cwd(), 'dist');
      copyFileSync(resolve(dir, 'index.html'), resolve(dir, '404.html'));
      writeFileSync(
        resolve(dir, 'app-version.json'),
        `${JSON.stringify({ version: appVersion })}\n`,
      );
    },
  };
}

export default defineConfig(({ command }) => {
  const appVersion = resolveAppVersion();

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null,
        manifest: false,
        manifestFilename: 'site.webmanifest',
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,pdf,webmanifest}'],
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
      staticBuildFiles(appVersion),
    ],
    base: resolveBase(command),
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
      __CF_ANALYTICS_TOKEN__: JSON.stringify(
        process.env.CF_ANALYTICS_TOKEN ?? null,
      ),
      __SHARE_SHORTENER_URL__: JSON.stringify(
        process.env.SHARE_SHORTENER_URL ?? null,
      ),
    },
  };
});
