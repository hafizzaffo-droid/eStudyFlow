import React, { useState } from 'react';
import { X, Bell, CheckCheck, AlertCircle, Clock, Settings, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({ isOpen, onClose }) => {
  const { notifications, markNotificationAsRead, clearAllNotifications, profile, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'settings'>('all');
  const [preferences, setPreferences] = useState<Record<string, boolean>>({});
  const [settingsError, setSettingsError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  if (!isOpen) return null;

  const preferenceDefaults: Record<string, boolean> = { demarches: true, titre: true, emploi: true, infos: true, calendrier: true };
  const effectivePreferences = { ...preferenceDefaults, ...profile?.notificationPreferences, ...preferences };
  const isEnabled = (type: string) => {
    const key = type === 'task_deadline' ? 'demarches'
      : type === 'permit_expiry' ? 'titre'
      : type === 'work_limit' ? 'emploi'
      : type === 'news' ? 'infos'
      : 'calendrier';
    return effectivePreferences[key] !== false;
  };
  const visibleNotifications = notifications.filter(item => isEnabled(item.type));
  const unreadNotifications = visibleNotifications.filter(n => !n.isRead);
  const displayNotifications = (activeTab === 'unread' ? unreadNotifications : visibleNotifications);

  const updatePreference = async (key: string, value: boolean) => {
    const updated = { ...effectivePreferences, [key]: value };
    try {
      await updateProfile({ notificationPreferences: updated });
      setPreferences(updated);
      setSettingsError(null);
    } catch (error) {
      console.error('Could not save notification preferences:', error);
      setSettingsError('Impossible d’enregistrer ces préférences.');
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id);
      setActionError(null);
    } catch (error) {
      console.error('Could not mark notification as read:', error);
      setActionError('Impossible de sauvegarder ce changement.');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await clearAllNotifications();
      setActionError(null);
    } catch (error) {
      console.error('Could not clear notifications:', error);
      setActionError('Impossible de sauvegarder les notifications.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3.5 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-3xl bg-white p-5 sm:p-8 shadow-2xl relative my-auto max-h-[92dvh] overflow-y-auto ios-scroll animate-in zoom-in-95">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#EBF0FF] text-[#0045F9] flex items-center justify-center">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#17181C]">Notifications & Alertes</h2>
            <p className="text-xs text-[#6B7280]">
              {unreadNotifications.length} notification{unreadNotifications.length > 1 ? 's' : ''} non lue{unreadNotifications.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`font-bold transition ${activeTab === 'all' ? 'text-[#0045F9]' : 'text-[#6B7280] hover:text-[#17181C]'}`}
            >
              Toutes ({visibleNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab('unread')}
              className={`font-bold transition ${activeTab === 'unread' ? 'text-[#0045F9]' : 'text-[#6B7280] hover:text-[#17181C]'}`}
            >
              Non lues ({unreadNotifications.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`font-bold transition flex items-center gap-1 ${activeTab === 'settings' ? 'text-[#0045F9]' : 'text-[#6B7280] hover:text-[#17181C]'}`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Préférences</span>
            </button>
          </div>

          {unreadNotifications.length > 0 && activeTab !== 'settings' && (
            <button
              onClick={() => void handleMarkAllRead()}
              className="text-[11px] font-semibold text-[#0045F9] hover:underline flex items-center gap-1"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tout marquer comme lu</span>
            </button>
          )}
        </div>

        {activeTab !== 'settings' ? (
          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
            {displayNotifications.length === 0 ? (
              <p className="text-center py-8 text-xs text-[#6B7280]">
                Aucune notification pour le moment.
              </p>
            ) : (
              displayNotifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => void handleMarkRead(notif.id)}
                  className={`p-3.5 rounded-2xl border text-xs transition cursor-pointer ${
                    !notif.isRead 
                      ? 'bg-[#EBF0FF]/50 border-blue-200' 
                      : 'bg-white border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-[#17181C] flex items-center gap-1.5">
                      {!notif.isRead && <span className="w-2 h-2 rounded-full bg-[#0045F9]" />}
                      {notif.title}
                    </span>
                    <span className="text-[10px] text-gray-400">{notif.date}</span>
                  </div>
                  <p className="text-[11px] text-[#6B7280] leading-relaxed">
                    {notif.message}
                  </p>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 py-2 text-xs">
            <h4 className="font-bold text-[#17181C]">Affichage des alertes dans l’application :</h4>
            <div className="space-y-2">
              {[
                { key: 'demarches', label: 'Démarches et checklists' },
                { key: 'titre', label: 'Échéances de titre de séjour' },
                { key: 'emploi', label: 'Emploi et seuils d’heures' },
                { key: 'infos', label: 'Informations administratives importantes' },
                { key: 'calendrier', label: 'Rappels de mon calendrier' },
              ].map((pref, idx) => (
                <label key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FB] border border-gray-100 cursor-pointer">
                  <span className="text-gray-800 font-medium">{pref.label}</span>
                  <input
                    type="checkbox"
                    checked={effectivePreferences[pref.key] !== false}
                    onChange={e => void updatePreference(pref.key, e.target.checked)}
                    className="w-4 h-4 rounded-sm text-[#0045F9] focus:ring-[#0045F9]"
                  />
                </label>
              ))}
            </div>
            {settingsError && <p role="alert" className="text-xs text-red-700">{settingsError}</p>}
          </div>
        )}
        {actionError && <p role="alert" className="mt-3 text-xs text-red-700">{actionError}</p>}

        <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-[#17181C] text-xs font-semibold"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};
