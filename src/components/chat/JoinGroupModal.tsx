"use client";

import React, { useState, useEffect } from 'react';
import { X, Search, Globe, Loader2, Plus, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore';

interface JoinGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function JoinGroupModal({ isOpen, onClose }: JoinGroupModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);

  const searchGroups = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'groups'),
        where('type', '==', 'public'),
        where('name', '>=', searchQuery),
        where('name', '<=', searchQuery + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      const groupData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setGroups(groupData);
    } catch (err) {
      console.error("Error searching groups:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (groupId: string) => {
    if (!auth.currentUser) return;
    setJoining(groupId);
    try {
      const groupRef = doc(db, 'groups', groupId);
      await updateDoc(groupRef, {
        memberIds: arrayUnion(auth.currentUser.uid)
      });
      onClose();
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'groups');
    } finally {
      setJoining(null);
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
            className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Join Group</h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchGroups()}
                  placeholder="Search public groups..."
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="max-h-80 overflow-y-auto space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                  </div>
                ) : groups.length > 0 ? (
                  groups.map((group) => (
                    <div key={group.id} className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between group hover:bg-white hover:shadow-lg hover:shadow-slate-200/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm">
                          <Users className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-sm uppercase tracking-widest">{group.name}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.memberIds.length} members</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleJoin(group.id)}
                        disabled={joining === group.id || group.memberIds.includes(auth.currentUser?.uid)}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        {joining === group.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : group.memberIds.includes(auth.currentUser?.uid) ? (
                          'Joined'
                        ) : (
                          'Join'
                        )}
                      </button>
                    </div>
                  ))
                ) : searchQuery && (
                  <div className="text-center py-8 space-y-2">
                    <Globe className="w-12 h-12 text-slate-200 mx-auto" />
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No public groups found</p>
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
