"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, AtSign, ArrowRight, Shield, Globe, Lock, MessageSquare } from 'lucide-react';
import { motion } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType } from '@/firebase';
import { signInAnonymously } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function SignupForm() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName || !username) {
      setError('Please fill in all fields');
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      // Sign in anonymously to get a UID
      const userCredential = await signInAnonymously(auth);
      const user = userCredential.user;

      // Save user info to Firestore
      const userData = {
        uid: user.uid,
        displayName,
        username: username.startsWith('@') ? username : `@${username}`,
        bio: '',
        photoURL: '',
        createdAt: serverTimestamp(),
        lastSeen: serverTimestamp(),
        role: 'user'
      };
      
      try {
        await setDoc(doc(db, 'users', user.uid), userData);
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`);
      }
      
      router.push('/dashboard');
    } catch (err) {
      console.error('Onboarding error:', err);
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 md:p-6">
      <div className="glass-card rounded-[2rem] md:rounded-[2.5rem] p-6 md:p-12 space-y-8 md:space-y-10 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />

        {/* Logo Section */}
        <div className="flex flex-col items-center text-center space-y-4 md:space-y-6 relative z-10">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="relative"
          >
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-2xl md:rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 ring-1 ring-black/5 animate-float overflow-hidden">
              <MessageSquare className="w-8 h-8 md:w-10 md:h-10 text-indigo-600" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 md:w-8 md:h-8 bg-indigo-600 rounded-lg md:rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white">
              <Shield className="w-3 h-3 md:w-4 md:h-4 text-white" />
            </div>
          </motion.div>
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-slate-900">ZYNOCHAT</h1>
            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-[0.4em]">
              Join the Community
            </p>
          </div>
        </div>

        {/* Onboarding Form */}
        <div className="space-y-8 relative z-10">
          <form onSubmit={handleJoin} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <User className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name"
                    className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all shadow-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Username</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <AtSign className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Choose a username"
                    className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all shadow-sm placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50 disabled:translate-y-0"
            >
              {loading ? 'Setting up...' : 'Get Started'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Footer Features */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-50 relative z-10">
          {[
            { icon: Globe, label: 'Global' },
            { icon: Lock, label: 'Secure' },
            { icon: MessageSquare, label: 'Instant' },
          ].map((feature, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center ring-1 ring-black/5">
                <feature.icon className="w-5 h-5 text-slate-400" />
              </div>
              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{feature.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
