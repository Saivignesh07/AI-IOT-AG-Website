'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';

export default function HomePage() {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else {
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'faculty') router.push('/faculty/dashboard');
        else router.push('/staff/dashboard');
      }
    }
  }, [user, role, isLoading, router]);

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-white">Loading AgriGuardian LMS...</p>
      </div>
    </div>
  );
}
