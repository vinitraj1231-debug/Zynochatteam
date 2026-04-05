"use client";

import React from 'react';
import { Search, Plus, MoreVertical, MessageSquare, Users, Globe, Check, CheckCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  photoURL?: string;
  type: 'private' | 'group' | 'channel';
  status?: 'online' | 'offline' | 'away';
}

interface ChatListProps {
  type: 'chats' | 'groups' | 'channels';
  onChatSelect: (chatId: string) => void;
  activeChatId?: string;
}

export default function ChatList({ type, onChatSelect, activeChatId }: ChatListProps) {
  // Mock data for now
  const mockChats: ChatItem[] = [
    { id: '1', name: 'Alex Rivera', lastMessage: 'Hey, how is the project going?', timestamp: '10:42 AM', unreadCount: 2, type: 'private', status: 'online' },
    { id: '2', name: 'Zyno Dev Team', lastMessage: 'New update pushed to production.', timestamp: '9:15 AM', unreadCount: 0, type: 'group' },
    { id: '3', name: 'Zyno Announcements', lastMessage: 'Welcome to the new chat experience!', timestamp: 'Yesterday', unreadCount: 0, type: 'channel' },
    { id: '4', name: 'Sarah Chen', lastMessage: 'Let\'s meet tomorrow at 10.', timestamp: 'Yesterday', unreadCount: 5, type: 'private', status: 'away' },
    { id: '5', name: 'Design System', lastMessage: 'Updated the glassmorphism components.', timestamp: 'Mon', unreadCount: 0, type: 'group' },
  ];

  const filteredChats = mockChats.filter(chat => {
    if (type === 'chats') return chat.type === 'private';
    if (type === 'groups') return chat.type === 'group';
    if (type === 'channels') return chat.type === 'channel';
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-full lg:w-96">
      {/* Search Header */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">
            {type === 'chats' ? 'Messages' : type === 'groups' ? 'Groups' : 'Channels'}
          </h2>
          <button className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
            <Plus className="w-5 h-5" />
          </button>
        </div>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
          <input 
            type="text" 
            placeholder={`Search ${type}...`}
            className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-4 pb-24 lg:pb-6 space-y-2">
        {filteredChats.length > 0 ? (
          filteredChats.map((chat) => (
            <motion.button
              key={chat.id}
              onClick={() => onChatSelect(chat.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full p-4 rounded-[2rem] flex items-center gap-4 transition-all group relative",
                activeChatId === chat.id 
                  ? "bg-indigo-600 text-white shadow-xl shadow-indigo-600/20" 
                  : "bg-white hover:bg-slate-50 text-slate-900 border border-transparent hover:border-slate-100"
              )}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className={cn(
                  "w-14 h-14 rounded-[1.5rem] flex items-center justify-center border-2 overflow-hidden",
                  activeChatId === chat.id ? "border-white/20 bg-white/10" : "border-white bg-slate-100 shadow-sm"
                )}>
                  {chat.photoURL ? (
                    <img src={chat.photoURL} alt="" className="w-full h-full object-cover" />
                  ) : (
                    chat.type === 'private' ? <MessageSquare className="w-6 h-6" /> : 
                    chat.type === 'group' ? <Users className="w-6 h-6" /> : <Globe className="w-6 h-6" />
                  )}
                </div>
                {chat.status && (
                  <div className={cn(
                    "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm",
                    chat.status === 'online' ? "bg-green-500" : chat.status === 'away' ? "bg-amber-500" : "bg-slate-300"
                  )} />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-black text-sm truncate tracking-tight">{chat.name}</h3>
                  <span className={cn(
                    "text-[10px] font-bold uppercase tracking-widest",
                    activeChatId === chat.id ? "text-white/60" : "text-slate-400"
                  )}>
                    {chat.timestamp}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-xs font-bold truncate",
                    activeChatId === chat.id ? "text-white/80" : "text-slate-500"
                  )}>
                    {chat.lastMessage}
                  </p>
                  {chat.unreadCount > 0 && (
                    <div className={cn(
                      "min-w-[20px] h-5 rounded-full flex items-center justify-center px-1.5 text-[10px] font-black",
                      activeChatId === chat.id ? "bg-white text-indigo-600" : "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                    )}>
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              </div>
            </motion.button>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center">
              <MessageSquare className="w-8 h-8 text-slate-300" />
            </div>
            <div className="space-y-1 px-6">
              <p className="font-black text-slate-900 uppercase tracking-widest text-xs">No {type} found</p>
              <p className="text-xs font-bold text-slate-400">Start a new conversation to see it here.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
