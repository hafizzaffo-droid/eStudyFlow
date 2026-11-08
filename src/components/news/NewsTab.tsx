import React, { useEffect, useState } from 'react';
import { 
  Newspaper, 
  ShieldCheck, 
  ExternalLink, 
  Calendar, 
  Tag, 
  Info, 
  AlertCircle,
  X,
  Search
} from 'lucide-react';
import { NewsItem } from '../../types';
import { useLanguage } from '../../context/LanguageContext';
import { hasDistinctArticleContent } from '../../services/newsContent';

const getCategoryLabel = (category: NewsItem['category'], language: 'fr' | 'en') => {
  if (language === 'fr') return category.replace('_', ' ').toUpperCase();
  const labels: Record<NewsItem['category'], string> = {
    all: 'All',
    titre_de_sejour: 'Residence permit',
    travail: 'Work',
    etudes: 'Studies',
    logement: 'Housing',
    caf: 'CAF',
    sante: 'Health',
    transport: 'Transport',
    vie_etudiante: 'Student life',
  };
  return labels[category];
};

export const NewsTab: React.FC = () => {
  const { language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unavailableSources, setUnavailableSources] = useState<string[]>([]);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [translationUnavailable, setTranslationUnavailable] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const refreshNews = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/news?lang=${language}`);
        if (!response.ok) throw new Error(`official_news_http_${response.status}`);
        const result = await response.json() as {
          items?: NewsItem[];
          updatedAt?: string;
          unavailableSources?: string[];
          isStale?: boolean;
          translationAvailable?: boolean;
        };
        if (!Array.isArray(result.items) || !result.updatedAt) {
          throw new Error('invalid_official_news_response');
        }
        if (!active) return;
        setNews(result.items);
        setSelectedArticle(current => current
          ? result.items?.find(item => item.id === current.id) ?? null
          : null);
        setUpdatedAt(result.updatedAt);
        setUnavailableSources(result.unavailableSources || []);
        setIsStale(Boolean(result.isStale));
        setTranslationUnavailable(language === 'en' && !result.translationAvailable);
        setError(null);
      } catch (cause) {
        console.error('Official news request failed:', cause);
        if (active) setError('Impossible de récupérer les actualités officielles.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void refreshNews();
    const interval = window.setInterval(() => void refreshNews(), 30 * 60 * 1000);
    window.addEventListener('focus', refreshNews);
    return () => {
      active = false;
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshNews);
    };
  }, [refreshKey, language]);

  const formatDate = (date: string) => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed)
      ? date
      : new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'medium' }).format(parsed);
  };

  const categories = [
    { id: 'all', label: 'Tous' },
    { id: 'titre_de_sejour', label: 'Titre de séjour' },
    { id: 'travail', label: 'Travail' },
    { id: 'etudes', label: 'Études' },
    { id: 'logement', label: 'Logement' },
    { id: 'caf', label: 'CAF' },
    { id: 'sante', label: 'Santé' },
    { id: 'transport', label: 'Transport' },
    { id: 'vie_etudiante', label: 'Vie étudiante' },
  ];

  const filteredNews = news.filter(item => {
    if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-5 pb-24 animate-in fade-in duration-200">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-[#17181C]">Actualités & Sources</h1>
        <p className="text-xs text-[#6B7280] mt-0.5">
          Informations administratives vérifiées auprès des autorités françaises
        </p>
      </div>

      {/* Official Sourcing Guarantee Banner */}
      <div className="p-3.5 rounded-2xl bg-white border border-gray-100 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-[#22A06B] font-bold">
          <ShieldCheck className="w-4 h-4 flex-shrink-0" />
          <span>Sources publiques officielles</span>
        </div>
        <span className="text-[11px] text-[#6B7280]">
          {updatedAt
            ? `Mis à jour ${formatDate(updatedAt)}${isStale ? ' · cache' : ''}`
            : 'Actualisation…'}
        </span>
      </div>

      {translationUnavailable && (
        <p role="status" className="text-xs text-[#6B7280]">
          La traduction anglaise est temporairement indisponible. Les articles restent en français, leur langue source officielle.
        </p>
      )}
      {unavailableSources.length > 0 && (
        <p role="status" className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Sources temporairement indisponibles : {unavailableSources.join(', ')}.
        </p>
      )}
      {error && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
          <p role="alert">{error}</p>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              setRefreshKey(key => key + 1);
            }}
            className="shrink-0 font-bold text-[#0045F9]"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
        <input
          type="text"
          placeholder="Rechercher une actualité ou démarche..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-white rounded-xl border border-gray-200 text-xs focus:outline-hidden focus:border-[#0045F9]"
        />
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? 'bg-[#0045F9] text-white shadow-xs'
                : 'bg-white text-[#6B7280] border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* News Articles Feed */}
      <div className="space-y-3">
        {loading && <p className="py-8 text-center text-xs text-[#6B7280]">Chargement des actualités…</p>}
        {filteredNews.map(item => (
          <button
            type="button"
            key={item.id}
            onClick={() => setSelectedArticle(item)}
            className="block w-full rounded-3xl border border-gray-100 bg-white p-5 text-left shadow-xs transition hover:border-gray-200 group"
          >
            <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 ${
                item.importance === 'urgent'
                  ? 'bg-red-100 text-[#E5484D]'
                  : item.importance === 'recommended'
                  ? 'bg-blue-100 text-[#0045F9]'
                  : 'bg-gray-100 text-[#6B7280]'
              }`}>
                {item.importance === 'urgent' && <AlertCircle className="w-3 h-3" />}
                {item.importance === 'urgent' ? 'Important' : 'Information'}
              </span>

              <span className="text-[11px] text-gray-400 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {formatDate(item.date)}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#17181C] group-hover:text-[#0045F9] transition leading-snug">
              {item.title}
            </h3>

            <p className="text-xs text-[#6B7280] mt-1.5 line-clamp-2 leading-relaxed">
              {item.summary}
            </p>

            <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-100 text-[11px]">
              <div className="flex items-center gap-1 text-[#22A06B] font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{item.sourceName}</span>
              </div>
              <span className="text-gray-400">Vérifié le {formatDate(item.lastVerified)}</span>
            </div>
          </button>
        ))}
        {!loading && filteredNews.length === 0 && (
          <p className="rounded-2xl bg-white p-6 text-center text-xs text-[#6B7280]">
            Aucune actualité officielle ne correspond à ta recherche.
          </p>
        )}
      </div>

      {/* Article Detail Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto ios-scroll animate-in zoom-in-95">
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-[#0045F9] text-[10px] font-bold">
                {getCategoryLabel(selectedArticle.category, language)}
              </span>
              <span className="text-xs text-gray-400">{formatDate(selectedArticle.date)}</span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-[#17181C] leading-snug mb-3">
              {selectedArticle.title}
            </h2>

            <div className="p-3 bg-[#F8F9FB] rounded-xl text-xs text-[#17181C] font-semibold mb-4 leading-relaxed">
              {selectedArticle.summary}
            </div>

            {hasDistinctArticleContent(selectedArticle.summary, selectedArticle.content) && (
              <div className="text-xs text-[#6B7280] leading-relaxed space-y-3 mb-6">
                <p>{selectedArticle.content}</p>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-green-50 border border-green-200 flex items-center justify-between gap-3 text-xs mb-4">
              <div>
                <div className="font-bold text-green-900 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
                  Source certifiée
                </div>
                <div className="text-[11px] text-green-800">{selectedArticle.sourceName}</div>
              </div>
              <span className="text-[10px] text-green-700">Dernière vérification : {formatDate(selectedArticle.lastVerified)}</span>
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                Fermer
              </button>
              <a
                href={selectedArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-4 py-2 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-xs font-bold transition shadow-xs"
              >
                <span>Accéder au site officiel</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
