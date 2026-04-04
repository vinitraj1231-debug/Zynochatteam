"use client";

import React, { useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Shield, Globe, MessageSquare, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push('/dashboard');
    }
  };

  const handleGoogleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) setError(error.message);
  };

  return (
    <div className="w-full max-w-md space-y-12">
      {/* Logo Section */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-plum-700/10 ring-4 ring-white/20 animate-float overflow-hidden">
            <MessageSquare className="w-12 h-12 text-plum-700" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-gray-50">
            <Shield className="w-6 h-6 text-plum-700" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-charcoal">ZYNOCHAT</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Welcome Back</p>
        </div>
      </div>

      {/* Auth Form */}
      <div className="space-y-8">
        <form onSubmit={handleLogin} className="space-y-6">
          {error && (
            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email Address</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input 
                type="email" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-gray-100 border-none rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-charcoal focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Password</label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <Lock className="w-5 h-5 text-gray-400 group-focus-within:text-indigo-600 transition-colors" />
              </div>
              <input 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-gray-100 border-none rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-charcoal focus:ring-4 focus:ring-indigo-500/20 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
          >
            {loading ? 'Logging in...' : 'Login Now'}
            <LogIn className="w-5 h-5" />
          </button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase font-black tracking-widest">
            <span className="bg-white px-4 text-gray-400">Or continue with</span>
          </div>
        </div>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-100 text-charcoal py-5 rounded-3xl font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-3 hover:bg-gray-50 transition-all"
        >
          <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
          Google Account
        </button>

        <p className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
          Don't have an account? <a href="/auth/signup" className="text-indigo-600 hover:underline">Sign up</a>
        </p>
      </div>

      {/* Footer Features */}
      <div className="grid grid-cols-3 gap-4 pt-8">
        {[
          { icon: Globe, label: 'Global' },
          { icon: Lock, label: 'Secure' },
          { icon: MessageSquare, label: 'Instant' },
        ].map((feature, i) => (
          <div key={i} className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center ring-1 ring-black/5">
              <feature.icon className="w-5 h-5 text-gray-400" />
            </div>
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest">{feature.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
