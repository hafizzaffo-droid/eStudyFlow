import React, { lazy, Suspense, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
import { BottomNav, NavTab } from './components/layout/BottomNav';
import { DashboardTab } from './components/dashboard/DashboardTab';
import { AuthModal } from './components/common/AuthModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { AppLogo } from './components/common/AppLogo';
import { LandingPage } from './components/landing/LandingPage';
import { LanguageProvider, withI18n } from './context/LanguageContext';

const TasksTab = lazy(() => import('./components/tasks/TasksTab').then(module => ({ default: withI18n(module.TasksTab) })));
const JobsTab = lazy(() => import('./components/jobs/JobsTab').then(module => ({ default: withI18n(module.JobsTab) })));
const NewsTab = lazy(() => import('./components/news/NewsTab').then(module => ({ default: withI18n(module.NewsTab) })));
const AssistantTab = lazy(() => import('./components/assistant/AssistantTab').then(module => ({ default: withI18n(module.AssistantTab) })));
const CalendarModal = lazy(() => import('./components/calendar/CalendarModal').then(module => ({ default: withI18n(module.CalendarModal) })));
const DocumentsModal = lazy(() => import('./components/documents/DocumentsModal').then(module => ({ default: withI18n(module.DocumentsModal) })));
const NotificationsModal = lazy(() => import('./components/notifications/NotificationsModal').then(module => ({ default: withI18n(module.NotificationsModal) })));
const ProfileModal = lazy(() => import('./components/profile/ProfileModal').then(module => ({ default: withI18n(module.ProfileModal) })));

function MainApp() {
  const { user, tasks, isLoading, dataError } = useAuth();
  
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [showCalendar, setShowCalendar] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex flex-col items-center justify-center p-4">
        <AppLogo size="lg" className="animate-pulse mb-3" />
        <div className="text-sm font-bold text-[#17181C]">eStudyFlow</div>
        <p className="text-xs text-[#6B7280] mt-1">Préparation de ton espace personnalisé...</p>
      </div>
    );
  }

  // If not authenticated, show landing page
  if (!user) {
    return (
      <>
        <LandingPage
          onLogin={() => { setAuthMode('login'); setShowAuth(true); }}
          onRegister={() => { setAuthMode('register'); setShowAuth(true); }}
        />
        <AuthModal
          isOpen={showAuth}
          onClose={() => setShowAuth(false)}
          initialMode={authMode}
        />
      </>
    );
  }

  const pendingTasksCount = tasks.filter(t => t.status !== 'completed').length;

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#17181C] flex flex-col selection:bg-[#EBF0FF] selection:text-[#0045F9]">
      {/* Top Header */}
      <Header
        onOpenCalendar={() => setShowCalendar(true)}
        onOpenDocuments={() => setShowDocuments(true)}
        onOpenNotifications={() => setShowNotifications(true)}
        onOpenProfile={() => setShowProfile(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-3.5 sm:px-4 pt-3 sm:pt-6 pb-24 sm:pb-20 mb-safe">
        {dataError && (
          <p role="alert" className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            {dataError}
          </p>
        )}
        {activeTab === 'home' && (
          <DashboardTab
            onNavigateTab={tab => setActiveTab(tab)}
            onOpenCalendar={() => setShowCalendar(true)}
            onOpenDocuments={() => setShowDocuments(true)}
            onOpenProfile={() => setShowProfile(true)}
          />
        )}

        <Suspense fallback={<p role="status" className="py-8 text-center text-xs text-[#6B7280]">Chargement…</p>}>
          {activeTab === 'tasks' && (
            <TasksTab
              onOpenCalendar={() => setShowCalendar(true)}
              onOpenDocuments={() => setShowDocuments(true)}
            />
          )}
          {activeTab === 'jobs' && <JobsTab />}
          {activeTab === 'news' && <NewsTab />}
          {activeTab === 'ai' && <AssistantTab />}
        </Suspense>
      </main>

      {/* Mobile Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={tab => setActiveTab(tab)}
        tasksBadge={pendingTasksCount}
      />

      {/* Modals */}
      {showCalendar && (
        <Suspense fallback={null}>
          <CalendarModal isOpen onClose={() => setShowCalendar(false)} />
        </Suspense>
      )}
      {showDocuments && (
        <Suspense fallback={null}>
          <DocumentsModal isOpen onClose={() => setShowDocuments(false)} />
        </Suspense>
      )}
      {showNotifications && (
        <Suspense fallback={null}>
          <NotificationsModal isOpen onClose={() => setShowNotifications(false)} />
        </Suspense>
      )}
      {showProfile && (
        <Suspense fallback={null}>
          <ProfileModal isOpen onClose={() => setShowProfile(false)} />
        </Suspense>
      )}

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        initialMode={authMode}
      />

      {/* Offline Alert Indicator */}
      <OfflineIndicator />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </AuthProvider>
  );
}
