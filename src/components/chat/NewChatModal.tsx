"use client";

import React, { useState } from 'react';
import { Search, X, User as UserIcon, Loader2, MessageSquare, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, auth } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface NewChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChatCreated: (chatId: string) => void;
}

export default function NewChatModal({ isOpen, onClose, onChatCreated }: NewChatModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      const usersRef = collection(db, 'users');
      // Search by username (case sensitive for now, or we could normalize)
      const q = query(
        usersRef, 
        where('username', '>=', searchQuery.startsWith('@') ? searchQuery : `@${searchQuery}`),
        where('username', '<=', (searchQuery.startsWith('@') ? searchQuery : `@${searchQuery}`) + '\uf8ff')
      );
      
      const snapshot = await getDocs(q);
      const users = snapshot.docs
        .map(doc => doc.data())
        .filter(u => u.uid !== auth.currentUser?.uid);
      
      setResults(users);
    } catch (err) {
      console.error("Search error:", err);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (targetUser: any) => {
    if (!auth.currentUser) return;
    
    setCreating(true);
    try {
      // Check if conversation already exists
      const participantIds = [auth.currentUser.uid, targetUser.uid].sort();
      const chatId = participantIds.join('_');
      
      const convRef = doc(db, 'conversations', chatId);
      const convSnap = await getDoc(convRef);
      
      if (!convSnap.exists()) {
        await setDoc(convRef, {
          id: chatId,
          participantIds,
          lastMessage: '',
          updatedAt: serverTimestamp(),
          unreadCounts: {
            [auth.currentUser.uid]: 0,
            [targetUser.uid]: 0
          }
        });
      }
      
      onChatCreated(chatId);
      onClose();
    } catch (err) {
      console.error("Error starting chat:", err);
    } finally {
      setCreating(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">New Chat</h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6 flex-1 overflow-hidden flex flex-col">
              <form onSubmit={handleSearch} className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all shadow-sm"
                />
              </form>

              <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Searching Users...</p>
                  </div>
                ) : results.length > 0 ? (
                  results.map((user) => (
                    <button
                      key={user.uid}
                      onClick={() => startChat(user)}
                      disabled={creating}
                      className="w-full p-4 rounded-3xl bg-slate-50 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 flex items-center gap-4 transition-all group"
                    >
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center border border-slate-100 overflow-hidden shadow-sm group-hover:scale-105 transition-transform">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon className="w-6 h-6 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-black text-slate-900 text-sm tracking-tight">{user.displayName}</p>
                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest">{user.username}</p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Plus className="w-5 h-5" />
                      </div>
                    </button>
                  ))
                ) : searchQuery && !loading ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                      <Search className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 uppercase tracking-widest text-xs">No users found</p>
                      <p className="text-xs font-bold text-slate-400">Try a different username.</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                    <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                      <MessageSquare className="w-8 h-8 text-slate-300" />
                    </div>
                    <div className="space-y-1">
                      <p className="font-black text-slate-900 uppercase tracking-widest text-xs">Find Someone</p>
                      <p className="text-xs font-bold text-slate-400">Search for friends to start chatting.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
