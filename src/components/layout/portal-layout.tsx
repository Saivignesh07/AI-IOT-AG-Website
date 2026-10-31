'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { useAuth } from '@/lib/auth/auth-context';
import { UserRole } from '@/types';

interface PortalLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function PortalLayout({ children, allowedRoles }: PortalLayoutProps) {
  const { user, role, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (allowedRoles && role && !allowedRoles.includes(role)) {
        // Redirect to their own dashboard
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'faculty') router.push('/faculty/dashboard');
        else router.push('/staff/dashboard');
      }
    }
  }, [user, role, isLoading, allowedRoles, router]);

  // Close mobile sidebar automatically on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-emerald-800 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-semibold text-slate-700">Loading AgriGuardian LMS...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Mobile Backdrop Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-950/60 z-40 backdrop-blur-xs md:hidden animate-in fade-in duration-200"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (docked on desktop, slideout on mobile) */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0">
        <Topbar onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
