"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  useEffect(() => {
    router.push('/auth/signup');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
    </div>
  );
}
