import React from 'react';
import { Home, CheckSquare, type LucideIcon } from 'lucide-react';
import { AssistantRobotIcon } from '../common/AssistantRobotIcon';

export type NavTab = 'home' | 'tasks' | 'jobs' | 'ai' | 'news';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  tasksBadge?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab, tasksBadge }) => {
  const tabs: { id: NavTab; label: string; icon?: LucideIcon; badge?: number }[] = [
    { id: 'home', label: 'Accueil', icon: Home },
    { id: 'tasks', label: 'Démarches', icon: CheckSquare, badge: tasksBadge },
    { id: 'ai', label: 'eStudy AI' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200/80 shadow-lg pb-safe select-none">
      <div className="max-w-md mx-auto px-4 flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              className="flex flex-col items-center justify-center flex-1 py-1 transition-all duration-150 relative group active:scale-95 touch-manipulation cursor-pointer min-h-[44px]"
            >
              <div className="relative">
                {tab.id === 'ai' ? (
                  <AssistantRobotIcon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-[#0045F9]' : 'text-[#6B7280] group-hover:text-[#17181C]'
                    }`}
                  />
                ) : tab.icon ? (
                  <tab.icon
                    className={`w-5 h-5 transition-transform duration-200 ${
                      isActive ? 'text-[#0045F9] stroke-[2.4]' : 'text-[#6B7280] group-hover:text-[#17181C]'
                    }`}
                  />
                ) : null}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="absolute -top-1 -right-2 px-1 min-w-[14px] h-[14px] rounded-full bg-[#0045F9] text-white text-[9px] font-extrabold flex items-center justify-center leading-none">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] mt-1 transition-colors ${
                  isActive ? 'text-[#0045F9] font-bold' : 'text-[#6B7280] font-medium'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
