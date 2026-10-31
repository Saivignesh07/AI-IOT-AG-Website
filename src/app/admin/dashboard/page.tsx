'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  GraduationCap,
  BookOpen,
  CalendarCheck,
  Award,
  TrendingUp,
  ArrowRight,
  ShieldCheck,
  Plus,
  Network,
  FileSpreadsheet,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { StatsCard } from '@/components/charts/stats-card';
import { AttendanceChart } from '@/components/charts/attendance-chart';
import { AssessmentDistributionChart } from '@/components/charts/assessment-distribution-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExcelImportModal } from '@/components/excel-import-modal';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import { School, Session } from '@/types';

export default function AdminDashboardPage() {
  const { currentSchool } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [schools, setSchools] = useState<School[]>([]);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  const [isExcelImportOpen, setIsExcelImportOpen] = useState(false);

  useEffect(() => {
    const update = () => {
      const data = dbRepository.getDashboardMetrics('admin', currentSchool?.id);
      setMetrics(data);
      setSchools(dbRepository.getSchools());
      setRecentSessions(dbRepository.getSessions(currentSchool?.id));
    };

    update();
    return dbRepository.subscribe(update);
  }, [currentSchool]);

  if (!metrics) return null;

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-8">
        {/* Top Welcome Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-900 to-green-950 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-emerald-800/40">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                AgriGuardian Multi-School AI + IoT Platform
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Master Admin Control Center
            </h1>
            <p className="text-sm text-emerald-200/80 mt-1 max-w-xl">
              Real-time monitoring and curriculum governance across {metrics.totalSchools} partner schools, {metrics.totalStudents} enrolled students, and {metrics.totalTeams} active innovation teams.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 relative z-10">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsExcelImportOpen(true)}
              className="font-semibold gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Import Excel (Sheets 6-9)</span>
            </Button>
            <Link href="/admin/schools">
              <Button variant="secondary" size="sm" className="font-semibold gap-1.5">
                <Building2 className="w-4 h-4" />
                <span>Manage Schools</span>
              </Button>
            </Link>
            <Link href="/admin/students">
              <Button variant="primary" size="sm" className="bg-emerald-700 hover:bg-emerald-600 font-semibold gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Students</span>
              </Button>
            </Link>
          </div>
          {/* Subtle background glow */}
          <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Registered Schools"
            value={metrics.totalSchools}
            subtitle="Designed for 100+ schools"
            icon={Building2}
            color="emerald"
            trend={{ value: '100% active', isPositive: true }}
          />
          <StatsCard
            title="Total Enrolled Students"
            value={metrics.totalStudents}
            subtitle="Across Classes 6, 7, 8, 9"
            icon={BookOpen}
            color="blue"
            trend={{ value: '12% new', isPositive: true }}
          />
          <StatsCard
            title="Active Student Teams"
            value={metrics.totalTeams}
            subtitle="4-Member AI+IoT Pods"
            icon={Network}
            color="purple"
            trend={{ value: '100% assigned', isPositive: true }}
          />
          <StatsCard
            title="Overall Attendance"
            value={`${metrics.attendancePercentage}%`}
            subtitle="Live verified logs"
            icon={CalendarCheck}
            color="amber"
            trend={{ value: '2.4%', isPositive: true }}
          />
        </div>

        {/* Second Row Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <Card className="p-5 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">AgriGuardian Faculty</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{metrics.totalFaculty} Specialist Instructors</h4>
              <p className="text-xs text-slate-500 mt-0.5">Assigned to active school sessions</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
              <GraduationCap className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Course Completion</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{metrics.courseCompletionPercentage}% Completed</h4>
              <p className="text-xs text-slate-500 mt-0.5">Curriculum milestone progression</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Assessment Average</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">{metrics.assessmentAverage} / 100</h4>
              <p className="text-xs text-slate-500 mt-0.5">Average monthly internal score</p>
            </div>
            <div className="p-3 bg-purple-50 text-purple-800 rounded-xl">
              <Award className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Attendance Trends Across Partner Schools</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  Daily presence, late arrivals, and excused leaves
                </p>
              </div>
              <Badge variant="success">Live Synced</Badge>
            </CardHeader>
            <CardContent>
              <AttendanceChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Assessment Performance</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Internal grades distribution</p>
              </div>
            </CardHeader>
            <CardContent>
              <AssessmentDistributionChart />
            </CardContent>
          </Card>
        </div>

        {/* Recently Conducted & Upcoming Sessions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recently Conducted Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Recently Conducted Sessions</CardTitle>
              <Link href="/admin/timetable" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                <span>View Timetable</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {recentSessions.filter((s) => s.status === 'completed').length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No completed sessions logged yet</div>
              ) : (
                recentSessions
                  .filter((s) => s.status === 'completed')
                  .slice(0, 4)
                  .map((session) => (
                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">{session.topic}</span>
                          <Badge variant="success">Completed</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {session.school?.name} • Class {session.class?.grade_level}{session.section?.name} • {session.faculty?.profile?.full_name || 'Assigned Faculty'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-slate-500 shrink-0">
                        {formatDate(session.session_date)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </Card>

          {/* Upcoming Sessions */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Scheduled Sessions</CardTitle>
              <Link href="/admin/timetable" className="text-xs text-emerald-700 font-semibold hover:underline flex items-center gap-1">
                <span>Schedule New</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {recentSessions.filter((s) => s.status === 'scheduled').length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">No upcoming sessions scheduled</div>
              ) : (
                recentSessions
                  .filter((s) => s.status === 'scheduled')
                  .slice(0, 4)
                  .map((session) => (
                    <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-xs text-slate-800">{session.topic}</span>
                          <Badge variant="info">Upcoming</Badge>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          {session.school?.name} • Class {session.class?.grade_level}{session.section?.name} • {session.start_time} - {session.end_time}
                        </p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-700 shrink-0">
                        {formatDate(session.session_date)}
                      </span>
                    </div>
                  ))
              )}
            </div>
          </Card>
        </div>

        {/* Registered Schools Overview Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Partner School Deployment Status</h3>
              <p className="text-xs text-slate-500">Live operational status across all participating campuses</p>
            </div>
            <Link href="/admin/schools">
              <Button variant="outline" size="sm">
                <span>View All ({schools.length})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {schools.map((sch) => {
              const studentCount = dbRepository.getStudents(sch.id).length;
              const teamCount = dbRepository.getTeams(sch.id).length;
              return (
                <Card key={sch.id} className="p-5 hover:border-emerald-500 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold text-xs">
                      {sch.code.substring(0, 2)}
                    </div>
                    <Badge variant={sch.is_active ? 'success' : 'default'}>
                      {sch.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 mt-3 truncate">{sch.name}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">{sch.city}, {sch.state}</p>
                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Enrolled</span>
                      <span className="font-bold text-slate-800">{studentCount} Students</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">Teams</span>
                      <span className="font-bold text-emerald-700">{teamCount} Teams</span>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Excel Import Modal */}
      <ExcelImportModal
        isOpen={isExcelImportOpen}
        onClose={() => setIsExcelImportOpen(false)}
      />
    </PortalLayout>
  );
}
