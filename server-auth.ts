import firebaseConfig from './firebase-applet-config.json' with { type: 'json' };

const requestWindows = new Map<string, { startedAt: number; count: number }>();

export async function verifyFirebaseIdToken(token: string): Promise<string | null> {
  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${firebaseConfig.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: token }),
    },
  );
  if (!response.ok) return null;
  const result = await response.json() as { users?: Array<{ localId?: string }> };
  return result.users?.[0]?.localId || null;
}

export function isWithinAssistantRateLimit(uid: string): boolean {
  const now = Date.now();
  const window = requestWindows.get(uid);
  if (!window || now - window.startedAt >= 60_000) {
    requestWindows.set(uid, { startedAt: now, count: 1 });
    if (requestWindows.size > 10_000) {
      for (const [key, value] of requestWindows) {
        if (now - value.startedAt >= 60_000) requestWindows.delete(key);
      }
    }
    return true;
  }
  if (window.count >= 20) return false;
  window.count += 1;
  return true;
}
