import { GoogleGenAI } from '@google/genai';

export interface AssistantHistoryItem {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantProfile {
  nationality?: unknown;
  visaType?: unknown;
  city?: unknown;
  permitExpiryDate?: unknown;
  school?: unknown;
  studyLevel?: unknown;
}

export async function generateAssistantReply(
  message: string,
  profile: AssistantProfile,
  history: AssistantHistoryItem[],
  language: 'fr' | 'en' = 'fr',
): Promise<{ text: string; sources: Array<{ title: string; url: string }> }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('assistant_not_configured');

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = language === 'en'
    ? `You are eStudy AI, a friendly and practical administrative guidance assistant for international students in France. Answer in clear, natural English using a warm, respectful tone. Prefer short paragraphs, explain unfamiliar terms, and give concrete next steps when useful. Do not present yourself as a lawyer or government authority.
User profile: nationality ${safeText(profile.nationality)}, permit ${safeText(profile.visaType)}, city ${safeText(profile.city)}, expiry ${safeText(profile.permitExpiryDate)}, institution ${safeText(profile.school)}, level ${safeText(profile.studyLevel)}.
Do not invent rules, deadlines, required documents, or decisions. Distinguish general information from details that need confirmation. Prioritize official French sources and explain when information should be confirmed with the authorities. Keep official source names and links unchanged.`
    : `Tu es eStudy AI, un assistant bienveillant et pratique pour aider les étudiants internationaux à comprendre leurs démarches en France. Réponds en français naturel, en tutoyant la personne et sans jargon inutile. Fais des paragraphes courts, explique les termes administratifs et propose des prochaines étapes concrètes quand c’est utile. Ne te présente pas comme avocat ou comme une administration.
Profil communiqué par l’utilisateur : nationalité ${safeText(profile.nationality)}, titre ${safeText(profile.visaType)}, ville ${safeText(profile.city)}, expiration ${safeText(profile.permitExpiryDate)}, établissement ${safeText(profile.school)}, niveau ${safeText(profile.studyLevel)}.
N’invente pas de règle, de délai, de pièce ou de décision. Distingue les généralités des informations à confirmer pour la situation de la personne. Priorise les sources officielles françaises et précise quand l’information doit être vérifiée auprès de l’administration.`;
  const contents = [...history.slice(-4), { role: 'user' as const, content: message }]
    .map(item => `${item.role === 'assistant' ? 'Assistant' : language === 'en' ? 'Student' : 'Étudiant'}: ${item.content}`)
    .join('\n');
  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    contents,
    config: { systemInstruction, tools: [{ googleSearch: {} }] },
  });
  const text = response.text?.trim();
  if (!text) throw new Error('assistant_empty_response');

  const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = chunks.flatMap((chunk: unknown) => {
    if (!chunk || typeof chunk !== 'object' || !('web' in chunk)) return [];
    const web = (chunk as { web?: { uri?: string; title?: string } }).web;
    return web?.uri && isOfficialSource(web.uri)
      ? [{ title: web.title || 'Source officielle', url: web.uri }]
      : [];
  }).slice(0, 4);
  return { text, sources };
}

function safeText(value: unknown): string {
  return typeof value === 'string' ? value.slice(0, 120) : 'non renseigné';
}

function isOfficialSource(uri: string): boolean {
  try {
    const host = new URL(uri).hostname.toLowerCase();
    return [
      'service-public.fr',
      'interieur.gouv.fr',
      'campusfrance.org',
      'etudiant.gouv.fr',
      'ameli.fr',
      'caf.fr',
      'francetravail.fr',
      'france-visas.gouv.fr',
    ].some(domain => host === domain || host.endsWith(`.${domain}`));
  } catch {
    return false;
  }
}
