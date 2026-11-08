import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { AssistantHistoryItem, AssistantProfile, generateAssistantReply } from './assistant-service';
import { isWithinAssistantRateLimit, verifyFirebaseIdToken } from './server-auth';
import { getOfficialNewsForLanguage } from './official-news-service';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ limit: '32kb' }));

app.get('/api/news', async (req, res) => {
  const requestedLanguage = req.query.lang;
  if (requestedLanguage !== undefined && requestedLanguage !== 'fr' && requestedLanguage !== 'en') {
    res.status(400).json({ error: 'invalid_language' });
    return;
  }
  try {
    res.json(await getOfficialNewsForLanguage(requestedLanguage === 'en' ? 'en' : 'fr'));
  } catch (error) {
    console.error('Official news request failed:', error);
    res.status(503).json({ error: 'official_news_unavailable' });
  }
});

app.post('/api/assistant', async (req, res) => {
  const token = req.header('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) {
    res.status(401).json({ error: 'authentication_required' });
    return;
  }

  let uid: string | null;
  try {
    uid = await verifyFirebaseIdToken(token);
  } catch (error) {
    console.error('Firebase token validation failed:', error);
    res.status(503).json({ error: 'authentication_service_unavailable' });
    return;
  }
  if (!uid) {
    res.status(401).json({ error: 'invalid_session' });
    return;
  }
  if (!isWithinAssistantRateLimit(uid)) {
    res.status(429).json({ error: 'rate_limit_exceeded' });
    return;
  }

  const message = req.body?.message;
  const language = req.body?.language;
  if (language !== undefined && language !== 'fr' && language !== 'en') {
    res.status(400).json({ error: 'invalid_language' });
    return;
  }
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) {
    res.status(400).json({ error: 'invalid_message' });
    return;
  }
  const profile = req.body?.profile && typeof req.body.profile === 'object'
    ? req.body.profile as AssistantProfile
    : {};
  const history = Array.isArray(req.body?.history)
    ? req.body.history.slice(-4).filter((entry: unknown): entry is AssistantHistoryItem =>
      Boolean(entry)
      && typeof entry === 'object'
      && ['user', 'assistant'].includes(String((entry as { role?: unknown }).role))
      && typeof (entry as { content?: unknown }).content === 'string'
      && (entry as { content: string }).content.length <= 2000)
    : [];

  try {
    res.json(await generateAssistantReply(message.trim(), profile, history, language === 'en' ? 'en' : 'fr'));
  } catch (error) {
    if (error instanceof Error && error.message === 'assistant_not_configured') {
      res.status(503).json({ error: error.message });
      return;
    }
    console.error('Assistant provider error:', error);
    res.status(502).json({ error: 'assistant_provider_error' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
