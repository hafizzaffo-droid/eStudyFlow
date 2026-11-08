import React from 'react';
import { Bell, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { AppLogo } from '../common/AppLogo';
import { useLanguage } from '../../context/LanguageContext';

interface HeaderProps {
  onOpenCalendar: () => void;
  onOpenDocuments: () => void;
  onOpenNotifications: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCalendar,
  onOpenDocuments,
  onOpenNotifications,
  onOpenProfile,
}) => {
  const { profile, notifications } = useAuth();
  const { language, setLanguage, languageError } = useLanguage();

  const unreadCount = notifications.filter(notification => {
    if (notification.isRead) return false;
    const key = notification.type === 'task_deadline' ? 'demarches'
      : notification.type === 'permit_expiry' ? 'titre'
      : notification.type === 'work_limit' ? 'emploi'
      : notification.type === 'news' ? 'infos'
      : 'calendrier';
    return profile?.notificationPreferences?.[key] !== false;
  }).length;

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-2xs pt-safe transition-all">
      <div className="max-w-4xl mx-auto px-2.5 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-1.5 sm:gap-3">
        {/* Brand identity */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          <AppLogo size="sm" className="w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9" />
          <div className="shrink-0">
            <div>
              <span className="font-extrabold text-[11px] xs:text-xs sm:text-sm md:text-base tracking-tight text-[#17181C] whitespace-nowrap select-none">
                eStudyFlow
              </span>
            </div>
            <p className="text-[10px] sm:text-[11px] text-[#6B7280] leading-none hidden sm:block">Ta vie étudiante en France</p>
          </div>
        </div>

        {/* Action icons & user profile */}
        <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 shrink-0">
          <div className="flex items-center rounded-lg border border-gray-200 p-0.5" aria-label="App language">
            {(['fr', 'en'] as const).map(option => (
              <button
                key={option}
                type="button"
                aria-label={option === 'fr' ? 'Français' : 'English'}
                aria-pressed={language === option}
                onClick={() => void setLanguage(option)}
                className={`min-h-8 rounded-md px-1.5 text-[10px] font-bold transition sm:px-2 ${
                  language === option ? 'bg-[#EBF0FF] text-[#0045F9]' : 'text-[#6B7280] hover:bg-gray-50'
                }`}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Smart Calendar Shortcut */}
          <button
            onClick={onOpenCalendar}
            aria-label="Ouvrir mon calendrier et mes échéances"
            className="p-1.5 sm:p-2 rounded-xl text-[#6B7280] hover:text-[#0045F9] hover:bg-[#EBF0FF] transition relative"
            title="Mon Calendrier & Échéances"
          >
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Documents Checklist Shortcut */}
          <button
            onClick={onOpenDocuments}
            aria-label="Ouvrir mes documents"
            className="p-1.5 sm:p-2 rounded-xl text-[#6B7280] hover:text-[#0045F9] hover:bg-[#EBF0FF] transition relative"
            title="Mes Documents"
          >
            <FileText className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>

          {/* Notifications Button */}
          <button
            onClick={onOpenNotifications}
            aria-label={`Ouvrir mes notifications${unreadCount ? `, ${unreadCount} non lues` : ''}`}
            className="p-1.5 sm:p-2 rounded-xl text-[#6B7280] hover:text-[#0045F9] hover:bg-[#EBF0FF] transition relative"
            title="Mes Notifications"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full bg-[#E5484D] text-white text-[9px] sm:text-[10px] font-extrabold flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Avatar / Profile */}
          <button
            onClick={onOpenProfile}
            aria-label="Ouvrir mon profil et mes paramètres"
            className="flex items-center gap-2 pl-1 pr-1.5 py-1 rounded-full hover:bg-gray-100 transition active:scale-95"
            title="Mon Profil & Paramètres"
          >
            <div className="w-8 h-8 rounded-full bg-[#EBF0FF] border border-blue-200 text-[#0045F9] font-bold text-xs flex items-center justify-center overflow-hidden">
              {profile?.photoURL ? (
                <img src={profile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                profile?.displayName ? profile.displayName.charAt(0).toUpperCase() : 'E'
              )}
            </div>
          </button>
        </div>
      </div>
      {languageError && (
        <p role="alert" className="mx-auto max-w-4xl px-3 pb-2 text-xs text-red-700 sm:px-4">
          {languageError}
        </p>
      )}
    </header>
  );
};
