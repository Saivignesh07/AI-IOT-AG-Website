'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  CheckCircle2,
  Save,
  Building2,
  Layers,
  Calendar,
  AlertCircle,
  HelpCircle,
  TrendingUp,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { calculateAssessmentGrade } from '@/lib/utils';
import { School, ClassGrade, Section, Student, Assessment, AssessmentMarks } from '@/types';

export default function FacultyMonthlyAssessmentsPage() {
  const { user } = useAuth();

  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Selection
  const [schoolId, setSchoolId] = useState('');
  const [classId, setClassId] = useState('');
  const [sectionId, setSectionId] = useState('');
  const [month, setMonth] = useState('October 2026');
  const [selectedStudentId, setSelectedStudentId] = useState('');

  // Assessment Marks Inputs
  const [theory, setTheory] = useState<number>(18);
  const [practical, setPractical] = useState<number>(27);
  const [project, setProject] = useState<number>(28);
  const [creativity, setCreativity] = useState<number>(9);
  const [participation, setParticipation] = useState<number>(9);
  const [facultyRemarks, setFacultyRemarks] = useState(
    'Demonstrated leadership in breadboard sensor wiring and fast comprehension.'
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingMarks, setExistingMarks] = useState<AssessmentMarks[]>([]);

  const loadData = () => {
    const schList = dbRepository.getSchools();
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();

    setSchools(schList);
    setClasses(clsList);
    setSections(secList);

    if (schList.length > 0 && !schoolId) setSchoolId(schList[0].id);
    if (clsList.length > 0 && !classId) setClassId(clsList[0].id);
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  useEffect(() => {
    if (schoolId && classId) {
      const secFiltered = sections.filter(
        (s) => s.school_id === schoolId && s.class_id === classId
      );
      if (secFiltered.length > 0) {
        setSectionId(secFiltered[0].id);
      }
    }
  }, [schoolId, classId, sections]);

  useEffect(() => {
    if (schoolId && classId) {
      const stds = dbRepository.getStudents(schoolId, classId, sectionId || undefined);
      setStudents(stds);
      if (stds.length > 0 && !selectedStudentId) {
        setSelectedStudentId(stds[0].id);
      }

      // Load assessment marks for this rubric
      const assessment = dbRepository.getOrCreateAssessment(schoolId, classId, sectionId, month);
      const marksList = dbRepository.getAssessmentMarks(assessment.id);
      setExistingMarks(marksList);
    }
  }, [schoolId, classId, sectionId, month]);

  // Load selected student's marks if already entered
  useEffect(() => {
    if (selectedStudentId && existingMarks.length > 0) {
      const found = existingMarks.find((m) => m.student_id === selectedStudentId);
      if (found) {
        setTheory(found.theory_marks);
        setPractical(found.practical_marks);
        setProject(found.project_marks);
        setCreativity(found.creativity_marks);
        setParticipation(found.participation_marks);
        setFacultyRemarks(found.faculty_remarks || '');
      }
    }
  }, [selectedStudentId, existingMarks]);

  // Live Auto-Calculation
  const calculation = calculateAssessmentGrade(
    Number(theory) || 0,
    Number(practical) || 0,
    Number(project) || 0,
    Number(creativity) || 0,
    Number(participation) || 0
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!schoolId || !classId || !sectionId || !selectedStudentId) {
      alert('Please select all student parameters.');
      return;
    }

    setIsSubmitting(true);
    try {
      const assessment = dbRepository.getOrCreateAssessment(schoolId, classId, sectionId, month);
      dbRepository.submitStudentMarks(
        assessment.id,
        selectedStudentId,
        {
          theory: Number(theory),
          practical: Number(practical),
          project: Number(project),
          creativity: Number(creativity),
          participation: Number(participation),
        },
        facultyRemarks,
        user?.email || 'faculty@agriguardian.io'
      );

      // refresh
      const updatedMarks = dbRepository.getAssessmentMarks(assessment.id);
      setExistingMarks(updatedMarks);

      alert('Assessment submitted successfully and synced to the School Staff Portal!');
    } catch (err: any) {
      alert('Submission error: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
              Module 5: Monthly Internal Assessment
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900">Standardized 100-Mark Internal Assessment</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Conduct monthly evaluations across Theory (20), Practical (30), Project (30), Creativity (10), and Participation (10)
          </p>
        </div>

        {/* Selection Bar */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                1. Partner School
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                2. Class Grade
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.grade_level}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                3. Section
              </label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                {sections
                  .filter((s) => s.school_id === schoolId && s.class_id === classId)
                  .map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      Section {sec.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                4. Assessment Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-800"
              >
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Assessment Entry & Live Calculation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form */}
          <Card className="lg:col-span-2 p-6 bg-white space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Marks Entry Form</h3>
                <p className="text-xs text-slate-400 mt-0.5">Select individual student to record or update score</p>
              </div>
              <Badge variant="purple">{month}</Badge>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 5. Select Student */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Select Student from Class Roster *
                </label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white font-medium text-slate-800"
                >
                  {students.map((st) => {
                    const hasSubmitted = existingMarks.some((m) => m.student_id === st.id);
                    return (
                      <option key={st.id} value={st.id}>
                        {st.roll_number} - {st.first_name} {st.last_name} {hasSubmitted ? '✓ (Evaluated)' : ''}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* 5 Rubric Criteria with Max Mark Enforcement */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Theoretical Knowledge</label>
                    <span className="text-[11px] font-bold text-slate-400">Max: 20</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    step="0.5"
                    required
                    value={theory}
                    onChange={(e) => setTheory(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Practical Skills</label>
                    <span className="text-[11px] font-bold text-slate-400">Max: 30</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    required
                    value={practical}
                    onChange={(e) => setPractical(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Project Performance</label>
                    <span className="text-[11px] font-bold text-slate-400">Max: 30</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="30"
                    step="0.5"
                    required
                    value={project}
                    onChange={(e) => setProject(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Creativity & Innovation</label>
                    <span className="text-[11px] font-bold text-slate-400">Max: 10</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={creativity}
                    onChange={(e) => setCreativity(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Class Participation & Collaboration</label>
                    <span className="text-[11px] font-bold text-slate-400">Max: 10</span>
                  </div>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.5"
                    required
                    value={participation}
                    onChange={(e) => setParticipation(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                  />
                </div>
              </div>

              {/* Faculty Remarks */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Faculty Observations & Feedback *
                </label>
                <textarea
                  rows={3}
                  value={facultyRemarks}
                  onChange={(e) => setFacultyRemarks(e.target.value)}
                  placeholder="Provide constructive assessment comments visible to student and school staff..."
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end">
                <Button type="submit" variant="primary" isLoading={isSubmitting} className="gap-2 font-bold">
                  <Save className="w-4 h-4" />
                  <span>Submit & Lock Monthly Marks</span>
                </Button>
              </div>
            </form>
          </Card>

          {/* Right Col: Live Calculation Gauge */}
          <div className="space-y-4">
            <Card className="p-6 bg-slate-900 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Real-Time Evaluation
                  </span>
                  <Badge variant="success">Auto Calculated</Badge>
                </div>

                <div className="text-center py-3 border-y border-slate-800">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Score</span>
                  <span className="text-4xl font-extrabold text-white mt-1 block">
                    {calculation.total} <span className="text-lg text-slate-400">/ 100</span>
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 block mt-1">
                    {calculation.percentage}% Aggregate
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-center">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade Awarded</span>
                    <span className="text-2xl font-black text-amber-400 block mt-0.5">
                      {calculation.grade}
                    </span>
                  </div>
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                    <span className="text-xs font-bold text-emerald-300 block mt-1.5 truncate">
                      {calculation.performance_category}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 pt-2">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Theory:</span>
                    <span className="font-mono font-semibold">{calculation.theory} / 20</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Practical:</span>
                    <span className="font-mono font-semibold">{calculation.practical} / 30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Project:</span>
                    <span className="font-mono font-semibold">{calculation.project} / 30</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Creativity:</span>
                    <span className="font-mono font-semibold">{calculation.creativity} / 10</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Participation:</span>
                    <span className="font-mono font-semibold">{calculation.participation} / 10</span>
                  </div>
                </div>
              </div>
            </Card>

            <Alert variant="info" className="text-xs">
              Once submitted, marks reflect immediately in the School Staff Portal with immutable audit attribution.
            </Alert>
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
