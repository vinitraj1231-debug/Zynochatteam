"use client";

import React from 'react';
import { MessageSquare, Users, Globe, Settings, User } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export type TabType = 'chats' | 'groups' | 'channels' | 'settings' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

export default function BottomNav({ activeTab, setActiveTab }: BottomNavProps) {
  const tabs = [
    { id: 'chats', icon: MessageSquare, label: 'Chats' },
    { id: 'groups', icon: Users, label: 'Groups' },
    { id: 'channels', icon: Globe, label: 'Channels' },
    { id: 'settings', icon: Settings, label: 'Settings' },
    { id: 'profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 flex items-center justify-between z-50 lg:hidden">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className="relative flex flex-col items-center justify-center gap-1 group"
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300",
              isActive 
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20 -translate-y-1" 
                : "text-slate-400 hover:text-slate-600"
            )}>
              <Icon className="w-6 h-6" />
            </div>
            <span className={cn(
              "text-[8px] font-black uppercase tracking-widest transition-all",
              isActive ? "text-indigo-600 opacity-100" : "text-slate-400 opacity-0 group-hover:opacity-100"
            )}>
              {tab.label}
            </span>
            {isActive && (
              <motion.div 
                layoutId="bottom-nav-indicator"
                className="absolute -top-1 w-1 h-1 bg-indigo-600 rounded-full"
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
