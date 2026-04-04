"use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, ArrowRight, Shield, Globe, MessageSquare, LogIn, KeyRound, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getSupabase } from '@/lib/supabase';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '@/firebase';
import { signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

export default function LoginForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [otp, setOtp] = useState('');
  const [mode, setMode] = useState<'email' | 'otp'>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleSendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!email) return;

    setLoading(true);
    setError(null);
    
    try {
      const supabase = getSupabase();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false, // For login, we assume user exists
        }
      });

      if (error) {
        setError(error.message);
        setLoading(false);
      } else {
        setMode('otp');
        setLoading(false);
        setResendTimer(60);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initialize Supabase');
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;

    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabase();
      // For OTP codes sent via signInWithOtp, 'email' or 'magiclink' are standard types
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email', 
      });

      if (error) {
        // Fallback to 'magiclink' if 'email' fails
        const { data: secondData, error: secondError } = await supabase.auth.verifyOtp({
          email,
          token: otp,
          type: 'magiclink',
        });

        if (secondError) {
          setError(secondError.message);
          setLoading(false);
          return;
        }

        // Update user profile in Firestore
        if (secondData.user) {
          try {
            const userRef = doc(db, 'users', secondData.user.id);
            await setDoc(userRef, {
              uid: secondData.user.id,
              username: email.split('@')[0],
              displayName: email.split('@')[0],
              email: email,
              lastSeen: Date.now(),
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${secondData.user.id}`);
          }
        }
      } else {
        // Update user profile in Firestore for 'email' type success
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          try {
            const userRef = doc(db, 'users', user.id);
            await setDoc(userRef, {
              uid: user.id,
              username: email.split('@')[0],
              displayName: email.split('@')[0],
              email: email,
              lastSeen: Date.now(),
            }, { merge: true });
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
          }
        }
      }
      
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log('Google login initiated');
    setLoading(true);
    setError(null);
    try {
      console.log('Calling signInWithPopup...');
      const result = await signInWithPopup(auth, googleProvider);
      console.log('Google login success:', result.user.email);

      // Create/Update user profile in Firestore
      try {
        const userRef = doc(db, 'users', result.user.uid);
        await setDoc(userRef, {
          uid: result.user.uid,
          username: result.user.email?.split('@')[0] || 'user',
          displayName: result.user.displayName || result.user.email?.split('@')[0],
          photoURL: result.user.photoURL,
          email: result.user.email,
          lastSeen: Date.now(),
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${result.user.uid}`);
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Google login error:', err);
      setError(err instanceof Error ? err.message : 'Firebase Google Login failed');
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
              {mode === 'email' ? 'Welcome Back' : 'Verify Identity'}
            </p>
          </div>
        </div>

        {/* Auth Form */}
        <div className="space-y-8 relative z-10">
          {mode === 'email' ? (
            <form 
              onSubmit={handleSendOtp} 
              className="space-y-6"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all shadow-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button 
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50 disabled:translate-y-0"
              >
                {loading ? 'Sending OTP...' : 'Send Login OTP'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </form>
          ) : (
            <form 
              onSubmit={handleVerifyOtp} 
              className="space-y-6"
            >
              {error && (
                <div className="bg-red-50 border border-red-100 text-red-600 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-2 text-center">
                <p className="text-xs font-bold text-slate-500">We sent a code to <span className="text-indigo-600">{email}</span></p>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Verification Code</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <KeyRound className="w-5 h-5 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  </div>
                  <input 
                    type="text" 
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className="w-full bg-white border border-slate-200 rounded-3xl py-5 pl-14 pr-6 text-center text-2xl tracking-[0.5em] font-black text-slate-900 focus:ring-4 focus:ring-indigo-500/10 focus:bg-white focus:border-indigo-300 transition-all shadow-sm placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <button 
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 hover:bg-indigo-700 hover:translate-y-[-2px] active:translate-y-[0px] transition-all disabled:opacity-50 disabled:translate-y-0"
                >
                  {loading ? 'Verifying...' : 'Verify & Login'}
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                
                <div className="flex items-center justify-between px-2">
                  <button 
                    type="button"
                    onClick={() => setMode('email')}
                    className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                  >
                    Change Email
                  </button>
                  
                  <button 
                    type="button"
                    disabled={resendTimer > 0 || loading}
                    onClick={() => handleSendOtp()}
                    className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700 transition-colors disabled:text-slate-300 flex items-center gap-2"
                  >
                    {resendTimer > 0 ? `Resend in ${resendTimer}s` : (
                      <>
                        <RefreshCw className="w-3 h-3" />
                        Resend Code
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
              <span className="bg-white px-4 text-slate-400">Or continue with</span>
            </div>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white border border-slate-200 text-slate-700 py-5 rounded-3xl font-black uppercase tracking-widest shadow-sm flex items-center justify-center gap-3 hover:bg-slate-50 hover:border-slate-300 transition-all disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" />
            Google Account
          </button>

          <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Don't have an account? <Link href="/auth/signup" className="text-indigo-600 hover:underline">Sign up</Link>
          </p>
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
