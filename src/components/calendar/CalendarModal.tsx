import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calendar, 
  Clock, 
  Download, 
  AlertCircle, 
  CheckCircle2, 
  Check, 
  CalendarCheck, 
  FileText, 
  ShieldAlert, 
  ChevronRight,
  Info,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { computePermitStatus } from '../../services/rulesEngine';
import { COUNTRIES } from '../../data/referenceData';
import { useLanguage } from '../../context/LanguageContext';

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = 'all' | 'urgent' | 'prefecture' | 'tasks';

interface CalendarEventItem {
  id: string;
  title: string;
  dateStr?: string;
  formattedDate: string;
  daysRemaining: number | null;
  category: 'titre' | 'anef' | 'demarche' | 'tache';
  categoryLabel: string;
  color: 'red' | 'amber' | 'blue' | 'green';
  description: string;
  actionHint?: string;
  isUrgent?: boolean;
  isCompleted?: boolean;
  taskId?: string;
}

const formatDate = (dateStr?: string, fullMonth = false, locale = 'fr-FR'): string => {
  if (!dateStr) return '';
  if (!/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return dateStr;
  const parts = dateStr.split('-');
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const day = parseInt(parts[2], 10);
  const d = new Date(year, month, day);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString(locale, {
    day: 'numeric',
    month: fullMonth ? 'long' : 'short',
    year: 'numeric'
  });
};

// Helper: Calculate diff in days
const computeDaysDiff = (dateStr?: string): number | null => {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}/.test(dateStr)) return null;
  const parts = dateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

