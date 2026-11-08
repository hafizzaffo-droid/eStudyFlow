import React, { useEffect, useState } from 'react';
import { 
  Calendar, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  ChevronUp,
  Clock, 
  Briefcase,
  Newspaper,
  ShieldCheck,
  ExternalLink,
  AlertCircle,
  X,
  Search
} from 'lucide-react';
import { AssistantRobotIcon } from '../common/AssistantRobotIcon';
import { useAuth } from '../../context/AuthContext';
import { computePermitStatus, getCurrentYearWorkHours } from '../../services/rulesEngine';
import { rankNewsForProfile } from '../../services/newsRelevance';
import { COUNTRIES } from '../../data/referenceData';
import { NewsItem } from '../../types';
import { NavTab } from '../layout/BottomNav';
import { useLanguage } from '../../context/LanguageContext';
import { hasDistinctArticleContent } from '../../services/newsContent';

interface DashboardTabProps {
  onNavigateTab: (tab: NavTab) => void;
  onOpenCalendar: () => void;
  onOpenDocuments: () => void;
  onOpenProfile: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ 
  onNavigateTab, 
  onOpenCalendar, 
  onOpenDocuments,
  onOpenProfile,
}) => {
  const { profile, tasks, workLogs, user } = useAuth();
  const { language } = useLanguage();

  // News section state
  const [selectedNewsCategory, setSelectedNewsCategory] = useState<string>('all');
  const [newsSearchQuery, setNewsSearchQuery] = useState('');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [showAllNews, setShowAllNews] = useState(false);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [newsUpdatedAt, setNewsUpdatedAt] = useState<string | null>(null);
  const [unavailableNewsSources, setUnavailableNewsSources] = useState<string[]>([]);
  const [newsStale, setNewsStale] = useState(false);
  const [newsTranslationUnavailable, setNewsTranslationUnavailable] = useState(false);
  const [newsRefreshKey, setNewsRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;
    const refreshNews = async () => {
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
        setNewsUpdatedAt(result.updatedAt);
        setUnavailableNewsSources(result.unavailableSources || []);
        setNewsStale(Boolean(result.isStale));
        setNewsTranslationUnavailable(language === 'en' && !result.translationAvailable);
        setNewsError(null);
      } catch (error) {
        console.error('Official news request failed:', error);
        if (active) setNewsError('Impossible de récupérer les actualités officielles. Vérifie ta connexion puis réessaie.');
      } finally {
        if (active) setNewsLoading(false);
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
  }, [newsRefreshKey, language]);

  if (!profile) return null;

  // Account owner's name / first name (cleans parentheses e.g. "Hafiz (Bénin)" -> "Hafiz")
  const userGreetingName = (profile?.displayName || user?.displayName || '')
    .replace(/\s*\([^)]*\)/g, '')
    .trim() || profile.username || '';

  const isEU = COUNTRIES.some(country => country.name === profile.nationality && country.isEU)
    || profile.visaType === 'Passeport européen / citoyen UE';
  const permitStatus = computePermitStatus(profile.permitExpiryDate, isEU);

  // Next critical / todo task
  const pendingTasks = tasks.filter(t => t.status !== 'completed');
  const nextTask = pendingTasks.find(t => t.isUrgent) || pendingTasks[0] || tasks[0];

  // Completed tasks count & percentage
  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const totalTasksCount = tasks.length;
  const progressRatio = totalTasksCount > 0 ? completedTasksCount / totalTasksCount : 0;
  const circleCircumference = 2 * Math.PI * 30; // r = 30
  const circleOffset = circleCircumference - (circleCircumference * progressRatio);

  // Total work hours
  const totalHoursWorked = getCurrentYearWorkHours(workLogs);

  // News categories & filter
  const newsCategories = [
    { id: 'all', label: 'Tous' },
    { id: 'titre_de_sejour', label: 'Titre de séjour' },
    { id: 'travail', label: 'Travail' },
    { id: 'caf', label: 'CAF' },
    { id: 'sante', label: 'Santé' },
    { id: 'etudes', label: 'Études' },
  ];

  const profileNews = rankNewsForProfile(news, profile);
  const filteredNews = profileNews.filter(item => {
    if (selectedNewsCategory !== 'all' && item.category !== selectedNewsCategory) return false;
    if (newsSearchQuery.trim()) {
      const q = newsSearchQuery.toLowerCase();
      return item.title.toLowerCase().includes(q) || item.summary.toLowerCase().includes(q);
    }
    return true;
  });

  const displayedNews = showAllNews ? filteredNews : filteredNews.slice(0, 3);
  const formattedNewsDate = (date: string) => {
    const parsed = Date.parse(date);
    return Number.isNaN(parsed)
      ? date
      : new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }).format(parsed);
  };

  return (
    <div className="space-y-4 pb-24 animate-in fade-in duration-200 max-w-lg mx-auto">
      
      {/* ================= GREETING HEADER ================= */}
      <div className="pt-1">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#17181C] tracking-tight">
          Bonjour{userGreetingName ? ` ${userGreetingName}` : ''} 👋
        </h1>
        <p className="text-xs sm:text-sm text-[#6B7280] mt-0.5">
          Voici ce qui compte pour toi aujourd'hui.
        </p>
      </div>

      {(!profile.nationality || !profile.city || profile.visaType === 'Je ne sais pas') && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
          <h2 className="text-sm font-bold text-[#17181C]">Complète ta situation réelle</h2>
          <p className="mt-1 text-xs text-[#6B7280]">Ajoute ta nationalité, ta ville et ton statut pour générer tes démarches personnalisées.</p>
          <button onClick={onOpenProfile} className="mt-3 rounded-xl bg-[#0045F9] px-4 py-2 text-xs font-bold text-white">
            Renseigner mon profil
          </button>
        </div>
      )}

      {/* ================= CARTE 1 : MON PARCOURS ================= */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div className="text-xs font-bold text-[#17181C] mb-3">Mon parcours</div>
        
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Circular Progress Ring */}
          <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 76 76">
              <circle 
                cx="38" 
                cy="38" 
                r="30" 
                stroke="#E5E7EB" 
                strokeWidth="6" 
                fill="none" 
              />
              <circle
                cx="38"
                cy="38"
                r="30"
                stroke="#0045F9"
                strokeWidth="6"
                strokeDasharray={circleCircumference}
                strokeDashoffset={circleOffset}
                strokeLinecap="round"
                fill="none"
                className="transition-all duration-700 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-sm sm:text-base font-extrabold text-[#17181C] leading-none">
                {completedTasksCount} / {totalTasksCount}
              </span>
              <span className="text-[9px] text-[#6B7280] mt-0.5">terminées</span>
            </div>
          </div>

          {/* Text & Link */}
          <div className="flex-1 min-w-0">
            <div className="font-extrabold text-[#17181C] text-sm sm:text-base leading-snug">
              {totalTasksCount ? `${completedTasksCount} démarches sur ${totalTasksCount} terminées` : 'Aucune démarche personnalisée pour le moment'}
            </div>
            <p className="text-xs text-[#6B7280] mt-1">
              {totalTasksCount && completedTasksCount >= totalTasksCount
                ? 'Toutes tes démarches sont terminées.'
                : 'Ta progression est calculée à partir de tes démarches enregistrées.'}
            </p>
            <button
              onClick={() => onNavigateTab('tasks')}
              className="mt-2.5 text-xs font-bold text-[#0045F9] hover:underline flex items-center gap-1 group cursor-pointer"
            >
              <span>Continuer mon parcours</span>
              <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </div>

      {/* ================= CARTE 2 : MA PROCHAINE DÉMARCHE ================= */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs">
        <div className="flex items-start gap-3.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0 mt-0.5">
            <FileText className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="text-[11px] text-[#6B7280] block mb-0.5">Ma prochaine démarche</span>
            <h3 className="text-base font-bold text-[#17181C] leading-snug">
              {nextTask ? nextTask.title : 'Aucune démarche enregistrée'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-1">
              {nextTask?.shortDescription || 'Renseigne ton profil pour obtenir des démarches adaptées.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigateTab('tasks')}
          className="w-full py-3 px-4 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] active:scale-[0.99] text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
        >
          <span>Voir ma démarche</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* ================= CARTE 3 : PROCHAINE ÉCHÉANCE ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xs text-[#6B7280]">Prochaine échéance :</div>
            <div className="text-sm font-extrabold text-red-600 truncate">
              {isEU ? 'Citoyen européen' : profile.permitExpiryDate ? permitStatus.statusText : 'Échéance à renseigner'}
            </div>
          </div>
        </div>
        <button
          onClick={onOpenCalendar}
          className="shrink-0 px-3 py-1.5 rounded-full bg-[#EBF0FF] text-[#0045F9] hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
        >
          <span>Voir le calendrier</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <button
        type="button"
        onClick={() => onNavigateTab('jobs')}
        className="w-full rounded-2xl border border-gray-100 bg-white p-4 text-left shadow-xs transition hover:border-blue-200 hover:bg-blue-50/30"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#EBF0FF] text-[#0045F9]">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-bold text-[#17181C]">Emploi étudiant</div>
            <div className="text-xs text-[#6B7280]">
              {isEU
                ? `${totalHoursWorked} h suivies cette année`
                : `${totalHoursWorked} h suivies sur ${profile.annualWorkHoursLimit || 964} h`}
            </div>
          </div>
          <span className="flex items-center gap-1 text-xs font-bold text-[#0045F9]">
            <Clock className="h-3.5 w-3.5" />
            Voir
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </button>

      {/* ================= CARTE 4 : INFOS "ACTUALITÉS ET SOURCES" ================= */}
      <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-xs space-y-4">
        {/* Section Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0">
              <Newspaper className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#17181C] leading-tight">
                Actualités & sources officielles
              </h2>
              <p className="text-[11px] text-[#6B7280] mt-0.5">
                Informations récentes classées selon ta situation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigateTab('news')}
            className="shrink-0 text-xs font-bold text-[#0045F9] hover:underline"
          >
            Toutes
          </button>
        </div>

        {/* Guarantee Banner */}
        <div className="p-3 rounded-2xl bg-emerald-50/80 border border-emerald-100 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-[#22A06B] font-bold">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>Sources officielles uniquement</span>
          </div>
          <span className="text-[10px] text-[#6B7280] font-medium hidden xs:inline text-right">
            {newsLoading && !news.length
              ? 'Actualisation…'
              : `${profileNews.length} actualité${profileNews.length > 1 ? 's' : ''} pour ton profil`}
            {newsUpdatedAt && (
              <span className="mt-0.5 block">
                Mis à jour {new Intl.DateTimeFormat(language === 'en' ? 'en-GB' : 'fr-FR', { dateStyle: 'short', timeStyle: 'short' }).format(Date.parse(newsUpdatedAt))}
                {newsStale ? ' • données en cache' : ''}
              </span>
            )}
          </span>
        </div>
        {newsTranslationUnavailable && (
          <p role="status" className="text-[11px] text-[#6B7280]">
            Les articles sont affichés en français, leur langue source officielle.
          </p>
        )}

        {(newsError || unavailableNewsSources.length > 0) && (
          <div className="flex items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] text-amber-900">
            <p role={newsError ? 'alert' : 'status'}>
              {newsError || `Certaines sources officielles sont temporairement indisponibles : ${unavailableNewsSources.join(', ')}.`}
            </p>
            {newsError && (
              <button
                type="button"
                onClick={() => {
                  setNewsLoading(true);
                  setNewsRefreshKey(key => key + 1);
                }}
                className="shrink-0 font-bold text-[#0045F9]"
              >
                Réessayer
              </button>
            )}
          </div>
        )}

        {/* Search input */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher une actualité ou démarche..."
            value={newsSearchQuery}
            onChange={e => setNewsSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-[#F8F9FB] rounded-xl border border-gray-200 text-xs text-[#17181C] placeholder:text-gray-400 focus:outline-hidden focus:border-[#0045F9] transition"
          />
          {newsSearchQuery && (
            <button
              onClick={() => setNewsSearchQuery('')}
              className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
          {newsCategories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedNewsCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition cursor-pointer ${
                selectedNewsCategory === cat.id
                  ? 'bg-[#0045F9] text-white shadow-xs'
                  : 'bg-[#F8F9FB] text-[#6B7280] border border-gray-100 hover:bg-gray-100'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* News Items List */}
        <div className="space-y-2.5">
          {newsLoading && !news.length ? (
            <p className="p-4 text-center text-xs text-[#6B7280]">Chargement des actualités officielles…</p>
          ) : displayedNews.length > 0 ? (
            displayedNews.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className="p-3.5 rounded-2xl bg-[#F8F9FB] border border-gray-100/90 hover:border-[#0045F9]/30 hover:bg-blue-50/20 transition cursor-pointer group space-y-1.5"
              >
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold flex items-center gap-1 ${
                    item.importance === 'urgent'
                      ? 'bg-red-100 text-[#E5484D]'
                      : item.importance === 'recommended'
                      ? 'bg-[#EBF0FF] text-[#0045F9]'
                      : 'bg-gray-200/70 text-[#4B5563]'
                  }`}>
                    {item.importance === 'urgent' && <AlertCircle className="w-2.5 h-2.5" />}
                    {item.importance === 'urgent' ? 'Important' : 'Information'}
                  </span>

                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-2.5 h-2.5" />
                    {formattedNewsDate(item.date)}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-[#17181C] group-hover:text-[#0045F9] transition leading-snug">
                  {item.title}
                </h3>

                <p className="text-[11px] text-[#6B7280] line-clamp-2 leading-relaxed">
                  {item.summary}
                </p>

                <div className="flex items-center justify-between pt-2 border-t border-gray-200/50 text-[10px]">
                  <div className="flex items-center gap-1 text-[#22A06B] font-semibold truncate">
                    <ShieldCheck className="w-3 h-3 shrink-0" />
                    <span className="truncate">{item.sourceName}</span>
                  </div>
                  <span className="text-[#0045F9] font-bold shrink-0 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    Lire <ChevronRight className="w-3 h-3 inline" />
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="p-4 rounded-2xl bg-[#F8F9FB] text-center text-xs text-[#6B7280]">
              {newsError
                ? 'Les actualités officielles sont indisponibles pour le moment.'
                : 'Aucune actualité officielle récente ne correspond à ton profil ou à cette recherche.'}
            </div>
          )}
        </div>

        {/* Expand / Show all button if more than 3 */}
        {filteredNews.length > 3 && (
          <button
            onClick={() => setShowAllNews(!showAllNews)}
            className="w-full py-2 px-3 rounded-xl bg-[#F8F9FB] hover:bg-gray-100 text-[#0045F9] text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>{showAllNews ? 'Réduire la liste' : `Voir les ${filteredNews.length} actualités`}</span>
            {showAllNews ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        )}
      </div>

      {/* ================= CARTE 5 : UNE QUESTION ? (DERNIÈRE POSITION) ================= */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-xs flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <AssistantRobotIcon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#17181C]">Une question ?</div>
            <div className="text-xs text-[#6B7280] truncate">
              eStudy AI t'aide à comprendre tes démarches.
            </div>
          </div>
        </div>
        <button
          onClick={() => onNavigateTab('ai')}
          className="shrink-0 text-xs font-bold text-[#0045F9] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Poser une question</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ================= ARTICLE DETAIL MODAL ================= */}
      {selectedArticle && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedArticle(null)}
        >
          <div 
            className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-7 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto ios-scroll animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedArticle(null)}
              className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className="px-2.5 py-0.5 rounded-full bg-[#EBF0FF] text-[#0045F9] text-[10px] font-bold">
                {selectedArticle.category.replace('_', ' ').toUpperCase()}
              </span>
              <span className="text-xs text-gray-400">{formattedNewsDate(selectedArticle.date)}</span>
            </div>

            <h2 className="text-lg md:text-xl font-bold text-[#17181C] leading-snug mb-3">
              {selectedArticle.title}
            </h2>

            <div className="p-3 bg-[#F8F9FB] rounded-xl text-xs text-[#17181C] font-semibold mb-4 leading-relaxed border border-gray-100">
              {selectedArticle.summary}
            </div>

            {hasDistinctArticleContent(selectedArticle.summary, selectedArticle.content) && (
              <div className="text-xs text-[#4B5563] leading-relaxed space-y-3 mb-6">
                <p>{selectedArticle.content}</p>
              </div>
            )}

            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs mb-4">
              <div>
                <div className="font-bold text-emerald-950 flex items-center gap-1">
                  <ShieldCheck className="w-4 h-4 text-[#22A06B]" />
                  Source certifiée
                </div>
                <div className="text-[11px] text-emerald-800">{selectedArticle.sourceName}</div>
              </div>
              <span className="text-[10px] text-emerald-700">Vérifié le {selectedArticle.lastVerified}</span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                onClick={() => setSelectedArticle(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100 cursor-pointer"
              >
                Fermer
              </button>
              <a
                href={selectedArticle.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#0045F9] hover:bg-[#0036C8] text-white text-xs font-bold transition shadow-xs cursor-pointer"
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
