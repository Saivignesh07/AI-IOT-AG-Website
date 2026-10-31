'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  FileBarChart,
  ShieldAlert,
  ClipboardList,
  CheckCircle,
  Network,
  LogOut,
  Leaf,
  Layers,
  FileSpreadsheet,
  KeyRound,
  Database,
  X,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/auth-context';
import { ChangePasswordModal } from '@/components/change-password-modal';
import { CloudSyncModal } from '@/components/cloud-sync-modal';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export function Sidebar({ isMobileOpen = false, onCloseMobile }: SidebarProps) {
  const pathname = usePathname();
  const { user, role, logout, currentSchool, staffRecord } = useAuth();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = React.useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = React.useState(false);

  const adminNav = [
    { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Schools', href: '/admin/schools', icon: Building2 },
    { name: 'Faculty', href: '/admin/faculty', icon: GraduationCap },
    { name: 'School Staff', href: '/admin/staff', icon: Users },
    { name: 'Students', href: '/admin/students', icon: BookOpen },
    { name: 'Classes & Sections', href: '/admin/classes', icon: Layers },
    { name: 'Timetable & Sessions', href: '/admin/timetable', icon: CalendarCheck },
    { name: 'Reports & Analytics', href: '/admin/reports', icon: FileBarChart },
    { name: 'Audit Logs', href: '/admin/audit-logs', icon: ShieldAlert },
  ];

  const facultyNav = [
    { name: 'Dashboard', href: '/faculty/dashboard', icon: LayoutDashboard },
    { name: '1. Class Sessions', href: '/faculty/sessions', icon: CalendarCheck },
    { name: '2. Student Attendance', href: '/faculty/attendance', icon: CheckCircle },
    { name: '3. Team Management', href: '/faculty/teams', icon: Network },
    { name: '4. Progress & Projects', href: '/faculty/progress', icon: ClipboardList },
    { name: '5. Monthly Assessment', href: '/faculty/assessments', icon: Award },
  ];

  const staffNav = [
    { name: 'Dashboard', href: '/staff/dashboard', icon: LayoutDashboard },
    { name: '1. Student Details', href: '/staff/students', icon: BookOpen },
    { name: '2. Attendance Monitoring', href: '/staff/attendance', icon: CheckCircle },
    { name: '3. Team Progress', href: '/staff/teams', icon: Network },
    { name: '4. Monthly Assessments', href: '/staff/assessments', icon: Award },
    { name: '5. Download Reports', href: '/staff/reports', icon: FileSpreadsheet },
  ];

  const navItems = role === 'admin' ? adminNav : role === 'faculty' ? facultyNav : staffNav;

  return (
    <aside
      className={cn(
        'bg-[#0F3D20] text-emerald-50 flex flex-col h-screen border-r border-emerald-950/60 z-50 md:z-30 transition-transform duration-300 ease-in-out',
        // Desktop docked
        'md:sticky md:top-0 md:w-64 md:shrink-0 md:translate-x-0 md:flex',
        // Mobile drawer
        'fixed inset-y-0 left-0 w-72 shadow-2xl',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      )}
    >
      {/* Brand Header */}
      <div className="p-4 sm:p-5 border-b border-emerald-900/60 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-green-400 flex items-center justify-center text-emerald-950 font-bold shadow-md shadow-emerald-950/50 shrink-0">
            <Leaf className="w-6 h-6 text-emerald-950" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold tracking-wider text-base text-white">AGRIGUARDIAN</span>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-400/30">
                LMS
              </span>
            </div>
            <p className="text-[11px] text-emerald-300/80 font-medium tracking-tight truncate">
              AI + IoT School Platform
            </p>
          </div>
        </div>

        {/* Mobile Close Button */}
        <button
          onClick={onCloseMobile}
          className="md:hidden p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/70 transition-colors"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Role & School Badge */}
      <div className="px-5 py-3 bg-[#0B2E18] border-b border-emerald-900/40">
        <div className="flex items-center justify-between text-xs">
          <span className="text-emerald-300/70 uppercase tracking-wider font-semibold text-[10px]">
            Portal Mode
          </span>
          <span
            className={cn(
              'px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider',
              role === 'admin'
                ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                : role === 'faculty'
                ? 'bg-blue-400/20 text-blue-300 border border-blue-400/30'
                : 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
            )}
          >
            {role === 'admin' ? 'Master Admin' : role === 'faculty' ? 'Agri Faculty' : 'School Staff'}
          </span>
        </div>
        <div className="mt-1.5 truncate">
          <p className="text-xs font-medium text-white truncate">
            {role === 'staff' && staffRecord?.school
              ? staffRecord.school.name
              : currentSchool
              ? currentSchool.name
              : 'All Schools (Multi-Tenant)'}
          </p>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-emerald-400/60 mb-2">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && item.href !== '/faculty/dashboard' && item.href !== '/staff/dashboard' && pathname.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onCloseMobile?.()}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs sm:text-sm font-medium transition-all group',
                isActive
                  ? 'bg-emerald-600/30 text-white font-semibold border-l-4 border-emerald-400 shadow-xs pl-2.5'
                  : 'text-emerald-100/70 hover:bg-emerald-900/40 hover:text-white'
              )}
            >
              <Icon
                className={cn(
                  'w-4 h-4 transition-colors shrink-0',
                  isActive ? 'text-emerald-300' : 'text-emerald-300/60 group-hover:text-emerald-200'
                )}
              />
              <span className="truncate">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-emerald-900/60 bg-[#0B2E18]">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-9 h-9 rounded-full bg-emerald-800 text-emerald-200 font-bold flex items-center justify-center text-xs shrink-0 border border-emerald-600/40">
            {user?.full_name?.substring(0, 2).toUpperCase() || 'AG'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-semibold text-white truncate">{user?.full_name || 'AgriGuardian User'}</p>
            <p className="text-[11px] text-emerald-300/70 truncate">{user?.email}</p>
          </div>
        </div>
        <div className="space-y-1.5">
          <button
            onClick={() => setIsSyncModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-200 hover:text-white bg-emerald-900/50 hover:bg-emerald-900 transition-colors border border-emerald-700/50 cursor-pointer shadow-xs"
          >
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cloud Database</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse ml-auto" />
          </button>
          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-200/90 hover:text-white hover:bg-emerald-900/60 transition-colors border border-emerald-800/40 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Change Password</span>
          </button>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-300 hover:text-rose-100 hover:bg-rose-950/40 transition-colors border border-rose-900/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      <ChangePasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <CloudSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
      />
    </aside>
  );
}
