'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Lock, Mail, ArrowRight, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login, switchUser } = useAuth();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsSubmitting(true);
    try {
      const ok = await login(email);
      if (!ok) {
        setError('No registered account found with this email. Use one of the demo credentials below.');
      }
    } catch {
      setError('Authentication failed. Please verify your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('••••••••');
    switchUser(demoEmail);
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(#14532D_1px,transparent_1px)] [background-size:24px_24px] opacity-30" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-green-400 shadow-xl shadow-emerald-950/60 mb-3 border border-emerald-400/30">
            <Leaf className="w-8 h-8 text-emerald-950" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            AGRIGUARDIAN <span className="text-emerald-400">LMS</span>
          </h2>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-400 font-medium max-w-sm mx-auto">
            Multi-School AI + IoT Education Management & Monitoring Platform
          </p>
        </div>

        {/* Login Card */}
        <div className="mt-8 bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          {error && (
            <Alert variant="error" className="mb-5">
              {error}
            </Alert>
          )}

          <form className="space-y-4" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agriguardian.io"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Password
                </label>
                <a
                  href="#demo"
                  onClick={() => alert('Password reset links are managed by your AgriGuardian Administrator.')}
                  className="text-xs text-emerald-700 hover:text-emerald-800 font-medium"
                >
                  Forgot password?
                </a>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-700 focus:border-transparent text-slate-800"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full mt-2 font-semibold flex items-center justify-center gap-2"
              isLoading={isSubmitting}
            >
              <span>Sign In to Portal</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </form>

          {/* Preset One-Click Portals */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                ⚡ Instant One-Click Demo Access
              </span>
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin@agriguardian.io')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-amber-400 hover:bg-amber-50/50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-amber-800 flex items-center gap-1.5">
                    <span>👑 AgriGuardian Admin</span>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded">Master Control</span>
                  </div>
                  <div className="text-[11px] text-slate-500">admin@agriguardian.io</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-amber-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('dr.arun@agriguardian.io')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-blue-800 flex items-center gap-1.5">
                    <span>🎓 AgriGuardian Faculty</span>
                    <span className="text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded">Attendance & Grading</span>
                  </div>
                  <div className="text-[11px] text-slate-500">dr.arun@agriguardian.io (Dr. Arun Kumar)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-blue-600" />
              </button>

              <button
                type="button"
                onClick={() => handleDemoLogin('staff.jainschool@school.edu')}
                className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 transition-colors flex items-center justify-between group cursor-pointer"
              >
                <div>
                  <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-900 flex items-center gap-1.5">
                    <span>🏫 School Staff (Shree A G Jain School)</span>
                    <span className="text-[10px] font-semibold bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded">Strict Read-Only</span>
                  </div>
                  <div className="text-[11px] text-slate-500">staff.jainschool@school.edu (Campus Authority)</div>
                </div>
                <CheckCircle2 className="w-4 h-4 text-slate-300 group-hover:text-emerald-700" />
              </button>
            </div>
          </div>
        </div>

        {/* Security Notice */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Protected by Supabase Auth with PostgreSQL Row Level Security (RLS) policies.
        </p>
      </div>
    </div>
  );
}
