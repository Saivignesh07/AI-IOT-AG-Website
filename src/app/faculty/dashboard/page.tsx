'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CalendarCheck,
  CheckCircle,
  Network,
  Award,
  Users,
  Clock,
  ArrowRight,
  ShieldCheck,
  PlusCircle,
  ClipboardList,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { StatsCard } from '@/components/charts/stats-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import { Session } from '@/types';

export default function FacultyDashboardPage() {
  const { user, facultyRecord, currentSchool } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [teamsCount, setTeamsCount] = useState(0);
  const [studentsCount, setStudentsCount] = useState(0);

  useEffect(() => {
    const update = () => {
      const allSessions = dbRepository.getSessions(undefined, facultyRecord?.id);
      setSessions(allSessions);
      setTeamsCount(dbRepository.getTeams().length);
      setStudentsCount(dbRepository.getStudents().length);
    };

    update();
    return dbRepository.subscribe(update);
  }, [facultyRecord]);

  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const upcomingSessions = sessions.filter((s) => s.status === 'scheduled');

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-8">
        {/* Welcome Banner */}
        <div className="bg-gradient-to-r from-emerald-900 to-green-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl relative overflow-hidden border border-emerald-800/40">
          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-400/30 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                AgriGuardian Faculty Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, {user?.full_name || 'Faculty Instructor'}
            </h1>
            <p className="text-sm text-emerald-200/80 mt-1">
              {facultyRecord?.specialization || 'AI & IoT Agriculture Specialist'} • {facultyRecord?.qualification}
            </p>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2 relative z-10">
            <Link href="/faculty/attendance">
              <Button variant="primary" size="sm" className="bg-emerald-600 hover:bg-emerald-500 font-semibold gap-1.5">
                <CheckCircle className="w-4 h-4" />
                <span>Mark Today&apos;s Attendance</span>
              </Button>
            </Link>
            <Link href="/faculty/teams">
              <Button variant="secondary" size="sm" className="font-semibold gap-1.5">
                <Network className="w-4 h-4" />
                <span>Manage 4-Student Teams</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* Top Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatsCard
            title="Assigned Sessions"
            value={sessions.length}
            subtitle="Current academic term"
            icon={CalendarCheck}
            color="emerald"
          />
          <StatsCard
            title="Students Handled"
            value={studentsCount}
            subtitle="Across enrolled sections"
            icon={Users}
            color="blue"
          />
          <StatsCard
            title="IoT Innovation Teams"
            value={teamsCount}
            subtitle="Supervised 4-member pods"
            icon={Network}
            color="purple"
          />
          <StatsCard
            title="Completed Sessions"
            value={completedSessions.length}
            subtitle={`${upcomingSessions.length} sessions upcoming`}
            icon={CheckCircle}
            color="amber"
          />
        </div>

        {/* Quick Launch Action Modules */}
        <div>
          <h3 className="text-base font-bold text-slate-900 mb-3">Academic Workflow Modules</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <Link href="/faculty/sessions">
              <Card className="p-4 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs mb-3">
                    1
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Class Selection</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Select school, class, section, and topic before entering the lab.
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <span>Start Class</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>

            <Link href="/faculty/attendance">
              <Card className="p-4 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs mb-3">
                    2
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Student Attendance</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Mark Present, Absent, Late with one-click bulk present toggle.
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-blue-700 flex items-center gap-1">
                  <span>Mark Register</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>

            <Link href="/faculty/teams">
              <Card className="p-4 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs mb-3">
                    3
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Team Management</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Form exactly 4-member teams, assign leaders, handle remainder pods.
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-purple-700 flex items-center gap-1">
                  <span>Manage Teams</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>

            <Link href="/faculty/progress">
              <Card className="p-4 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-xs mb-3">
                    4
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Team Progress</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Track 5 chapters, practical scores, project media, and remarks.
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-amber-700 flex items-center gap-1">
                  <span>Track Milestones</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>

            <Link href="/faculty/assessments">
              <Card className="p-4 hover:border-emerald-600 hover:shadow-md transition-all cursor-pointer h-full flex flex-col justify-between">
                <div>
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center font-bold text-xs mb-3">
                    5
                  </div>
                  <h4 className="font-bold text-sm text-slate-800">Monthly Assessment</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    100-mark rubric (Theory 20, Practical 30, Project 30, Creativity 10, Part 10).
                  </p>
                </div>
                <div className="mt-3 text-xs font-semibold text-rose-700 flex items-center gap-1">
                  <span>Grade Students</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Card>
            </Link>
          </div>
        </div>

        {/* Sessions Activity Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Teaching Sessions</CardTitle>
              <Link href="/faculty/sessions" className="text-xs text-emerald-700 font-semibold hover:underline">
                View All
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {upcomingSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No upcoming sessions assigned today.
                </div>
              ) : (
                upcomingSessions.slice(0, 4).map((session) => (
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
                    <Link href={`/faculty/attendance?sessionId=${session.id}`}>
                      <Button size="sm" variant="outline" className="text-xs">
                        Mark Attendance
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recently Conducted & Attendance Logged</CardTitle>
              <Badge variant="success">Audit Verified</Badge>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {completedSessions.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-400">
                  No completed sessions yet.
                </div>
              ) : (
                completedSessions.slice(0, 4).map((session) => (
                  <div key={session.id} className="p-4 flex items-center justify-between hover:bg-slate-50/60 transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-slate-800">{session.topic}</span>
                        <Badge variant="success">Completed</Badge>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {session.school?.name} • Class {session.class?.grade_level}{session.section?.name} • {formatDate(session.session_date)}
                      </p>
                    </div>
                    <Link href="/faculty/progress">
                      <Button size="sm" variant="ghost" className="text-xs text-emerald-800">
                        View Progress
                      </Button>
                    </Link>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
