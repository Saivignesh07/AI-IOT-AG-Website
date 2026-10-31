'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Award,
  CheckCircle2,
  Save,
  Building2,
  Calendar,
  AlertCircle,
  TrendingUp,
  Sparkles,
  Search,
  Download,
  Users,
  Check,
  ChevronLeft,
  ChevronRight,
  Sliders,
  FileSpreadsheet,
  Zap,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { calculateAssessmentGrade, exportToCSV } from '@/lib/utils';
import { School, ClassGrade, Section, Student, AssessmentMarks } from '@/types';

interface StudentMarksRow {
  studentId: string;
  rollNumber: string;
  name: string;
  theory: number;
  practical: number;
  project: number;
  creativity: number;
  participation: number;
  remarks: string;
  isSaved: boolean;
}

const POSITIVE_REMARKS = [
  'Demonstrated excellent comprehension of edge sensor circuits and telemetry.',
  'Outstanding practical aptitude and active team collaboration in IoT lab.',
  'Strong analytical approach to crop disease classification model training.',
  'High technical precision in micro-controller wiring and firmware testing.',
  'Proactive problem-solver during hardware assembly and telemetry calibration.',
  'Exemplary dedication and insightful questions during AI curriculum sessions.',
  'Solid grasp of agricultural IoT fundamentals and steady lab participation.',
];

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

  // View Mode: 'table' (bulk auto-grading) or 'single' (deep focus)
  const [viewMode, setViewMode] = useState<'table' | 'single'>('table');
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  // Bulk marks state (keyed by studentId)
  const [rows, setRows] = useState<StudentMarksRow[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

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

  // Load students and their existing marks
  useEffect(() => {
    if (schoolId && classId) {
      const stds = dbRepository.getStudents(schoolId, classId, sectionId || undefined);
      setStudents(stds);

      const assessment = dbRepository.getOrCreateAssessment(schoolId, classId, sectionId, month);
      const marksList = dbRepository.getAssessmentMarks(assessment.id);

      // Build rows
      const initialRows: StudentMarksRow[] = stds.map((st, idx) => {
        const found = marksList.find((m) => m.student_id === st.id);
        if (found) {
          return {
            studentId: st.id,
            rollNumber: st.roll_number,
            name: `${st.first_name} ${st.last_name}`.trim(),
            theory: found.theory_marks,
            practical: found.practical_marks,
            project: found.project_marks,
            creativity: found.creativity_marks,
            participation: found.participation_marks,
            remarks: found.faculty_remarks || POSITIVE_REMARKS[idx % POSITIVE_REMARKS.length],
            isSaved: true,
          };
        }
        // Default empty / un-graded row
        return {
          studentId: st.id,
          rollNumber: st.roll_number,
          name: `${st.first_name} ${st.last_name}`.trim(),
          theory: 0,
          practical: 0,
          project: 0,
          creativity: 0,
          participation: 0,
          remarks: POSITIVE_REMARKS[idx % POSITIVE_REMARKS.length],
          isSaved: false,
        };
      });

      setRows(initialRows);
      setSelectedStudentIndex(0);
      setSaveSuccessMsg('');
    }
  }, [schoolId, classId, sectionId, month]);

  // Handle individual cell change
  const handleMarkChange = (
    studentId: string,
    field: 'theory' | 'practical' | 'project' | 'creativity' | 'participation' | 'remarks',
    value: string | number
  ) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.studentId !== studentId) return r;
        if (field === 'remarks') {
          return { ...r, remarks: String(value), isSaved: false };
        }
        let num = typeof value === 'number' ? value : parseFloat(value) || 0;
        const maxLimits: Record<string, number> = {
          theory: 20,
          practical: 30,
          project: 30,
          creativity: 10,
          participation: 10,
        };
        num = Math.max(0, Math.min(maxLimits[field] || 100, num));
        return { ...r, [field]: num, isSaved: false };
      })
    );
  };

  // ⚡ AUTO-GRADING ENGINE: Smart Auto-Grade Entire Class with high marks
  const handleAutoGradeAll = (targetTier: 'top' | 'proficient' | 'balanced') => {
    setRows((prev) =>
      prev.map((r, idx) => {
        let t = 18;
        let p = 27;
        let pr = 28;
        let c = 9;
        let pa = 9;

        if (targetTier === 'top') {
          // 92 - 99% A+ Exemplary
          t = 18 + (idx % 3); // 18, 19, 20
          p = 27 + (idx % 4); // 27, 28, 29, 30
          pr = 27 + ((idx + 1) % 4); // 28, 29, 30, 27
          c = 9 + (idx % 2); // 9, 10
          pa = 9 + ((idx + 1) % 2); // 10, 9
        } else if (targetTier === 'proficient') {
          // 80 - 88% A Proficient
          t = 16 + (idx % 3); // 16, 17, 18
          p = 24 + (idx % 4); // 24, 25, 26, 27
          pr = 24 + ((idx + 2) % 4);
          c = 8;
          pa = 8;
        } else if (targetTier === 'balanced') {
          // Mixed realistic distribution (A+, A, B)
          const mod = idx % 5;
          if (mod === 0 || mod === 1) {
            t = 19; p = 29; pr = 29; c = 10; pa = 10; // A+ 97%
          } else if (mod === 2 || mod === 3) {
            t = 17; p = 26; pr = 25; c = 9; pa = 8; // A 85%
          } else {
            t = 15; p = 22; pr = 23; c = 7; pa = 8; // B 75%
          }
        }

        return {
          ...r,
          theory: t,
          practical: p,
          project: pr,
          creativity: c,
          participation: pa,
          remarks: POSITIVE_REMARKS[idx % POSITIVE_REMARKS.length],
          isSaved: false,
        };
      })
    );
    setSaveSuccessMsg('Auto-graded all students with calculated rubric marks! Click "Save & Lock All Marks" to commit.');
  };

  // Submit all marks in one click
  const handleSaveAll = () => {
    if (!schoolId || !classId || rows.length === 0) return;

    setIsSubmitting(true);
    try {
      const assessment = dbRepository.getOrCreateAssessment(schoolId, classId, sectionId, month);
      const entries = rows.map((r) => ({
        studentId: r.studentId,
        marks: {
          theory: r.theory,
          practical: r.practical,
          project: r.project,
          creativity: r.creativity,
          participation: r.participation,
        },
        facultyRemarks: r.remarks,
      }));

      dbRepository.submitBulkStudentMarks(
        assessment.id,
        entries,
        user?.email || 'faculty@agriguardian.io'
      );

      setRows((prev) => prev.map((r) => ({ ...r, isSaved: true })));
      setSaveSuccessMsg(`Successfully saved and locked marks for all ${rows.length} students! Synced to Staff Portal.`);
    } catch (err: any) {
      alert('Failed to save marks: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered rows for search
  const filteredRows = useMemo(() => {
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.rollNumber.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [rows, searchQuery]);

  // Aggregate stats
  const totalCount = rows.length;
  const evaluatedCount = rows.filter((r) => r.theory + r.practical + r.project + r.creativity + r.participation > 0).length;
  const avgPercentage = totalCount > 0
    ? (
        rows.reduce((sum, r) => {
          const c = calculateAssessmentGrade(r.theory, r.practical, r.project, r.creativity, r.participation);
          return sum + c.percentage;
        }, 0) / (evaluatedCount || 1)
      ).toFixed(1)
    : '0';

  // Current single student for deep view
  const currentSingle = rows[selectedStudentIndex] || rows[0];
  const singleCalc = currentSingle
    ? calculateAssessmentGrade(
        currentSingle.theory,
        currentSingle.practical,
        currentSingle.project,
        currentSingle.creativity,
        currentSingle.participation
      )
    : null;

  const handleExportCSV = () => {
    const exportData = rows.map((r) => {
      const c = calculateAssessmentGrade(r.theory, r.practical, r.project, r.creativity, r.participation);
      return {
        Roll_Number: r.rollNumber,
        Student_Name: r.name,
        Month: month,
        Theory_20: r.theory,
        Practical_30: r.practical,
        Project_30: r.project,
        Creativity_10: r.creativity,
        Participation_10: r.participation,
        Total_100: c.total,
        Percentage: `${c.percentage}%`,
        Grade: c.grade,
        Category: c.performance_category,
        Faculty_Remarks: r.remarks,
      };
    });
    exportToCSV(`marks_${month.replace(' ', '_')}_class_${classId}`, exportData);
  };

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded border border-rose-200">
                Module 5: Monthly Internal Assessment
              </span>
              <Badge variant="purple">{month}</Badge>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Standardized 100-Mark Internal Assessment</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Rapid auto-grading across Theory (20), Practical (30), Project (30), Creativity (10), and Participation (10)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'table' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
              className="text-xs gap-1.5"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Full Class Table</span>
            </Button>
            <Button
              variant={viewMode === 'single' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setViewMode('single')}
              className="text-xs gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>Single Student Focus</span>
            </Button>
          </div>
        </div>

        {/* Selection Bar */}
        <Card className="p-4 bg-white border-slate-200 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                1. Partner School
              </label>
              <select
                value={schoolId}
                onChange={(e) => setSchoolId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-700"
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
                2. Target Class Grade
              </label>
              <select
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-700"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.grade_level} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                3. Assessment Month
              </label>
              <select
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full text-xs font-semibold px-2.5 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-800 focus:ring-2 focus:ring-emerald-700"
              >
                <option value="September 2026">September 2026</option>
                <option value="October 2026">October 2026</option>
                <option value="November 2026">November 2026</option>
                <option value="December 2026">December 2026</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Quick Stats & Auto-Grading Action Toolbar */}
        <div className="bg-gradient-to-r from-emerald-900 to-green-950 text-white p-4 sm:p-5 rounded-2xl shadow-lg border border-emerald-800/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                Auto-Grading Control Center
              </span>
              <span className="text-xs text-emerald-200">
                {evaluatedCount} of {totalCount} Students Evaluated
              </span>
            </div>
            <p className="text-xs text-emerald-200/80">
              No need to grade student-by-student! Use one-click auto-grading presets or edit cells directly below.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAutoGradeAll('top')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 border-emerald-500"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>⚡ Auto-Grade All (90%+ A+)</span>
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => handleAutoGradeAll('balanced')}
              className="bg-emerald-800 hover:bg-emerald-700 text-emerald-100 font-semibold text-xs gap-1 border-emerald-700"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Balanced Distribution</span>
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
              onClick={handleSaveAll}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs gap-1.5 shadow-md"
            >
              <Save className="w-4 h-4" />
              <span>Save & Lock All Marks ({totalCount})</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-white border-emerald-700 hover:bg-emerald-800 text-xs gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {saveSuccessMsg && (
          <Alert variant="success" className="text-xs flex items-center justify-between">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          </Alert>
        )}

        {/* VIEW 1: FULL CLASS SPREADSHEET AUTO-GRADING TABLE (DEFAULT) */}
        {viewMode === 'table' && (
          <Card className="bg-white border-slate-200 shadow-sm overflow-hidden">
            {/* Table Search & Helper Bar */}
            <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/70">
              <div className="relative flex-1 w-full sm:max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search students by name or roll number..."
                  className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-700"
                />
              </div>

              <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Class Avg: <strong className="text-slate-900">{avgPercentage}%</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <span>Roster: <strong className="text-slate-900">{filteredRows.length} Students</strong></span>
                </div>
              </div>
            </div>

            {/* Interactive Grid */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Roll No & Student</th>
                    <th className="px-3 py-3 text-center">Theory <span className="text-[10px] text-slate-400 block font-normal">/ 20</span></th>
                    <th className="px-3 py-3 text-center">Practical <span className="text-[10px] text-slate-400 block font-normal">/ 30</span></th>
                    <th className="px-3 py-3 text-center">Project <span className="text-[10px] text-slate-400 block font-normal">/ 30</span></th>
                    <th className="px-3 py-3 text-center">Creativity <span className="text-[10px] text-slate-400 block font-normal">/ 10</span></th>
                    <th className="px-3 py-3 text-center">Participation <span className="text-[10px] text-slate-400 block font-normal">/ 10</span></th>
                    <th className="px-4 py-3 text-center bg-slate-50">Total <span className="text-[10px] text-slate-400 block font-normal">/ 100</span></th>
                    <th className="px-3 py-3 text-center">Auto Grade</th>
                    <th className="px-4 py-3">Faculty Remarks & Observations</th>
                    <th className="px-3 py-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredRows.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="px-6 py-12 text-center text-xs text-slate-400">
                        No students found in this class. Please select another class or upload student roster Excel.
                      </td>
                    </tr>
                  ) : (
                    filteredRows.map((r, index) => {
                      const calc = calculateAssessmentGrade(r.theory, r.practical, r.project, r.creativity, r.participation);

                      // Grade badge colors
                      let gradeBadgeVariant: 'success' | 'default' | 'purple' | 'warning' | 'danger' = 'success';
                      if (calc.grade === 'A') gradeBadgeVariant = 'default';
                      else if (calc.grade === 'B') gradeBadgeVariant = 'purple';
                      else if (calc.grade === 'C' || calc.grade === 'D') gradeBadgeVariant = 'warning';
                      else if (calc.grade === 'F') gradeBadgeVariant = 'danger';

                      return (
                        <tr key={r.studentId} className="hover:bg-slate-50/80 transition-colors">
                          {/* Student Info */}
                          <td className="px-4 py-2.5">
                            <span className="font-mono text-[11px] font-bold text-slate-500 block">
                              {r.rollNumber}
                            </span>
                            <span className="font-semibold text-slate-900 block text-xs">
                              {r.name}
                            </span>
                          </td>

                          {/* Theory Input (0-20) */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="20"
                              step="0.5"
                              value={r.theory || ''}
                              onChange={(e) => handleMarkChange(r.studentId, 'theory', e.target.value)}
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                            />
                          </td>

                          {/* Practical Input (0-30) */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              step="0.5"
                              value={r.practical || ''}
                              onChange={(e) => handleMarkChange(r.studentId, 'practical', e.target.value)}
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                            />
                          </td>

                          {/* Project Input (0-30) */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="30"
                              step="0.5"
                              value={r.project || ''}
                              onChange={(e) => handleMarkChange(r.studentId, 'project', e.target.value)}
                              className="w-16 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                            />
                          </td>

                          {/* Creativity Input (0-10) */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={r.creativity || ''}
                              onChange={(e) => handleMarkChange(r.studentId, 'creativity', e.target.value)}
                              className="w-14 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                            />
                          </td>

                          {/* Participation Input (0-10) */}
                          <td className="px-2 py-2.5 text-center">
                            <input
                              type="number"
                              min="0"
                              max="10"
                              step="0.5"
                              value={r.participation || ''}
                              onChange={(e) => handleMarkChange(r.studentId, 'participation', e.target.value)}
                              className="w-14 px-2 py-1 text-center font-bold text-xs border border-slate-300 rounded focus:ring-2 focus:ring-emerald-700 text-slate-900 bg-white"
                            />
                          </td>

                          {/* Live Auto-Calculated Total */}
                          <td className="px-4 py-2.5 text-center bg-slate-50/80">
                            <span className="font-extrabold text-sm text-slate-900 block">
                              {calc.total}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 block">
                              {calc.percentage}%
                            </span>
                          </td>

                          {/* Auto Grade Badge */}
                          <td className="px-3 py-2.5 text-center">
                            <Badge variant={gradeBadgeVariant} className="font-extrabold text-xs">
                              {calc.grade}
                            </Badge>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate max-w-[80px] mx-auto">
                              {calc.performance_category}
                            </span>
                          </td>

                          {/* Remarks */}
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              value={r.remarks}
                              onChange={(e) => handleMarkChange(r.studentId, 'remarks', e.target.value)}
                              placeholder="Add feedback comment..."
                              className="w-full px-2.5 py-1 text-xs border border-slate-200 rounded focus:ring-2 focus:ring-emerald-700 text-slate-700 bg-white"
                            />
                          </td>

                          {/* Status */}
                          <td className="px-3 py-2.5 text-center">
                            {r.isSaved ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                                <Check className="w-3.5 h-3.5" /> Saved
                              </span>
                            ) : (
                              <span className="inline-flex items-center text-[11px] font-semibold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Unsaved
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bottom Save Bar */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                💡 Tip: Use <strong>"⚡ Auto-Grade All"</strong> at the top to generate full class scores in 1 second, then adjust any student as needed.
              </span>
              <Button
                variant="primary"
                isLoading={isSubmitting}
                onClick={handleSaveAll}
                className="gap-2 font-bold text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md px-6 py-2.5 w-full sm:w-auto"
              >
                <Save className="w-4 h-4" />
                <span>Save All {rows.length} Student Grades</span>
              </Button>
            </div>
          </Card>
        )}

        {/* VIEW 2: SINGLE STUDENT DEEP FOCUS (WITH GAUGE WIDGET) */}
        {viewMode === 'single' && currentSingle && singleCalc && (
          <div className="space-y-4">
            {/* Student Navigation Bar */}
            <Card className="p-3 bg-white flex items-center justify-between border-slate-200">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedStudentIndex <= 0}
                  onClick={() => setSelectedStudentIndex((prev) => Math.max(0, prev - 1))}
                  className="gap-1 text-xs"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={selectedStudentIndex >= rows.length - 1}
                  onClick={() => setSelectedStudentIndex((prev) => Math.min(rows.length - 1, prev + 1))}
                  className="gap-1 text-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              <div className="text-center">
                <span className="text-xs font-bold text-slate-900 block">
                  Student {selectedStudentIndex + 1} of {rows.length}
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-700">
                  {currentSingle.rollNumber} - {currentSingle.name}
                </span>
              </div>

              <select
                value={selectedStudentIndex}
                onChange={(e) => setSelectedStudentIndex(Number(e.target.value))}
                className="text-xs border border-slate-300 rounded-lg px-2.5 py-1.5 bg-slate-50 font-medium text-slate-800"
              >
                {rows.map((r, i) => (
                  <option key={r.studentId} value={i}>
                    {r.rollNumber} - {r.name}
                  </option>
                ))}
              </select>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left 2 Cols: Form */}
              <Card className="lg:col-span-2 p-6 bg-white space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Marks Entry Form</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Evaluating <strong className="text-slate-800">{currentSingle.name}</strong> ({currentSingle.rollNumber})
                    </p>
                  </div>
                  <Badge variant="purple">{month}</Badge>
                </div>

                <div className="space-y-4">
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
                        value={currentSingle.theory}
                        onChange={(e) => handleMarkChange(currentSingle.studentId, 'theory', e.target.value)}
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
                        value={currentSingle.practical}
                        onChange={(e) => handleMarkChange(currentSingle.studentId, 'practical', e.target.value)}
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
                        value={currentSingle.project}
                        onChange={(e) => handleMarkChange(currentSingle.studentId, 'project', e.target.value)}
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
                        value={currentSingle.creativity}
                        onChange={(e) => handleMarkChange(currentSingle.studentId, 'creativity', e.target.value)}
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
                        value={currentSingle.participation}
                        onChange={(e) => handleMarkChange(currentSingle.studentId, 'participation', e.target.value)}
                        className="w-full px-3 py-1.5 text-sm font-bold border border-slate-300 rounded-lg bg-white text-slate-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                      Faculty Observations & Feedback *
                    </label>
                    <textarea
                      rows={3}
                      value={currentSingle.remarks}
                      onChange={(e) => handleMarkChange(currentSingle.studentId, 'remarks', e.target.value)}
                      placeholder="Provide constructive assessment comments visible to student and school staff..."
                      className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-800"
                    />
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleMarkChange(currentSingle.studentId, 'theory', 19);
                        handleMarkChange(currentSingle.studentId, 'practical', 28);
                        handleMarkChange(currentSingle.studentId, 'project', 29);
                        handleMarkChange(currentSingle.studentId, 'creativity', 9);
                        handleMarkChange(currentSingle.studentId, 'participation', 10);
                      }}
                      className="gap-1.5 text-xs text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      <span>⚡ Auto-Grade This Student</span>
                    </Button>

                    <Button
                      type="button"
                      variant="primary"
                      isLoading={isSubmitting}
                      onClick={handleSaveAll}
                      className="gap-2 font-bold"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save & Lock Marks</span>
                    </Button>
                  </div>
                </div>
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
                        {singleCalc.total} <span className="text-lg text-slate-400">/ 100</span>
                      </span>
                      <span className="text-xs font-semibold text-emerald-400 block mt-1">
                        {singleCalc.percentage}% Aggregate
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Grade Awarded</span>
                        <span className="text-2xl font-black text-amber-400 block mt-0.5">
                          {singleCalc.grade}
                        </span>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/60">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Category</span>
                        <span className="text-xs font-bold text-emerald-300 block mt-1.5 truncate">
                          {singleCalc.performance_category}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-300 pt-2">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Theory:</span>
                        <span className="font-mono font-semibold">{singleCalc.theory} / 20</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Practical:</span>
                        <span className="font-mono font-semibold">{singleCalc.practical} / 30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Project:</span>
                        <span className="font-mono font-semibold">{singleCalc.project} / 30</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Creativity:</span>
                        <span className="font-mono font-semibold">{singleCalc.creativity} / 10</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Participation:</span>
                        <span className="font-mono font-semibold">{singleCalc.participation} / 10</span>
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
        )}
      </div>
    </PortalLayout>
  );
}
