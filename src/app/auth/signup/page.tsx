import { Suspense } from 'react';
import SignupForm from './signup-form';

/**
 * Next.js App Router Signup Page
 * 
 * FIX: useSearchParams() must be wrapped in a Suspense boundary to avoid 
 * "missing-suspense-with-csr-bailout" error during static generation.
 */
export default function SignupPage() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6">
      <Suspense fallback={
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-plum-700 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Initializing Secure Session...</p>
        </div>
      }>
        <SignupForm />
      </Suspense>
    </div>
  );
}
