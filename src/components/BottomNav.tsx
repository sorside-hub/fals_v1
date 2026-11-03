import React from 'react';
import { TabType } from '../types';
import { PenLine, Sparkles } from 'lucide-react';

interface BottomNavProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  bankBarCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  bankBarCount,
}) => {
  const tabs: { id: TabType; label: string; icon: React.FC<{ className?: string }> }[] = [
    { id: 'lyrics', label: 'Lirik', icon: PenLine },
    { id: 'bank', label: 'Amunisi', icon: Sparkles },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FAF9F5]/95 backdrop-blur-md border-t border-[#E5E4DE] pb-safe shadow-md">
      <div className="grid grid-cols-2 h-14 max-w-sm mx-auto items-center px-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full relative transition-all cursor-pointer py-1.5 ${
                isActive ? 'text-[#1C1917]' : 'text-[#78716C] hover:text-[#44403C]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110 text-[#1C1917]' : ''}`} />
              </div>
              <span className={`text-[11px] tracking-tight mt-1 font-medium leading-none ${isActive ? 'font-black text-[#1C1917]' : ''}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-6 h-0.5 bg-[#1C1917] rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
