'use client';

import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Plus,
  Clock,
  Building2,
  GraduationCap,
  Layers,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { formatDate } from '@/lib/utils';
import { Session, School, Faculty, ClassGrade, Section, Chapter, Profile } from '@/types';

export default function TimetableManagementPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [faculty, setFaculty] = useState<(Faculty & { profile?: Profile })[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Filter
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');

  // Form State
  const [formData, setFormData] = useState({
    school_id: '',
    class_id: '',
    section_id: '',
    faculty_id: '',
    session_date: '2026-10-31',
    start_time: '09:00',
    end_time: '10:30',
    topic: '',
    chapter_id: '',
  });

  const loadData = () => {
    const schList = dbRepository.getSchools();
    const facList = dbRepository.getFaculty();
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();

    setSchools(schList);
    setFaculty(facList);
    setClasses(clsList);
    setSections(secList);

    const schoolFilter = selectedSchoolId === 'all' ? undefined : selectedSchoolId;
    setSessions(dbRepository.getSessions(schoolFilter));

    if (schList.length > 0 && !formData.school_id) {
      setFormData((prev) => ({
        ...prev,
        school_id: schList[0].id,
        class_id: clsList[0]?.id || '',
        section_id: secList[0]?.id || '',
        faculty_id: facList[0]?.id || '',
      }));
    }
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, [selectedSchoolId]);

  const handleCreateSession = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.topic || !formData.school_id || !formData.faculty_id) {
      alert('Please fill in Topic, School, and Faculty assignment.');
      return;
    }
    dbRepository.createSession({
      ...formData,
      status: 'scheduled',
    });
    setIsAddModalOpen(false);
  };

  const filteredSessions = sessions.filter((s) =>
    selectedSchoolId === 'all' ? true : s.school_id === selectedSchoolId
  );

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Timetable & Academic Scheduling</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Plan and allocate daily AI + IoT sessions across partner institutions
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Schedule New Session</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-700" />
            <span className="text-xs font-semibold text-slate-600">Filter Institution:</span>
            <select
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Partner Schools</option>
              {schools.map((sch) => (
                <option key={sch.id} value={sch.id}>
                  {sch.name}
                </option>
              ))}
            </select>
          </div>
          <span className="text-xs font-semibold text-slate-500 pr-2">
            {filteredSessions.length} Total Sessions
          </span>
        </div>

        {/* Sessions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredSessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      session.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    <CalendarCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-sm font-bold text-slate-900">{session.topic}</CardTitle>
                      <Badge variant={session.status === 'completed' ? 'success' : 'info'}>
                        {session.status === 'completed' ? 'Completed' : 'Scheduled'}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {session.school?.name} • Class {session.class?.grade_level}{session.section?.name}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Assigned Faculty</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-700" />
                      {session.faculty?.profile?.full_name || 'Agri Faculty'}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-400 text-[10px] uppercase font-bold block">Date & Timing</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-blue-700" />
                      {formatDate(session.session_date)} ({session.start_time} - {session.end_time})
                    </span>
                  </div>
                </div>

                {session.chapter && (
                  <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-100 flex items-center justify-between">
                    <span className="text-slate-400">Chapter Module:</span>
                    <span className="font-medium text-slate-800 truncate max-w-[220px]">
                      {session.chapter.title}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Schedule New Session */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Schedule New AI + IoT Academic Session"
          description="Allocate school, section, faculty instructor, and topic timing"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateSession} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Session Topic / Chapter Focus *
                </label>
                <input
                  type="text"
                  required
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g. ESP32 Wi-Fi Soil Sensor Telemetry Lab"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Partner School *
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
                >
                  {schools.map((sch) => (
                    <option key={sch.id} value={sch.id}>
                      {sch.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Assigned Faculty Instructor *
                </label>
                <select
                  value={formData.faculty_id}
                  onChange={(e) => setFormData({ ...formData, faculty_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
                >
                  {faculty.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.profile?.full_name} ({f.specialization})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Class Grade
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.grade_level}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Class Section
                </label>
                <select
                  value={formData.section_id}
                  onChange={(e) => setFormData({ ...formData, section_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
                >
                  {sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name} ({sec.room_number || 'Lab'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Session Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.session_date}
                  onChange={(e) => setFormData({ ...formData, session_date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    Start Time
                  </label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                    End Time
                  </label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Schedule
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
