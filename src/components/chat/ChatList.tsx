"use client";

import React, { useState, useEffect } from 'react';
import { Search, Plus, MoreVertical, MessageSquare, Users, Globe, Check, CheckCheck, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { db, auth } from '@/firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import NewChatModal from './NewChatModal';

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  photoURL?: string;
  type: 'private' | 'group' | 'channel';
  status?: 'online' | 'offline' | 'away';
  participantId?: string;
}

interface ChatListProps {
  type: 'chats' | 'groups' | 'channels';
  onChatSelect: (chatId: string) => void;
  activeChatId?: string;
}

export default function ChatList({ type, onChatSelect, activeChatId }: ChatListProps) {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    let q;
    if (type === 'chats') {
      q = query(
        collection(db, 'conversations'),
        where('participantIds', 'array-contains', auth.currentUser.uid),
        orderBy('updatedAt', 'desc')
      );
    } else if (type === 'groups') {
      q = query(
        collection(db, 'groups'),
        where('memberIds', 'array-contains', auth.currentUser.uid),
        orderBy('createdAt', 'desc')
      );
    } else {
      q = query(
        collection(db, 'channels'),
        orderBy('createdAt', 'desc')
      );
    }

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatData: ChatItem[] = [];
      
      for (const chatDoc of snapshot.docs) {
        const data = chatDoc.data();
        
        if (type === 'chats') {
          const otherParticipantId = data.participantIds.find((id: string) => id !== auth.currentUser?.uid);
          
          // Fetch other user's profile
          let name = 'User';
          let photoURL = '';
          let status: any = 'offline';
          
          if (otherParticipantId) {
            const userSnap = await getDoc(doc(db, 'users', otherParticipantId));
            if (userSnap.exists()) {
              const userData = userSnap.data();
              name = userData.displayName || userData.username || 'User';
              photoURL = userData.photoURL || '';
              status = userData.isOnline ? 'online' : 'offline';
            }
          }

          chatData.push({
            id: chatDoc.id,
            name,
            lastMessage: data.lastMessage || 'No messages yet',
            timestamp: data.updatedAt?.toDate ? data.updatedAt.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
            unreadCount: data.unreadCounts?.[auth.currentUser?.uid || ''] || 0,
            photoURL,
            type: 'private',
            status,
            participantId: otherParticipantId
          });
        } else {
          chatData.push({
            id: chatDoc.id,
            name: data.name,
            lastMessage: data.description || 'Welcome!',
            timestamp: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString() : 'New',
            unreadCount: 0,
            photoURL: data.photoURL || '',
            type: type === 'groups' ? 'group' : 'channel'
          });
        }
      }
      
      setChats(chatData);
      setLoading(false);
    }, (err) => {
      console.error("Error fetching chats:", err);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [type]);

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-100 w-full lg:w-96">
      {/* Search Header */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black text-slate-900 uppercase tracking-widest">
            {type === 'chats' ? 'Messages' : type === 'groups' ? 'Groups' : 'Channels'}
          </h2>
          {type === 'chats' && (
            <button 
              onClick={() => setIsNewChatOpen(true)}
              className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-600/20 hover:bg-indigo-700 transition-all"
            >
              <Plus className="w-5 h-5" />
            </button>
          )}
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
            {type === 'chats' && (
              <button 
                onClick={() => setIsNewChatOpen(true)}
                className="mt-4 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                Start Chatting
              </button>
            )}
          </div>
        )}
      </div>

      <NewChatModal 
        isOpen={isNewChatOpen} 
        onClose={() => setIsNewChatOpen(false)} 
        onChatCreated={(id) => {
          onChatSelect(id);
          setIsNewChatOpen(false);
        }}
      />
    </div>
  );
}
