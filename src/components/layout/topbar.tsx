'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Bell,
  Database,
  Lock,
  ChevronDown,
  KeyRound,
  Menu,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { dbRepository } from '@/lib/db/repository';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { ChangePasswordModal } from '@/components/change-password-modal';
import { CloudSyncModal } from '@/components/cloud-sync-modal';
import { School } from '@/types';

interface TopbarProps {
  onToggleMobileMenu?: () => void;
}

export function Topbar({ onToggleMobileMenu }: TopbarProps) {
  const pathname = usePathname();
  const { role, currentSchool, setCurrentSchool, staffRecord, user } = useAuth();
  const [schools, setSchools] = useState<School[]>([]);
  const [showSchoolDropdown, setShowSchoolDropdown] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  useEffect(() => {
    setSchools(dbRepository.getSchools());
  }, []);

  // Format title from pathname
  const getPageTitle = () => {
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length <= 1) return 'Dashboard';
    const sub = parts[1];
    return sub
      .split('-')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  const isStaff = role === 'staff';

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 gap-2">
      {/* Page Title & Breadcrumb */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          type="button"
          onClick={onToggleMobileMenu}
          className="md:hidden p-2 -ml-1 text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-5 h-5 text-emerald-900" />
        </button>
        <div className="min-w-0">
          <h1 className="text-base sm:text-lg font-bold text-slate-800 leading-tight truncate">{getPageTitle()}</h1>
          <p className="text-xs text-slate-500 font-medium hidden sm:block truncate">
            {role === 'admin'
              ? 'AgriGuardian Master Admin Center'
              : role === 'faculty'
              ? 'AgriGuardian Faculty Academic Workspace'
              : 'School Staff Monitoring & Oversight (Read-Only)'}
          </p>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Cloud Database Status Pill & Sync Trigger */}
        <button
          onClick={() => setIsSyncModalOpen(true)}
          title="Cloud Database Synced - Click to view status & universal sync details"
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 transition-colors cursor-pointer"
        >
          <Database className="w-3.5 h-3.5 text-emerald-700" />
          <span className="text-[11px] hidden sm:inline">
            {isSupabaseConfigured ? 'Supabase Live' : 'Cloud DB'}
          </span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </button>

        {/* School Selector (Interactive for Admin/Faculty, Locked for Staff) */}
        <div className="relative hidden xs:block sm:block">
          {isStaff ? (
            <div
              className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200"
              title="School staff access is strictly restricted to your assigned school"
            >
              <Lock className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <span className="max-w-[80px] sm:max-w-[140px] truncate">{staffRecord?.school?.name || 'Assigned School'}</span>
            </div>
          ) : (
            <>
              <button
                onClick={() => setShowSchoolDropdown(!showSchoolDropdown)}
                className="flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
              >
                <Building2 className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                <span className="max-w-[80px] sm:max-w-[150px] truncate">
                  {currentSchool ? currentSchool.name : 'All Schools'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              </button>

              {showSchoolDropdown && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in slide-in-from-top-1">
                  <div className="px-3 py-1 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Select Filter School
                  </div>
                  {role === 'admin' && (
                    <button
                      onClick={() => {
                        setCurrentSchool(null);
                        setShowSchoolDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs font-medium hover:bg-emerald-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span>All Schools (Consolidated)</span>
                      {!currentSchool && <span className="text-emerald-700 font-bold">✓</span>}
                    </button>
                  )}
                  {schools.map((sch) => (
                    <button
                      key={sch.id}
                      onClick={() => {
                        setCurrentSchool(sch);
                        setShowSchoolDropdown(false);
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-emerald-50 text-slate-700 flex items-center justify-between cursor-pointer"
                    >
                      <span className="truncate">{sch.name}</span>
                      {currentSchool?.id === sch.id && <span className="text-emerald-700 font-bold">✓</span>}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Active Role Badge */}
        <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-800 text-white shadow-xs">
          <span className="hidden sm:inline opacity-80 text-[11px] uppercase tracking-wider">Role:</span>
          <span className="font-bold capitalize">{role}</span>
        </div>

        {/* Change Password Button */}
        <button
          onClick={() => setIsPasswordModalOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
          title="Change login password"
        >
          <KeyRound className="w-3.5 h-3.5 text-emerald-700" />
          <span className="hidden md:inline">Change Password</span>
        </button>

        {/* Notifications Icon */}
        <button
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors relative cursor-pointer"
          title="System notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-600" />
        </button>
      </div>

      {/* Change Password Modal */}
      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      {/* Cloud Sync & Database Modal */}
      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </header>
  );
}
