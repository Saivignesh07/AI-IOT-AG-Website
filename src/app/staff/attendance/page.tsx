'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  Printer,
  Filter,
  Lock,
  Building2,
  Users,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { exportToCSV, formatDate } from '@/lib/utils';
import { Attendance, Session, Student, ClassGrade, Section } from '@/types';

export default function StaffAttendanceMonitoringPage() {
  const { staffRecord, currentSchool } = useAuth();
  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);

  // Filter state
  const [selectedClassId, setSelectedClassId] = useState('all');
  const [selectedSectionId, setSelectedSectionId] = useState('all');
  const [timeView, setTimeView] = useState<'daily' | 'weekly' | 'monthly'>('daily');

  const loadData = () => {
    setSessions(dbRepository.getSessions(assignedSchoolId));
    setStudents(dbRepository.getStudents(assignedSchoolId));
    setClasses(dbRepository.getClasses());
    setSections(dbRepository.getSections(assignedSchoolId));
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, [assignedSchoolId]);

  // Attendance records for the latest completed session
  const latestSession = sessions.find((s) => s.status === 'completed');
  const attendanceRecords = latestSession ? dbRepository.getSessionAttendance(latestSession.id) : [];

  const handleExportCSV = () => {
    const exportData = attendanceRecords.map((att) => ({
      Roll_Number: att.student?.roll_number,
      Student_Name: att.student ? `${att.student.first_name} ${att.student.last_name}` : 'N/A',
      Session_Topic: latestSession?.topic,
      Session_Date: latestSession ? formatDate(latestSession.session_date) : 'N/A',
      Status: att.status.toUpperCase(),
      Faculty_Notes: att.notes || 'None',
    }));
    exportToCSV('attendance_monitoring_report', exportData);
  };

  const handlePrint = () => {
    window.print();
  };

  const presentCount = attendanceRecords.filter((a) => a.status === 'present').length;
  const lateCount = attendanceRecords.filter((a) => a.status === 'late').length;
  const absentCount = attendanceRecords.filter((a) => a.status === 'absent').length;
  const total = attendanceRecords.length;
  const percentage = total > 0 ? (((presentCount + lateCount) / total) * 100).toFixed(1) : null;

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Module 2: Attendance Monitoring
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only Supervision
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Attendance Monitoring & Verification</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Live attendance oversight for {staffRecord?.school?.name || 'Assigned School'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print PDF</span>
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportCSV} className="gap-1.5 text-xs font-semibold">
              <Download className="w-3.5 h-3.5" />
              <span>Download Excel / CSV</span>
            </Button>
          </div>
        </div>

        {/* Filters and View Switcher */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={selectedClassId}
                onChange={(e) => setSelectedClassId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium"
              >
                <option value="all">All Classes</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.grade_level}
                  </option>
                ))}
              </select>

              <select
                value={selectedSectionId}
                onChange={(e) => setSelectedSectionId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-800 font-medium"
              >
                <option value="all">All Sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Section {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Time View Toggles */}
            <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-center">
              <button
                onClick={() => setTimeView('daily')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'daily' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Daily
              </button>
              <button
                onClick={() => setTimeView('weekly')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'weekly' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeView('monthly')}
                className={`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  timeView === 'monthly' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>
        </Card>

        {/* Live Attendance Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 text-center">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1">{total}</span>
          </div>
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present Count</span>
            <span className="text-2xl font-extrabold text-emerald-800 mt-1">{presentCount}</span>
          </div>
          <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent Count</span>
            <span className="text-2xl font-extrabold text-rose-800 mt-1">{absentCount}</span>
          </div>
          <div className="bg-slate-900 text-white p-4 rounded-xl text-center">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Attendance Rate</span>
            <span className="text-xl sm:text-2xl font-extrabold text-white mt-1">
              {percentage !== null ? `${percentage}%` : 'Not Recorded'}
            </span>
          </div>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Session Attendance: {latestSession?.topic || 'No Active Lab Sessions'}</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                {latestSession
                  ? `Conducted on ${formatDate(latestSession.session_date)}`
                  : 'Awaiting first scheduled AI + IoT lab session by faculty'}
              </p>
            </div>
            <Badge variant="success">Faculty Audited</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Attendance Status</th>
                  <th className="px-6 py-3.5">Faculty Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {attendanceRecords.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-xs text-slate-400">
                      No attendance records logged yet for this filter.
                    </td>
                  </tr>
                ) : (
                  attendanceRecords.map((att) => (
                    <tr key={att.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                        {att.student?.roll_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {att.student?.first_name} {att.student?.last_name}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          variant={
                            att.status === 'present'
                              ? 'success'
                              : att.status === 'late'
                              ? 'warning'
                              : 'danger'
                          }
                        >
                          {att.status.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {att.notes || 'No notes logged'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
