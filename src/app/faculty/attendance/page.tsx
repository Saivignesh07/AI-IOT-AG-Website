'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  CheckCircle,
  XCircle,
  Clock,
  UserCheck,
  CheckCircle2,
  CalendarCheck,
  AlertCircle,
  Building2,
  Save,
  Users,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { AttendanceStatus, Student, Session } from '@/types';

function FacultyAttendanceContent() {
  const { user, facultyRecord } = useAuth();
  const searchParams = useSearchParams();
  const sessionIdParam = searchParams.get('sessionId');

  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>(sessionIdParam || '');
  const [sessionDetails, setSessionDetails] = useState<Session | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendanceMap, setAttendanceMap] = useState<Record<string, { status: AttendanceStatus; notes: string }>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const sessList = dbRepository.getSessions();
    setSessions(sessList);

    if (sessList.length > 0 && !selectedSessionId) {
      setSelectedSessionId(sessList[0].id);
    }
  }, [sessionIdParam]);

  useEffect(() => {
    if (selectedSessionId) {
      const sess = sessions.find((s) => s.id === selectedSessionId) || null;
      setSessionDetails(sess);

      if (sess) {
        const studentList = dbRepository.getStudents(sess.school_id, sess.class_id, sess.section_id);
        setStudents(studentList);

        // Check if attendance already exists for this session
        const existingAttendance = dbRepository.getSessionAttendance(selectedSessionId);
        const map: Record<string, { status: AttendanceStatus; notes: string }> = {};

        studentList.forEach((st) => {
          const found = existingAttendance.find((a) => a.student_id === st.id);
          if (found) {
            map[st.id] = { status: found.status, notes: found.notes || '' };
          } else {
            map[st.id] = { status: 'present', notes: '' };
          }
        });

        setAttendanceMap(map);
        setIsSaved(existingAttendance.length > 0);
      }
    }
  }, [selectedSessionId, sessions]);

  // Mark all present
  const handleMarkAllPresent = () => {
    const updated = { ...attendanceMap };
    students.forEach((st) => {
      updated[st.id] = { ...updated[st.id], status: 'present' };
    });
    setAttendanceMap(updated);
    setIsSaved(false);
  };

  // Toggle individual status
  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status,
      },
    }));
    setIsSaved(false);
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    setAttendanceMap((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes,
      },
    }));
    setIsSaved(false);
  };

  // Submit attendance
  const handleSubmitAttendance = () => {
    if (!selectedSessionId) return;
    setIsSubmitting(true);

    const records = students.map((st) => ({
      student_id: st.id,
      status: attendanceMap[st.id]?.status || 'present',
      notes: attendanceMap[st.id]?.notes || '',
    }));

    const facultyId = facultyRecord?.id || 'fa000000-0000-0000-0000-000000000001';

    try {
      dbRepository.submitAttendance(selectedSessionId, records, facultyId);
      setIsSaved(true);
      alert('Attendance saved successfully and logged in system audit trail!');
    } catch (e: any) {
      alert('Error submitting attendance: ' + e.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculations
  const totalCount = students.length;
  const presentCount = Object.values(attendanceMap).filter((a) => a.status === 'present').length;
  const lateCount = Object.values(attendanceMap).filter((a) => a.status === 'late').length;
  const absentCount = Object.values(attendanceMap).filter((a) => a.status === 'absent').length;
  const excusedCount = Object.values(attendanceMap).filter((a) => a.status === 'excused').length;
  const attendanceRate = totalCount > 0 ? Number((((presentCount + lateCount) / totalCount) * 100).toFixed(1)) : 100;

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                Module 2: Student Attendance
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Attendance Register & Live Telemetry</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verify laboratory attendance per session with immutable faculty cryptographic attribution
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleMarkAllPresent} className="gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Mark All Present</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmitAttendance}
              isLoading={isSubmitting}
              className="gap-1.5 text-xs font-semibold"
            >
              <Save className="w-4 h-4" />
              <span>{isSaved ? 'Update Attendance' : 'Save & Submit Attendance'}</span>
            </Button>
          </div>
        </div>

        {/* Session Selector Banner */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-xs font-semibold text-slate-700">Select Session to Mark:</span>
              <select
                value={selectedSessionId}
                onChange={(e) => setSelectedSessionId(e.target.value)}
                className="text-xs border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800 font-semibold"
              >
                {sessions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.topic} ({s.school?.name} - Class {s.class?.grade_level}{s.section?.name})
                  </option>
                ))}
              </select>
            </div>
            {isSaved && (
              <Badge variant="success" className="gap-1 self-start sm:self-center">
                <CheckCircle className="w-3.5 h-3.5" />
                <span>Attendance Logged & Audited</span>
              </Badge>
            )}
          </div>
        </Card>

        {/* Live Attendance Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-white p-3 rounded-xl border border-slate-200 text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Students</span>
            <span className="text-xl font-extrabold text-slate-900 mt-0.5">{totalCount}</span>
          </div>
          <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-emerald-700 block">Present</span>
            <span className="text-xl font-extrabold text-emerald-800 mt-0.5">{presentCount}</span>
          </div>
          <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-amber-700 block">Late</span>
            <span className="text-xl font-extrabold text-amber-800 mt-0.5">{lateCount}</span>
          </div>
          <div className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-center shadow-xs">
            <span className="text-[10px] uppercase font-bold text-rose-700 block">Absent</span>
            <span className="text-xl font-extrabold text-rose-800 mt-0.5">{absentCount}</span>
          </div>
          <div className="bg-slate-900 text-white p-3 rounded-xl text-center shadow-xs col-span-2 sm:col-span-1">
            <span className="text-[10px] uppercase font-bold text-emerald-400 block">Attendance Rate</span>
            <span className="text-xl font-extrabold text-white mt-0.5">{attendanceRate}%</span>
          </div>
        </div>

        {/* Attendance Marking Table */}
        <Card>
          <CardHeader>
            <div>
              <CardTitle>Laboratory Attendance Roster</CardTitle>
              <p className="text-xs text-slate-500 mt-0.5">
                Instructor:{' '}
                <strong className="text-slate-800 font-semibold">{user?.full_name}</strong> •{' '}
                {sessionDetails?.school?.name} (Class {sessionDetails?.class?.grade_level}{sessionDetails?.section?.name})
              </p>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              Showing {students.length} Students
            </span>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">IoT Innovation Team</th>
                  <th className="px-6 py-3.5 text-center">Attendance Status</th>
                  <th className="px-6 py-3.5">Faculty Notes / Observation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {students.map((st) => {
                  const currentStatus = attendanceMap[st.id]?.status || 'present';
                  return (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                        {st.roll_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="px-6 py-4">
                        {st.team ? (
                          <span className="font-semibold text-emerald-800 text-xs">
                            {st.team.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'present')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'present'
                                ? 'bg-emerald-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                            }`}
                          >
                            Present
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'late')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'late'
                                ? 'bg-amber-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                            }`}
                          >
                            Late
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'absent')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'absent'
                                ? 'bg-rose-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-rose-100 hover:text-rose-800'
                            }`}
                          >
                            Absent
                          </button>
                          <button
                            type="button"
                            onClick={() => handleStatusChange(st.id, 'excused')}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                              currentStatus === 'excused'
                                ? 'bg-sky-700 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-sky-100 hover:text-sky-800'
                            }`}
                          >
                            Excused
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={attendanceMap[st.id]?.notes || ''}
                          onChange={(e) => handleNotesChange(st.id, e.target.value)}
                          placeholder="e.g. Led wiring test bench"
                          className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-600"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}

export default function FacultyAttendancePage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-600">Loading Attendance Register...</div>}>
      <FacultyAttendanceContent />
    </React.Suspense>
  );
}
