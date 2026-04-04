import React from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 rounded-full blur-[120px] animate-pulse delay-1000" />
      
      <main className="w-full max-w-md relative z-10">
        {children}
      </main>
      
      <footer className="mt-12 text-center relative z-10">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.5em]">
          &copy; 2026 ZYNOCHAT AI SYSTEMS
        </p>
      </footer>
    </div>
  );
}