// Helper: Format offset date string (YYYY-MM-DD)
const getOffsetDateStr = (baseDateStr: string, daysOffset: number): string => {
  if (!baseDateStr || !/^\d{4}-\d{2}-\d{2}/.test(baseDateStr)) return '';
  const parts = baseDateStr.split('-');
  const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  d.setDate(d.getDate() + daysOffset);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

export const CalendarModal: React.FC<CalendarModalProps> = ({ isOpen, onClose }) => {
  const { profile, tasks, toggleTaskStatus } = useAuth();
  const { language } = useLanguage();
  const dateLocale = language === 'en' ? 'en-GB' : 'fr-FR';
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [exportFeedback, setExportFeedback] = useState<string | null>(null);

  const isEU = Boolean(
    COUNTRIES.some(country => country.name === profile?.nationality && country.isEU) ||
    profile?.visaType === 'Passeport européen / citoyen UE'
  );
  const permitStatus = computePermitStatus(profile?.permitExpiryDate || '', isEU);

  // Calculate ANEF window dates based on permit expiry (4 months = -120 days, 2 months = -60 days)
  const anefOpenDateStr = profile?.permitExpiryDate ? getOffsetDateStr(profile.permitExpiryDate, -120) : '';
  const anefLimitDateStr = profile?.permitExpiryDate ? getOffsetDateStr(profile.permitExpiryDate, -60) : '';

  // Build harmonized list of events
  const allEvents: CalendarEventItem[] = useMemo(() => {
    if (!profile) return [];
    const list: CalendarEventItem[] = [];

    // 1. Expiration Titre de séjour
    if (profile.permitExpiryDate && !isEU) {
      const days = permitStatus.daysRemaining;
      list.push({
        id: 'event-permit-expiry',
        title: 'Expiration de ton titre de séjour',
        dateStr: profile.permitExpiryDate,
        formattedDate: formatDate(profile.permitExpiryDate, true, dateLocale),
        daysRemaining: days,
        category: 'titre',
        categoryLabel: 'Titre de séjour',
        color: permitStatus.badgeColor,
        description: 'Date limite légale de validité de ton séjour en France.',
        actionHint: permitStatus.recommendedAction,
        isUrgent: permitStatus.isUrgent,
      });

      // 2. ANEF ouverture recommandée (4 mois avant)
      if (anefOpenDateStr) {
        const daysToOpen = computeDaysDiff(anefOpenDateStr);
        list.push({
          id: 'event-anef-open',
          title: 'Ouverture du dépôt ANEF (4 mois avant)',
          dateStr: anefOpenDateStr,
          formattedDate: formatDate(anefOpenDateStr, true, dateLocale),
          daysRemaining: daysToOpen,
          category: 'anef',
          categoryLabel: 'Renouvellement ANEF',
          color: daysToOpen !== null && daysToOpen <= 0 ? 'amber' : 'blue',
          description: 'Période recommandée pour déposer ta demande en ligne sans retard.',
          actionHint: 'Rassemble tes relevés de notes et justificatifs financiers.',
          isUrgent: daysToOpen !== null && daysToOpen <= 0 && permitStatus.daysRemaining <= 120,
        });
      }

      // 3. ANEF dernière limite sans pénalité (2 mois avant)
      if (anefLimitDateStr) {
        const daysToLimit = computeDaysDiff(anefLimitDateStr);
        list.push({
          id: 'event-anef-limit',
          title: 'Dernière limite ANEF (2 mois avant)',
          dateStr: anefLimitDateStr,
          formattedDate: formatDate(anefLimitDateStr, true, dateLocale),
          daysRemaining: daysToLimit,
          category: 'anef',
          categoryLabel: 'Délai d’urgence ANEF',
          color: daysToLimit !== null && daysToLimit <= 0 ? 'red' : 'amber',
          description: 'Délai préfectoral minimum pour instruire ton dossier avant l’échéance.',
          actionHint: 'Au-delà, risque de rupture temporaire de droits et taxe de retard.',
          isUrgent: daysToLimit !== null && daysToLimit <= 15,
        });
      }
    } else if (isEU) {
      list.push({
        id: 'event-eu-status',
        title: 'Statut Citoyen Union Européenne',
        dateStr: undefined,
        formattedDate: 'Dispense permanente',
        daysRemaining: null,
        category: 'titre',
        categoryLabel: 'Séjour UE',
        color: 'green',
        description: 'Dispense permanente de titre de séjour avec droit direct au travail.',
        actionHint: 'Conserve un passeport ou une carte d’identité européenne valide.',
      });
    }

    // 4. Tasks from user checklist with deadlines or whenToDo
    // Avoid duplicate of renewal task with same date as permit expiry to keep list clean
    tasks.forEach((t) => {
      // If it's the renewal task and we already have the specific permit events, mark its category clearly
      const hasDate = Boolean(t.dueDate);
      const days = hasDate ? computeDaysDiff(t.dueDate) : null;
      const isCompleted = t.status === 'completed';

      list.push({
        id: `event-task-${t.id}`,
        title: t.title,
        dateStr: t.dueDate,
        formattedDate: t.dueDate ? formatDate(t.dueDate, true, dateLocale) : (t.whenToDo || 'À planifier'),
        daysRemaining: days,
        category: t.category === 'before_arrival' || t.category === 'on_arrival' ? 'demarche' : 'tache',
        categoryLabel: t.category === 'before_arrival' ? 'Avant départ' : t.category === 'on_arrival' ? 'Arrivée' : 'Vie étudiante',
        color: isCompleted ? 'green' : t.isUrgent ? 'red' : 'blue',
        description: t.shortDescription,
        actionHint: t.whyImportant,
        isUrgent: t.isUrgent && !isCompleted,
        isCompleted,
        taskId: t.id,
      });
    });

    // Sort chronologically:
    // Urgents and items with numeric daysRemaining first (ascending), then items without specific dates, and completed at the bottom
    return list.sort((a, b) => {
      if (a.isCompleted && !b.isCompleted) return 1;
      if (!a.isCompleted && b.isCompleted) return -1;
      if (a.daysRemaining !== null && b.daysRemaining !== null) {
        return a.daysRemaining - b.daysRemaining;
      }
      if (a.daysRemaining !== null) return -1;
      if (b.daysRemaining !== null) return 1;
      return 0;
    });
  }, [profile, tasks, isEU, permitStatus, anefOpenDateStr, anefLimitDateStr, dateLocale]);

  // Filtered events
  const filteredEvents = useMemo(() => {
    switch (activeFilter) {
      case 'urgent':
        return allEvents.filter(e => e.isUrgent || (e.daysRemaining !== null && e.daysRemaining <= 30 && !e.isCompleted));
      case 'prefecture':
        return allEvents.filter(e => e.category === 'titre' || e.category === 'anef');
      case 'tasks':
        return allEvents.filter(e => e.category === 'demarche' || e.category === 'tache');
      default:
        return allEvents;
    }
  }, [allEvents, activeFilter]);

  // Classified sections for the 'all' view or filtered view
  const classifiedSections = useMemo(() => {
    const legalDeadlines = filteredEvents.filter(e => (e.category === 'titre' || e.category === 'anef') && !e.isCompleted);
    const pendingTasks = filteredEvents.filter(e => (e.category === 'demarche' || e.category === 'tache') && !e.isCompleted);
    const completedItems = filteredEvents.filter(e => e.isCompleted);

    return [
      {
        id: 'legal',
        title: 'Échéances administratives & séjour',
        count: legalDeadlines.length,
        items: legalDeadlines,
      },
      {
        id: 'tasks',
        title: 'Démarches d’installation & vie pratique',
        count: pendingTasks.length,
        items: pendingTasks,
      },
      {
        id: 'completed',
        title: 'Démarches validées',
        count: completedItems.length,
        items: completedItems,
      },
    ].filter(section => section.items.length > 0);
  }, [filteredEvents]);

  // Counts for filters
  const urgentCount = allEvents.filter(e => e.isUrgent || (e.daysRemaining !== null && e.daysRemaining <= 30 && !e.isCompleted)).length;
  const prefectureCount = allEvents.filter(e => e.category === 'titre' || e.category === 'anef').length;
  const tasksCount = allEvents.filter(e => e.category === 'demarche' || e.category === 'tache').length;

  // Complete Apple Calendar / Google Calendar .ics export
  const handleExportICS = () => {
    if (!profile) return;
    let icsEvents = '';

    // 1. Expiration du titre de séjour
    if (profile.permitExpiryDate && !isEU) {
      const cleanDate = profile.permitExpiryDate.replace(/-/g, '');
      icsEvents += `BEGIN:VEVENT
UID:estudyflow-permit-${profile.userId || 'user'}@estudyflow.fr
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${cleanDate}
DTEND;VALUE=DATE:${cleanDate}
SUMMARY:⚠️ Expiration Titre de séjour - eStudyFlow
DESCRIPTION:Date limite absolue de régularité de ton titre de séjour en France. Dépose ton renouvellement au moins 2 à 4 mois avant sur l'ANEF (https://administration-etrangers-en-france.interieur.gouv.fr).
BEGIN:VALARM
TRIGGER:-P60D
ACTION:DISPLAY
DESCRIPTION:Rappel eStudyFlow : Ton titre de séjour expire dans 60 jours. Dépose ton dossier ANEF !
END:VALARM
BEGIN:VALARM
TRIGGER:-P30D
ACTION:DISPLAY
DESCRIPTION:URGENCE eStudyFlow : Ton titre de séjour expire dans 30 jours !
END:VALARM
END:VEVENT
`;
    }

    // 2. Ouverture ANEF
    if (anefOpenDateStr && !isEU) {
      const cleanDate = anefOpenDateStr.replace(/-/g, '');
      icsEvents += `BEGIN:VEVENT
UID:estudyflow-anef-open-${profile.userId || 'user'}@estudyflow.fr
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${cleanDate}
DTEND;VALUE=DATE:${cleanDate}
SUMMARY:📅 Ouverture recommandée ANEF (Renouvellement titre)
DESCRIPTION:La fenêtre légale recommandée (4 mois avant expiration) est ouverte. Connecte-toi sur l'ANEF avec tes relevés de notes et justificatifs de ressources.
BEGIN:VALARM
TRIGGER:-P7D
ACTION:DISPLAY
DESCRIPTION:Prépare tes justificatifs de scolarité pour le renouvellement ANEF.
END:VALARM
END:VEVENT
`;
    }

    // 3. Tasks with dates
    tasks.filter(t => t.dueDate && /^\d{4}-\d{2}-\d{2}/.test(t.dueDate)).forEach(t => {
      const cleanDate = t.dueDate!.replace(/-/g, '');
      icsEvents += `BEGIN:VEVENT
UID:estudyflow-task-${t.id}@estudyflow.fr
DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTSTART;VALUE=DATE:${cleanDate}
DTEND;VALUE=DATE:${cleanDate}
SUMMARY:📌 Échéance démarche : ${t.title.replace(/[\n\r]/g, ' ')}
DESCRIPTION:${(t.shortDescription || t.whyImportant || 'Démarche eStudyFlow').replace(/[\n\r]/g, ' ')}
BEGIN:VALARM
TRIGGER:-P2D
ACTION:DISPLAY
DESCRIPTION:Rappel eStudyFlow : Démarche à finaliser (${t.title})
END:VALARM
END:VEVENT
`;
    });

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//eStudyFlow//Mon Calendrier Étudiant//FR
CALSCALE:GREGORIAN
METHOD:PUBLISH
X-WR-CALNAME:Mon Calendrier - eStudyFlow
X-WR-TIMEZONE:Europe/Paris
${icsEvents}END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mon-calendrier-estudyflow-${profile.nationality ? profile.nationality.toLowerCase().replace(/[^a-z0-9]/g, '-') : 'etudiant'}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setExportFeedback('Calendrier .ics téléchargé ! Compatible Apple Calendar, Google & Outlook.');
    setTimeout(() => setExportFeedback(null), 4000);
  };

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      {/* iOS Modal / Bottom-sheet wrapper */}
      <div className="w-full max-w-xl bg-white max-sm:rounded-t-[32px] sm:rounded-3xl shadow-2xl relative max-h-[92dvh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        
        {/* iOS Pull Handle on Mobile */}
        <div className="pt-2 pb-1 sm:hidden flex justify-center shrink-0">
          <div className="w-10 h-1.5 bg-gray-300 rounded-full" />
        </div>

        {/* ================= HEADER ================= */}
        <div className="px-5 sm:px-6 pt-3 sm:pt-6 pb-4 border-b border-gray-100 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-11 h-11 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center shrink-0 shadow-2xs">
              <Calendar className="w-5 h-5 text-[#0045F9]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-extrabold text-[#17181C] tracking-tight truncate">
                  Mon calendrier
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-[#0045F9] text-[10px] font-bold shrink-0">
                  {allEvents.length} repères
                </span>
              </div>
              <p className="text-xs text-[#6B7280] truncate">
                Échéances de séjour, délais légaux & démarches
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fermer mon calendrier"
            className="p-2 sm:p-2.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 active:scale-95 transition shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= SCROLLABLE CONTENT ================= */}
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 sm:px-6 py-4 space-y-4 ios-scroll">
          
          {/* Export success banner */}
          {exportFeedback && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in slide-in-from-top-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{exportFeedback}</span>
            </div>
          )}

          {/* ================= KEY STATUS CARD ================= */}
          {!isEU ? (
            <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              permitStatus.isCritical 
                ? 'bg-red-50/70 border-red-200' 
                : permitStatus.isUrgent 
                ? 'bg-amber-50/70 border-amber-200' 
                : 'bg-[#F8F9FB] border-gray-200/80'
            }`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    permitStatus.isCritical ? 'bg-red-100 text-red-600' :
                    permitStatus.isUrgent ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-[#0045F9]'
                  }`}>
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Statut titre de séjour
                    </div>
                    <div className="text-sm sm:text-base font-extrabold text-[#17181C] truncate">
                      {permitStatus.daysRemaining > 0 ? (
                        <>
                          <span className={permitStatus.isCritical ? 'text-red-600' : permitStatus.isUrgent ? 'text-amber-600' : 'text-[#0045F9]'}>
                            {permitStatus.daysRemaining} jours
                          </span> restants
                        </>
                      ) : (
                        <span className="text-red-600">Échéance dépassée</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Direct Action Button on Key Card */}
                <button
                  onClick={handleExportICS}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 active:scale-98 text-[#17181C] text-xs font-bold shadow-2xs transition cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Download className="w-3.5 h-3.5 text-[#0045F9]" />
                  <span>Exporter (.ics)</span>
                </button>
              </div>

              {/* Progress and milestones with wrap-safe layout */}
              <div className="pt-3 border-t border-gray-200/60 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                  <span className="text-[#6B7280]">Date d'expiration légale :</span>
                  <span className="font-bold text-[#17181C] bg-white/80 px-2 py-0.5 rounded-md border border-gray-200/50">
                    {formatDate(profile.permitExpiryDate, true, dateLocale)}
                  </span>
                </div>
                {anefOpenDateStr && (
                  <div className="flex flex-wrap items-center justify-between gap-1 text-[11px]">
                    <span className="text-[#6B7280]">Fenêtre ANEF recommandée :</span>
                    <span className="font-semibold text-gray-800 bg-white/80 px-2 py-0.5 rounded-md border border-gray-200/50">
                      Entre le {formatDate(anefOpenDateStr, false, dateLocale)} et le {formatDate(anefLimitDateStr, false, dateLocale)}
                    </span>
                  </div>
                )}
                <div className="text-[11px] leading-relaxed text-gray-700 bg-white/80 p-2.5 rounded-xl border border-gray-100 mt-2">
                  <span className="font-bold text-[#17181C]">Conseil préfectoral : </span>
                  <span className="break-words">{permitStatus.recommendedAction}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50/80 border border-emerald-200 text-xs">
              <div className="flex items-center gap-2.5 mb-1.5">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <h3 className="font-extrabold text-emerald-950 text-sm">
                  Citoyen européen : Titre de séjour non requis
                </h3>
              </div>
              <p className="text-emerald-800 text-[11px] leading-relaxed break-words">
                En tant que ressortissant de l'UE, tu bénéficies d'un droit au séjour permanent sans visa. Ton calendrier regroupe ci-dessous tes formalités d'installation (sécurité sociale, logement, université).
              </p>
            </div>
          )}

          {/* ================= iOS SEGMENTED FILTERS ================= */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 text-xs">
            <button
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[#0045F9] text-white shadow-xs'
                  : 'bg-gray-100 text-[#6B7280] hover:text-[#17181C] hover:bg-gray-200'
              }`}
            >
              Tous ({allEvents.length})
            </button>

            <button
              onClick={() => setActiveFilter('urgent')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 flex items-center gap-1 cursor-pointer ${
                activeFilter === 'urgent'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-red-50 text-red-700 hover:bg-red-100'
              }`}
            >
              <AlertCircle className="w-3 h-3" />
              <span>Urgents ({urgentCount})</span>
            </button>

            <button
              onClick={() => setActiveFilter('prefecture')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeFilter === 'prefecture'
                  ? 'bg-[#0045F9] text-white shadow-xs'
                  : 'bg-gray-100 text-[#6B7280] hover:text-[#17181C] hover:bg-gray-200'
              }`}
            >
              Séjour & ANEF ({prefectureCount})
            </button>

            <button
              onClick={() => setActiveFilter('tasks')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer ${
                activeFilter === 'tasks'
                  ? 'bg-[#0045F9] text-white shadow-xs'
                  : 'bg-gray-100 text-[#6B7280] hover:text-[#17181C] hover:bg-gray-200'
              }`}
            >
              Checklist & Tâches ({tasksCount})
            </button>
          </div>

          {/* ================= CLASSIFIED EVENTS TIMELINE LIST ================= */}
          <div className="space-y-4">
            {filteredEvents.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#6B7280] bg-gray-50 rounded-2xl border border-gray-100 p-4">
                <CalendarCheck className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="font-semibold text-gray-700">Aucune échéance dans ce filtre</p>
                <p className="text-[11px] mt-0.5">Toutes tes obligations sous ce critère sont à jour.</p>
              </div>
            ) : (
              classifiedSections.map((section) => (
                <div key={section.id} className="space-y-2">
                  {/* Category Section Header */}
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-[#6B7280]">
                      {section.title}
                    </h3>
                    <span className="text-[10px] font-semibold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                      {section.count}
                    </span>
                  </div>

                  {/* Section items list */}
                  <div className="space-y-2.5">
                    {section.items.map((ev) => {
                      const isOverdue = ev.daysRemaining !== null && ev.daysRemaining < 0 && !ev.isCompleted;
                      const isToday = ev.daysRemaining === 0;

                      return (
                        <div
                          key={ev.id}
                          className={`p-3.5 sm:p-4 rounded-2xl border transition-all text-xs flex flex-col gap-2.5 overflow-hidden ${
                            ev.isCompleted 
                              ? 'bg-[#F8F9FB] border-gray-100 opacity-80'
                              : isOverdue
                              ? 'bg-red-50/60 border-red-200'
                              : ev.isUrgent
                              ? 'bg-amber-50/50 border-amber-200'
                              : 'bg-white border-gray-200/80 shadow-2xs hover:border-blue-200'
                          }`}
                        >
                          {/* Top Row: Category Label + Date / Countdown Badges */}
                          <div className="flex flex-wrap items-center justify-between gap-2 min-w-0">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${
                                ev.isCompleted ? 'bg-[#22A06B]' :
                                isOverdue || ev.color === 'red' ? 'bg-[#E5484D]' :
                                ev.color === 'amber' ? 'bg-[#F59E0B]' : 'bg-[#0045F9]'
                              }`} />
                              <span className="text-[10px] font-bold text-[#6B7280] uppercase tracking-wider truncate">
                                {ev.categoryLabel}
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-1.5 shrink-0 ml-auto">
                              {/* Countdown Badge */}
                              {ev.daysRemaining !== null && !ev.isCompleted && (
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] shrink-0 whitespace-nowrap ${
                                  isOverdue ? 'bg-red-100 text-red-700' :
                                  isToday ? 'bg-blue-100 text-[#0045F9]' :
                                  ev.daysRemaining <= 30 ? 'bg-amber-100 text-amber-800' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {isOverdue ? `Dépassé de ${Math.abs(ev.daysRemaining)} j` :
                                   isToday ? "Aujourd'hui" :
                                   `Dans ${ev.daysRemaining} j`}
                                </span>
                              )}

                              {/* Formatted Date badge */}
                              <span className="font-bold text-[#17181C] text-[11px] bg-gray-50 border border-gray-200/60 px-2 py-0.5 rounded-md shrink-0 whitespace-nowrap">
                                {ev.formattedDate}
                              </span>
                            </div>
                          </div>

                          {/* Middle: Checkbox/Icon + Title + Description */}
                          <div className="flex items-start gap-2.5 min-w-0">
                            {ev.taskId ? (
                              <button
                                onClick={() => toggleTaskStatus(ev.taskId!)}
                                aria-label={ev.isCompleted ? 'Marquer comme à faire' : 'Marquer comme fait'}
                                className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 transition cursor-pointer border ${
                                  ev.isCompleted 
                                    ? 'bg-[#22A06B] border-[#22A06B] text-white' 
                                    : 'bg-white border-gray-300 hover:border-[#0045F9]'
                                }`}
                              >
                                {ev.isCompleted && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                              </button>
                            ) : (
                              <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                                ev.color === 'red' ? 'text-red-500' :
                                ev.color === 'amber' ? 'text-amber-500' : 'text-[#0045F9]'
                              }`}>
                                <Calendar className="w-4 h-4" />
                              </div>
                            )}

                            <div className="min-w-0 flex-1">
                              <h4 className={`font-bold text-[#17181C] text-xs sm:text-sm leading-snug break-words ${
                                ev.isCompleted ? 'line-through text-gray-400' : ''
                              }`}>
                                {ev.title}
                              </h4>
                              {ev.description && (
                                <p className="text-[11px] text-[#6B7280] mt-1 leading-normal break-words">
                                  {ev.description}
                                </p>
                              )}
                              {ev.actionHint && !ev.isCompleted && (
                                <div className="mt-2 text-[10px] text-gray-700 bg-[#F8F9FB] rounded-lg p-2 border border-gray-100 flex items-start gap-1.5 min-w-0">
                                  <Info className="w-3.5 h-3.5 text-[#0045F9] shrink-0 mt-0.5" />
                                  <span className="break-words min-w-0 flex-1">{ev.actionHint}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sync Tip box */}
          <div className="p-3.5 rounded-2xl bg-[#EBF0FF]/70 border border-blue-100 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5 min-w-0">
              <CalendarCheck className="w-5 h-5 text-[#0045F9] shrink-0 mt-0.5 sm:mt-0" />
              <div className="min-w-0">
                <p className="font-bold text-[#17181C] text-xs">
                  Synchronisation Apple Calendar & Google
                </p>
                <p className="text-[11px] text-[#6B7280] leading-snug mt-0.5">
                  Exporte toutes tes dates avec rappels automatiques directement sur ton calendrier mobile.
                </p>
              </div>
            </div>
            <button
              onClick={handleExportICS}
              className="self-start sm:self-auto shrink-0 px-3 py-1.5 rounded-xl bg-[#0045F9] hover:bg-blue-700 active:scale-95 text-white font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exporter (.ics)</span>
            </button>
          </div>
        </div>

        {/* ================= FOOTER ================= */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-gray-100 bg-white flex items-center justify-between gap-3 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
          <span className="text-[11px] text-[#6B7280] truncate">
            {filteredEvents.length} échéance{filteredEvents.length > 1 ? 's' : ''} affichée{filteredEvents.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportICS}
              className="px-3 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 text-[#17181C] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#0045F9]" />
              <span className="hidden sm:inline">Exporter (.ics)</span>
              <span className="sm:hidden">.ics</span>
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 active:scale-95 text-[#17181C] text-xs font-bold transition cursor-pointer"
            >
              Fermer
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
