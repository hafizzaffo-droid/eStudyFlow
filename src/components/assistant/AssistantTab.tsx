import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  User, 
  ExternalLink, 
  ShieldCheck, 
  RotateCcw, 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { collection, deleteDoc, doc, getDocs, onSnapshot, orderBy, query, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { AssistantRobotIcon } from '../common/AssistantRobotIcon';
import { useLanguage } from '../../context/LanguageContext';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  sources?: { title: string; url: string }[];
  timestamp: string;
}

export const AssistantTab: React.FC = () => {
  const { profile, user } = useAuth();
  const { language } = useLanguage();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const initialGreeting: ChatMessage = {
    id: 'welcome',
    sender: 'assistant',
    text: language === 'en'
      ? `Hello ${profile?.displayName || profile?.username || ''}! 👋

I’m **eStudy AI**, your personal assistant for navigating procedures in France.

Your profile information is used to tailor answers:
- Nationality: **${profile?.nationality || 'not provided'}**
- Status: **${profile?.visaType || 'not provided'}**
- City: **${profile?.city || 'not provided'}**
- Permit expiry: **${profile?.permitExpiryDate || 'not provided'}**

Ask about your residence permit, CAF, health insurance, work, or studies. Verify important information with official sources.`
      : `Bonjour ${profile?.displayName || profile?.username || ''} ! 👋

Je suis **eStudy AI**, ton assistant personnel pour toutes tes démarches en France.

Les informations de ton profil sont utilisées pour contextualiser les réponses :
- Nationalité : **${profile?.nationality || 'non renseignée'}**
- Statut : **${profile?.visaType || 'non renseigné'}**
- Ville : **${profile?.city || 'non renseignée'}**
- Échéance de titre : **${profile?.permitExpiryDate || 'non renseignée'}**

Pose une question sur ton titre de séjour, la CAF, l’Assurance Maladie, le travail ou tes études. Vérifie les informations importantes auprès des sources officielles.`,
    sources: [
      { title: 'Service-Public.fr', url: 'https://www.service-public.fr/' },
      { title: 'Campus France', url: 'https://www.campusfrance.org/' },
      { title: 'ANEF Démarches en ligne', url: 'https://administration-etrangers-en-france.interieur.gouv.fr/' },
    ],
    timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
  };

  useEffect(() => {
    if (!user) return;
    const messagesQuery = query(
      collection(db, 'users', user.uid, 'assistantMessages'),
      orderBy('createdAt', 'asc'),
    );
    return onSnapshot(messagesQuery, snapshot => {
      if (snapshot.empty) {
        setMessages([initialGreeting]);
      } else {
        setMessages(snapshot.docs.map(item => item.data() as ChatMessage));
      }
      setHistoryLoaded(true);
      setChatError(null);
    }, error => {
      console.error('Assistant history listener error:', error);
      setMessages([initialGreeting]);
      setHistoryLoaded(true);
      setChatError('Impossible de charger ton historique de conversation.');
    });
  }, [user, profile, language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const quickQuestions = language === 'en' ? [
    'Can I work with my residence permit?',
    'When should I renew my permit?',
    'How does CAF housing benefit work?',
    'How do I register for health insurance?',
    'I have just arrived in France. What should I do?',
    'Can I do a work-study programme?',
    'What should I do after my Master’s degree?',
  ] : [
    'Est-ce que je peux travailler avec mon titre ?',
    'Quand dois-je renouveler mon titre ?',
    'Comment fonctionne la CAF (APL) ?',
    'Comment m’inscrire à l’Assurance Maladie ?',
    'Je viens d’arriver en France, que dois-je faire ?',
    'Puis-je faire une alternance ?',
    'Que dois-je faire après mon Master ?',
  ];

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || inputText.trim();
    if (!text || isLoading || !historyLoaded || !user) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
    };

    setInputText('');
    setIsLoading(true);
    setChatError(null);

    try {
      await setDoc(doc(db, 'users', user.uid, 'assistantMessages', userMsg.id), {
        ...userMsg,
        createdAt: Date.now(),
      });
      setMessages(prev => [...prev, userMsg]);
      const token = await user.getIdToken();
      const response = await fetch('/api/assistant', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          message: text,
          profile,
          language,
          history: messages.slice(-4).map(m => ({ role: m.sender, content: m.text })),
        }),
      });

      const data = await response.json() as { text?: string; sources?: ChatMessage['sources']; error?: string };
      if (!response.ok) throw new Error(data.error || 'assistant_request_failed');

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        sender: 'assistant',
        text: data.text || '',
        sources: data.sources || [],
        timestamp: new Date().toLocaleTimeString(language === 'en' ? 'en-GB' : 'fr-FR', { hour: '2-digit', minute: '2-digit' }),
      };
      if (!botMsg.text) throw new Error('assistant_empty_response');
      await setDoc(doc(db, 'users', user.uid, 'assistantMessages', botMsg.id), {
        ...botMsg,
        createdAt: Date.now(),
      });
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.error('Assistant call failed:', error);
      const code = error instanceof Error ? error.message : 'assistant_request_failed';
      setChatError(code === 'assistant_not_configured'
        ? 'Le service IA n’est pas configuré. Ajoute GEMINI_API_KEY au serveur.'
        : code === 'rate_limit_exceeded'
        ? 'Limite de requêtes atteinte. Réessaie dans une minute.'
        : 'Le service IA est indisponible ou la conversation n’a pas pu être sauvegardée. Réessaie.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = async () => {
    if (!user || isResetting) return;
    setIsResetting(true);
    setChatError(null);
    try {
      const snapshot = await getDocs(collection(db, 'users', user.uid, 'assistantMessages'));
      await Promise.all(snapshot.docs.map(item => deleteDoc(item.ref)));
      setMessages([initialGreeting]);
    } catch (error) {
      console.error('Assistant history reset failed:', error);
      setChatError('Impossible d’effacer la conversation. Réessaie.');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100dvh-150px)] max-h-[850px] pb-3 animate-in fade-in duration-200">
      
      <div className="mb-2 flex flex-shrink-0 justify-end">
        <button
          onClick={() => void handleReset()}
          disabled={isResetting || !historyLoaded}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition disabled:opacity-50"
          title="Réinitialiser la conversation"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
      <p className="mb-2 text-[10px] text-[#6B7280]">
        L’historique est sauvegardé dans ton compte. Évite de saisir des informations sensibles.
      </p>
      {chatError && <p role="alert" className="mb-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">{chatError}</p>}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 mb-3">
        {!historyLoaded && <p className="py-8 text-center text-xs text-[#6B7280]">Chargement de la conversation…</p>}
        {messages.map(msg => {
          const isBot = msg.sender === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isBot ? 'justify-start' : 'justify-end'}`}
            >
              {isBot && (
                <div className="w-8 h-8 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AssistantRobotIcon className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 text-xs leading-relaxed ${
                isBot
                  ? 'bg-white border border-gray-100 text-[#17181C] shadow-xs'
                  : 'bg-[#0045F9] text-white font-medium shadow-md shadow-blue-500/10'
              }`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Sources if present */}
                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t border-gray-100 text-[11px]">
                    <div className="font-bold text-[#22A06B] flex items-center gap-1 mb-1.5">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Sources officielles citées :</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((s, idx) => (
                        <a
                          key={idx}
                          href={s.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold border border-gray-200 transition"
                        >
                          <span className="truncate max-w-[180px]">{s.title}</span>
                          <ExternalLink className="w-2.5 h-2.5 text-gray-400" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div className={`text-[10px] mt-1 text-right ${isBot ? 'text-gray-400' : 'text-white/70'}`}>
                  {msg.timestamp}
                </div>
              </div>

              {!isBot && (
                <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-700 flex items-center justify-center flex-shrink-0 mt-0.5 font-bold text-xs">
                  {(profile?.displayName || profile?.username || 'U').charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          );
        })}

        {isLoading && (
          <div className="flex items-start gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center flex-shrink-0">
              <AssistantRobotIcon className="w-4 h-4" />
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl p-3.5 shadow-xs flex items-center gap-2 text-xs text-[#6B7280]">
              <span className="w-2 h-2 rounded-full bg-[#0045F9] animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-[#0045F9] animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-[#0045F9] animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1">eStudy AI analyse tes textes officiels...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Questions */}
      {messages.length <= 2 && (
        <div className="mb-2 overflow-x-auto pb-1 no-scrollbar flex items-center gap-1.5 flex-shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-2.5 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-[#0045F9] hover:bg-[#EBF0FF] text-[11px] font-semibold text-[#17181C] whitespace-nowrap transition"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={e => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center gap-2 flex-shrink-0"
      >
        <div className="relative flex-1">
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Pose ta question sur ta vie étudiante en France..."
            className="w-full pl-4 pr-10 py-3 rounded-2xl bg-white border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9] shadow-xs"
          />
        </div>
        <button
          type="submit"
          disabled={!inputText.trim() || isLoading || !historyLoaded}
          className="w-11 h-11 rounded-2xl bg-[#0045F9] hover:bg-[#0036C8] disabled:opacity-40 text-white flex items-center justify-center transition shadow-md shadow-blue-500/20 active:scale-95 flex-shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
};
