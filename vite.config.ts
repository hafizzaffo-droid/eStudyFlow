import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import dotenv from 'dotenv';
import { AssistantHistoryItem, AssistantProfile, generateAssistantReply } from './assistant-service.ts';
import { isWithinAssistantRateLimit, verifyFirebaseIdToken } from './server-auth.ts';
import { getOfficialNewsForLanguage } from './official-news-service.ts';

dotenv.config();
const rootDir = path.dirname(fileURLToPath(import.meta.url));

function sendJson(res: import('http').ServerResponse, status: number, data: unknown) {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(data));
}

function apiServerPlugin(): Plugin {
  return {
    name: 'api-server-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const requestUrl = new URL(req.url || '/', 'http://localhost');
        if (requestUrl.pathname === '/api/news' && req.method === 'GET') {
          const language = requestUrl.searchParams.get('lang') === 'en' ? 'en' : 'fr';
          void getOfficialNewsForLanguage(language).then(news => {
            sendJson(res, 200, news);
          }).catch(error => {
            console.error('Official news request failed:', error);
            sendJson(res, 503, { error: 'official_news_unavailable' });
          });
          return;
        }
        if (req.url?.split('?')[0] !== '/api/assistant' || req.method !== 'POST') {
          next();
          return;
        }

        const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
        if (!token) {
          sendJson(res, 401, { error: 'authentication_required' });
          return;
        }

        let body = '';
        let tooLarge = false;
        req.on('data', chunk => {
          if (tooLarge) return;
          body += chunk.toString();
          if (Buffer.byteLength(body) > 32 * 1024) {
            tooLarge = true;
            sendJson(res, 413, { error: 'request_too_large' });
          }
        });

        req.on('end', () => {
          if (tooLarge) return;
          void handleAssistantRequest(token, body, res);
        });
      });
    },
  };
}

async function handleAssistantRequest(
  token: string,
  body: string,
  res: import('http').ServerResponse,
) {
  let uid: string | null;
  try {
    uid = await verifyFirebaseIdToken(token);
  } catch (error) {
    console.error('Firebase token validation failed:', error);
    sendJson(res, 503, { error: 'authentication_service_unavailable' });
    return;
  }
  if (!uid) {
    sendJson(res, 401, { error: 'invalid_session' });
    return;
  }
  if (!isWithinAssistantRateLimit(uid)) {
    sendJson(res, 429, { error: 'rate_limit_exceeded' });
    return;
  }

  try {
    const parsed = JSON.parse(body || '{}') as {
      message?: unknown;
      profile?: AssistantProfile;
      history?: unknown;
      language?: unknown;
    };
    if (typeof parsed.message !== 'string' || !parsed.message.trim() || parsed.message.length > 2000) {
      sendJson(res, 400, { error: 'invalid_message' });
      return;
    }
    const history = Array.isArray(parsed.history)
      ? parsed.history.slice(-4).filter((entry: unknown): entry is AssistantHistoryItem =>
        Boolean(entry)
        && typeof entry === 'object'
        && ['user', 'assistant'].includes(String((entry as { role?: unknown }).role))
        && typeof (entry as { content?: unknown }).content === 'string'
        && (entry as { content: string }).content.length <= 2000)
      : [];
    if (parsed.language !== undefined && parsed.language !== 'fr' && parsed.language !== 'en') {
      sendJson(res, 400, { error: 'invalid_language' });
      return;
    }
    const reply = await generateAssistantReply(parsed.message.trim(), parsed.profile || {}, history, parsed.language === 'en' ? 'en' : 'fr');
    sendJson(res, 200, reply);
  } catch (error) {
    if (error instanceof Error && error.message === 'assistant_not_configured') {
      sendJson(res, 503, { error: error.message });
      return;
    }
    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: 'invalid_json' });
      return;
    }
    console.error('Assistant provider error:', error);
    sendJson(res, 502, { error: 'assistant_provider_error' });
  }
}

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    apiServerPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon.svg'],
      manifest: {
        id: '/',
        name: 'eStudyFlow',
        short_name: 'eStudyFlow',
        description: 'Ta vie étudiante en France, au même endroit. Démarches administratives, calendrier, titre de séjour et eStudy AI.',
        theme_color: '#4263EB',
        background_color: '#F8F9FB',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'] },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  resolve: { alias: { '@': path.resolve(rootDir, '.') } },
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'firebase-auth', test: /node_modules[\\/]@firebase[\\/]auth/ },
            { name: 'firebase-firestore', test: /node_modules[\\/]@firebase[\\/]firestore/ },
          ],
        },
      },
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
    watch: process.env.DISABLE_HMR === 'true' ? null : {},
  },
}));
