"use client";

import React, { useState } from 'react';
import { X, Users, Camera, Loader2, Globe, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { cn } from '@/lib/utils';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateGroupModal({ isOpen, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<'public' | 'private'>('public');
  const [loading, setLoading] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !auth.currentUser) return;

    setLoading(true);
    try {
      const groupData = {
        name: name.trim(),
        description: description.trim(),
        type,
        adminIds: [auth.currentUser.uid],
        memberIds: [auth.currentUser.uid],
        bannedUserIds: [],
        createdAt: Date.now(),
        createdBy: auth.currentUser.uid,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff`,
        lastMessage: 'Group created',
        updatedAt: serverTimestamp()
      };

      await addDoc(collection(db, 'groups'), groupData);
      onClose();
      setName('');
      setDescription('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'groups');
    } finally {
      setLoading(false);
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
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">Create Group</h3>
              <button 
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 md:p-8 space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="w-24 h-24 bg-slate-100 rounded-[2rem] flex items-center justify-center relative group cursor-pointer overflow-hidden">
                  <Users className="w-10 h-10 text-slate-300" />
                  <div className="absolute inset-0 bg-indigo-600/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Group Photo</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Group Name</label>
                  <input 
                    type="text" 
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                    placeholder="Enter group name"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Description</label>
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-50 border-none rounded-2xl py-4 px-6 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-500/10 transition-all resize-none h-24"
                    placeholder="What's this group about?"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('public')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      type === 'public' 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Globe className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Public</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('private')}
                    className={cn(
                      "p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2",
                      type === 'private' 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-600" 
                        : "border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200"
                    )}
                  >
                    <Lock className="w-6 h-6" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Private</span>
                  </button>
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading || !name.trim()}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  'Create Group'
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
