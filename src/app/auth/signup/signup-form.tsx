"use client";

import React, { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Mail, Lock, ArrowRight, Shield, Globe, MessageSquare, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

/**
 * Signup Form Component
 * 
 * This component uses useSearchParams() and must be wrapped in a 
 * Suspense boundary in the parent page to avoid build errors.
 */
export default function SignupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [mode, setMode] = useState<'signup' | 'otp'>('signup');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setMode('otp');
  };

  const handleVerify = () => {
    // Logic for verification
    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-md space-y-12">
      {/* Logo Section */}
      <div className="flex flex-col items-center text-center space-y-6">
        <div className="relative">
          <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-plum-700/10 ring-4 ring-white/20 animate-float overflow-hidden">
            <img 
              src="https://ais-pre-jf6oraeqfibrthrnginvim-354886298737.asia-east1.run.app/api/attachments/8pPLC35JiGehVSMet5YkBf1VFDM2/zyno_logo.png" 
              alt="Zyno Logo" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-xl ring-2 ring-gray-50">
            <Shield className="w-6 h-6 text-plum-700" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-5xl font-black tracking-tighter text-charcoal">ZYNOCHAT</h1>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em]">Create Your Account</p>
        </div>
      </div>

      {/* Auth Form */}
      <div className="space-y-8">
        <AnimatePresence mode="wait">
          {mode === 'otp' ? (
            <motion.div
              key="otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-black text-charcoal tracking-tight">Verify Email</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enter the 6-digit code sent to {email}</p>
              </div>
              
              <div className="flex justify-between gap-2">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    id={`otp-${i}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    className="w-12 h-16 bg-gray-100 border-none rounded-2xl text-center text-2xl font-black text-charcoal focus:ring-4 focus:ring-plum-500/20 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerify}
                className="w-full bg-plum-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Verify & Continue
                <CheckCircle2 className="w-5 h-5" />
              </button>
            </motion.div>
          ) : (
            <motion.form
              key="signup"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleEmailSubmit}
              className="space-y-6"
            >
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2">Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400 group-focus-within:text-plum-700 transition-colors" />
                  </div>
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-gray-100 border-none rounded-3xl py-5 pl-14 pr-6 text-sm font-bold text-charcoal focus:ring-4 focus:ring-plum-500/20 focus:bg-white transition-all shadow-inner placeholder:text-gray-400"
                  />
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-plum-700 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-plum-700/20 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all"
              >
                Get OTP Code
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.form>
          )}
        </AnimatePresence>
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
