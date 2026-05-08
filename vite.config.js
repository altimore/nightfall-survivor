import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

// Version + changelog from git history (commit count = patch number).
function gitOut(cmd, fallback = '') {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); } catch (_) { return fallback; }
}
const COMMIT_COUNT = parseInt(gitOut('git rev-list --count HEAD', '0'), 10) || 0;
const COMMIT_HASH = gitOut('git rev-parse --short HEAD', 'dev');
const COMMIT_DATE = gitOut('git log -1 --format=%cs', '');
const APP_VERSION = `0.${Math.floor(COMMIT_COUNT / 100)}.${COMMIT_COUNT}`;

// Generate changelog.json from the last 40 commits at build time.
function generateChangelog() {
  const out = resolve('public/changelog.json');
  try {
    const log = gitOut('git log -40 --pretty=format:%h|%cs|%s', '');
    const entries = log.split('\n').filter(Boolean).map(line => {
      const [hash, date, ...subject] = line.split('|');
      return { hash, date, subject: subject.join('|') };
    });
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, JSON.stringify({
      version: APP_VERSION,
      hash: COMMIT_HASH,
      date: COMMIT_DATE,
      count: COMMIT_COUNT,
      entries,
    }, null, 2));
  } catch (_) {}
}
generateChangelog();

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
    __APP_HASH__: JSON.stringify(COMMIT_HASH),
    __APP_DATE__: JSON.stringify(COMMIT_DATE),
    __APP_BUILD__: COMMIT_COUNT,
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'Nightfall Survivor',
        short_name: 'Nightfall',
        description: 'Survive 5 minutes in eternal night — a Vampire Survivors-like.',
        theme_color: '#030008',
        background_color: '#030008',
        display: 'standalone',
        orientation: 'any',
        scope: '/nightfall-survivor/',
        start_url: '/nightfall-survivor/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\//,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-stylesheets' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-webfonts',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  base: '/nightfall-survivor/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          phaser: ['phaser'],
          react: ['react', 'react-dom'],
        },
      },
    },
    chunkSizeWarningLimit: 1500,
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
});
