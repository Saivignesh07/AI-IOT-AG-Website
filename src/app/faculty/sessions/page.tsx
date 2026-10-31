'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  Building2,
  GraduationCap,
  Layers,
  Clock,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Users,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { School, ClassGrade, Section, Chapter, Student } from '@/types';

export default function FacultyDailyClassSelectionPage() {
  const { user, facultyRecord } = useAuth();
  const router = useRouter();

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);

  // Selection State
  const [selectedSchoolId, setSelectedSchoolId] = useState('');
  const [selectedClassId, setSelectedClassId] = useState('');
  const [selectedSectionId, setSelectedSectionId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [sessionDate, setSessionDate] = useState('2026-10-31');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:30');
  const [topic, setTopic] = useState('ESP32 Wi-Fi Soil Sensor Telemetry Lab');

  // Enrolled students preview
  const [enrolledStudents, setEnrolledStudents] = useState<Student[]>([]);

  useEffect(() => {
    const schList = dbRepository.getSchools();
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();

    setSchools(schList);
    setClasses(clsList);
    setSections(secList);

    if (schList.length > 0 && !selectedSchoolId) {
      setSelectedSchoolId(schList[0].id);
    }
    if (clsList.length > 0 && !selectedClassId) {
      setSelectedClassId(clsList[0].id);
    }
  }, []);

  useEffect(() => {
    if (selectedClassId) {
      const chList = dbRepository.getChapters(selectedClassId);
      setChapters(chList);
      if (chList.length > 0) {
        setSelectedChapterId(chList[0].id);
        setTopic(chList[0].title);
      }
    }
  }, [selectedClassId]);

  useEffect(() => {
    if (selectedSchoolId && selectedClassId) {
      const secFiltered = sections.filter(
        (s) => s.school_id === selectedSchoolId && s.class_id === selectedClassId
      );
      if (secFiltered.length > 0) {
        setSelectedSectionId(secFiltered[0].id);
      }
    }
  }, [selectedSchoolId, selectedClassId, sections]);

  useEffect(() => {
    if (selectedSchoolId && selectedClassId) {
      const studs = dbRepository.getStudents(selectedSchoolId, selectedClassId, selectedSectionId || undefined);
      setEnrolledStudents(studs);
    }
  }, [selectedSchoolId, selectedClassId, selectedSectionId]);

  const handleCreateAndProceed = (target: 'attendance' | 'progress') => {
    if (!selectedSchoolId || !selectedClassId || !selectedSectionId) {
      alert('Please select School, Class, and Section.');
      return;
    }

    const facultyId = facultyRecord?.id || 'fa000000-0000-0000-0000-000000000001';

    const session = dbRepository.createSession({
      school_id: selectedSchoolId,
      class_id: selectedClassId,
      section_id: selectedSectionId,
      faculty_id: facultyId,
      session_date: sessionDate,
      start_time: startTime,
      end_time: endTime,
      chapter_id: selectedChapterId || undefined,
      topic: topic || 'AI & IoT Practical Session',
      status: 'scheduled',
    });

    if (target === 'attendance') {
      router.push(`/faculty/attendance?sessionId=${session.id}`);
    } else {
      router.push(`/faculty/progress?schoolId=${selectedSchoolId}&classId=${selectedClassId}&sectionId=${selectedSectionId}`);
    }
  };

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
              Module 1: Daily Class Selection
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Session Setup & Student Discovery</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure today&apos;s educational session to automatically populate your student roster
          </p>
        </div>

        {/* Impersonation Prevention Banner */}
        <Alert variant="info" className="border-blue-200 bg-blue-50/60 text-blue-900">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="w-4 h-4 text-blue-700" />
            <span>Anti-Impersonation Identity Guarantee:</span>
          </div>
          <p className="mt-0.5 text-xs">
            Logged in as <strong className="font-bold">{user?.full_name}</strong> ({user?.email}).
            Your faculty instructor identity is cryptographically recorded for every attendance check and mark submission.
          </p>
        </Alert>

        {/* Configuration Form Card */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 p-6 space-y-5 bg-white">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm">Class Session Parameters</h3>
              <p className="text-xs text-slate-400 mt-0.5">Select the target classroom parameters below</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 1. School Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  1. School Name *
                </label>
                <select
                  value={selectedSchoolId}
                  onChange={(e) => setSelectedSchoolId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800 font-medium"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Faculty Handling */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  2. Faculty Instructor *
                </label>
                <div className="px-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-700 font-semibold flex items-center justify-between">
                  <span className="truncate">{user?.full_name}</span>
                  <Badge variant="success">Verified ID</Badge>
                </div>
              </div>

              {/* 3. Class (6, 7, 8, 9) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  3. Class Level (6, 7, 8, 9) *
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800 font-medium"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.grade_level} ({c.name})
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  4. Section *
                </label>
                <select
                  value={selectedSectionId}
                  onChange={(e) => setSelectedSectionId(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800 font-medium"
                >
                  {sections
                    .filter(
                      (s) =>
                        (!selectedSchoolId || s.school_id === selectedSchoolId) &&
                        (!selectedClassId || s.class_id === selectedClassId)
                    )
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name} ({sec.room_number || 'Lab'})
                      </option>
                    ))}
                </select>
              </div>

              {/* 5. Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  5. Session Date *
                </label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              {/* 6. Session Timing */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  6. Session Timing *
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full px-2 py-2 text-xs border border-slate-300 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              {/* 7. Chapter / Topic Being Taught */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  7. Chapter / Topic Being Taught *
                </label>
                <select
                  value={selectedChapterId}
                  onChange={(e) => {
                    setSelectedChapterId(e.target.value);
                    const found = chapters.find((c) => c.id === e.target.value);
                    if (found) setTopic(found.title);
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800 mb-2 font-medium"
                >
                  {chapters.map((ch) => (
                    <option key={ch.id} value={ch.id}>
                      Chapter {ch.chapter_number}: {ch.title} ({ch.category})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Specific practical topic detail..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>
            </div>

            {/* Launch Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => handleCreateAndProceed('progress')}
                className="gap-2 text-xs sm:text-sm"
              >
                <span>Open Team Progress</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                variant="primary"
                onClick={() => handleCreateAndProceed('attendance')}
                className="gap-2 text-xs sm:text-sm"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Mark Attendance for this Class</span>
              </Button>
            </div>
          </Card>

          {/* Auto-Loaded Student Roster Preview */}
          <Card className="lg:col-span-1 p-5 bg-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Enrolled Students</h4>
                  <p className="text-[11px] text-slate-500">Auto-loaded for selected section</p>
                </div>
                <Badge variant="success">{enrolledStudents.length} Students</Badge>
              </div>

              <div className="mt-3 space-y-2 max-h-[360px] overflow-y-auto pr-1">
                {enrolledStudents.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No students currently enrolled in this section.
                  </div>
                ) : (
                  enrolledStudents.map((st) => (
                    <div
                      key={st.id}
                      className="p-2.5 rounded-lg border border-slate-100 hover:border-emerald-300 transition-colors flex items-center justify-between text-xs"
                    >
                      <div>
                        <p className="font-semibold text-slate-800">
                          {st.first_name} {st.last_name}
                        </p>
                        <p className="text-[10px] text-slate-400 font-mono">{st.roll_number}</p>
                      </div>
                      {st.team ? (
                        <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {st.team.name}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">No Team</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-[11px] text-slate-500">
              Ready to start? Click <strong>Mark Attendance</strong> to record student presence.
            </div>
          </Card>
        </div>
      </div>
    </PortalLayout>
  );
}
