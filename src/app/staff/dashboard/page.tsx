'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Users,
  CalendarCheck,
  Award,
  Network,
  TrendingUp,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { StatsCard } from '@/components/charts/stats-card';
import { AttendanceChart } from '@/components/charts/attendance-chart';
import { AssessmentDistributionChart } from '@/components/charts/assessment-distribution-chart';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import { Session } from '@/types';

export default function StaffDashboardPage() {
  const { user, staffRecord, currentSchool } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);

  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;

  useEffect(() => {
    const update = () => {
      const data = dbRepository.getDashboardMetrics('staff', assignedSchoolId);
      setMetrics(data);
      setRecentSessions(dbRepository.getSessions(assignedSchoolId));
    };

    update();
    return dbRepository.subscribe(update);
  }, [assignedSchoolId]);

  if (!metrics) return null;

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-8">
        {/* Top Header Card */}
        <div className="bg-gradient-to-r from-emerald-950 via-green-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-900/60 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" />
                School Authority Portal • Strict Read-Only Access
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {staffRecord?.school?.name || currentSchool?.name || 'Partner School Campus'}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-200/80 mt-1">
              Coordinator: {user?.full_name} ({staffRecord?.designation || 'Academic Authority'}) • Single-School Isolated View
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 relative z-10">
            <Link href="/staff/reports">
              <Button variant="secondary" size="sm" className="font-semibold gap-1.5 text-xs">
                <FileSpreadsheet className="w-4 h-4" />
                <span>Download School Reports</span>
              </Button>
            </Link>
            <Link href="/staff/students">
              <Button variant="outline" size="sm" className="bg-emerald-900/40 text-emerald-100 border-emerald-700/60 hover:bg-emerald-800 text-xs">
                <span>View Student Roster</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Read-Only Notice Alert */}
        <Alert variant="info" className="text-xs bg-slate-100 border-slate-200 text-slate-700">
          <div className="flex items-center gap-1.5 font-bold text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            <span>Database-Level Security Isolation Active:</span>
          </div>
          <p className="mt-0.5">
            Your login is restricted strictly to {staffRecord?.school?.name || 'your assigned school'}. Academic records (attendance and monthly grades) are submitted exclusively by AgriGuardian faculty and cannot be modified from this portal.
          </p>
        </Alert>

        {/* Dynamic Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Enrolled Students"
            value={metrics.totalStudents}
            subtitle="Campus AI+IoT cohorts"
            icon={Users}
            color="emerald"
          />
          <StatsCard
            title="Student Innovation Teams"
            value={metrics.totalTeams}
            subtitle="4-Member project pods"
            icon={Network}
            color="purple"
          />
          <StatsCard
            title="Overall Attendance"
            value={metrics.hasAttendanceData ? `${metrics.attendancePercentage}%` : 'Not Recorded'}
            subtitle={metrics.hasAttendanceData ? 'Recorded by faculty' : 'Awaiting first session'}
            icon={CalendarCheck}
            color="blue"
          />
          <StatsCard
            title="Monthly Assessment Avg"
            value={metrics.hasAssessmentData ? `${metrics.assessmentAverage} / 100` : 'Not Evaluated'}
            subtitle={metrics.hasAssessmentData ? 'Current term rubric' : 'Awaiting first grading'}
            icon={Award}
            color="amber"
          />
        </div>

        {/* Second Row Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Card className="p-5 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Course Milestone Progress</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">
                {metrics.courseCompletionPercentage > 0 ? `${metrics.courseCompletionPercentage}% Completed` : 'Term Commencing'}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">Chapters and practical labs verified</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-800 rounded-xl">
              <TrendingUp className="w-6 h-6" />
            </div>
          </Card>

          <Card className="p-5 flex items-center justify-between bg-white">
            <div>
              <p className="text-xs uppercase font-semibold text-slate-500">Participating Grades</p>
              <h4 className="text-2xl font-bold text-slate-900 mt-1">Classes 6, 7, 8, 9</h4>
              <p className="text-xs text-slate-500 mt-0.5">Standardized 5-chapter syllabus</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-800 rounded-xl">
              <Building2 className="w-6 h-6" />
            </div>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Attendance Trends for {staffRecord?.school?.name || 'Your School'}</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">Verified daily student presence records</p>
              </div>
              <Badge variant="success">Read-Only</Badge>
            </CardHeader>
            <CardContent>
              <AttendanceChart />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CardTitle>Internal Performance</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">School monthly assessment grades</p>
              </div>
            </CardHeader>
            <CardContent>
              <AssessmentDistributionChart />
            </CardContent>
          </Card>
        </div>

        {/* Recent Faculty Activity in School */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Recent Faculty Activities Conducted on Campus</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">Sessions handled by AgriGuardian instructors</p>
            </div>
            <Link href="/staff/attendance" className="text-xs text-emerald-700 font-semibold hover:underline">
              View Complete Attendance
            </Link>
          </CardHeader>
          <div className="divide-y divide-slate-100">
            {recentSessions.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">No recent sessions logged</div>
            ) : (
              recentSessions.slice(0, 5).map((session) => (
                <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-slate-800">{session.topic}</span>
                      <Badge variant={session.status === 'completed' ? 'success' : 'info'}>
                        {session.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Class {session.class?.grade_level}{session.section?.name} • Faculty: {session.faculty?.profile?.full_name || 'Dr. Arun Kumar'} • {session.start_time} - {session.end_time}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-slate-500">
                    {formatDate(session.session_date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
