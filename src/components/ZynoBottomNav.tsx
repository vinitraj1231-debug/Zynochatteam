import React from 'react';
import { Home, MessageSquare, Search, User, Settings, CircleDashed } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ZynoBottomNavProps {
  activeTab: 'home' | 'chats' | 'status' | 'search' | 'profile' | 'settings';
  onTabChange: (tab: 'home' | 'chats' | 'status' | 'search' | 'profile' | 'settings') => void;
}

const ZynoBottomNav: React.FC<ZynoBottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'status', icon: CircleDashed, label: 'Status' },
    { id: 'search', icon: Search, label: 'Search' },
    { id: 'profile', icon: User, label: 'Profile' },
    { id: 'settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <nav className="h-16 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-safe z-50">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id as any)}
            className={cn(
              "flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300",
              isActive ? "text-wa-teal scale-110" : "text-gray-400 hover:text-gray-600"
            )}
          >
            <div className={cn(
              "p-1.5 rounded-xl transition-colors",
              isActive ? "bg-wa-teal/10" : "bg-transparent"
            )}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};

export default ZynoBottomNav;
