'use client';

import React, { useState, useEffect } from 'react';
import {
  Award,
  Lock,
  Download,
  Filter,
  TrendingUp,
  BarChart2,
  CheckCircle2,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AssessmentDistributionChart } from '@/components/charts/assessment-distribution-chart';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { exportToCSV } from '@/lib/utils';
import { AssessmentMarks, Student } from '@/types';

export default function StaffMonthlyAssessmentMonitoringPage() {
  const { staffRecord, currentSchool } = useAuth();
  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;

  const [marks, setMarks] = useState<(AssessmentMarks & { student?: Student })[]>([]);
  const [selectedMonth, setSelectedMonth] = useState('October 2026');

  useEffect(() => {
    const assessment = dbRepository.getOrCreateAssessment(
      assignedSchoolId || '11111111-1111-1111-1111-111111111111',
      'c0000000-0000-0000-0000-000000000006',
      'sec00000-0000-0000-0000-000000000061',
      selectedMonth
    );
    const marksList = dbRepository.getAssessmentMarks(assessment.id);
    setMarks(marksList);
  }, [assignedSchoolId, selectedMonth]);

  const handleExport = () => {
    const exportData = marks.map((m) => ({
      Roll_Number: m.student?.roll_number,
      Student_Name: m.student ? `${m.student.first_name} ${m.student.last_name}` : 'N/A',
      Theory_Marks: `${m.theory_marks} / 20`,
      Practical_Marks: `${m.practical_marks} / 30`,
      Project_Marks: `${m.project_marks} / 30`,
      Creativity_Marks: `${m.creativity_marks} / 10`,
      Participation_Marks: `${m.participation_marks} / 10`,
      Total_Marks: `${m.total_marks} / 100`,
      Percentage: `${m.percentage}%`,
      Grade: m.grade,
      Category: m.performance_category,
      Faculty_Remarks: m.faculty_remarks || 'None',
    }));
    exportToCSV(`assessment_marks_${selectedMonth.replace(' ', '_')}`, exportData);
  };

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Module 4: Monthly Assessment Monitoring
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Monthly Assessment Rubric & Grades</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Evaluating student mastery across Theory, Practical Labs, Projects, Creativity, and Participation
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export Mark Sheet</span>
          </Button>
        </div>

        {/* Filter Bar */}
        <Card className="p-4 bg-white border-slate-200">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-600">Select Assessment Month:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-slate-50 text-slate-800"
            >
              <option value="September 2026">September 2026</option>
              <option value="October 2026">October 2026</option>
              <option value="November 2026">November 2026</option>
              <option value="December 2026">December 2026</option>
            </select>
          </div>
        </Card>

        {/* Performance Distribution & Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle>Grade Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <AssessmentDistributionChart />
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Rubric Breakdown Summary</CardTitle>
              <Badge variant="purple">100-Mark Rubric</Badge>
            </CardHeader>
            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Theory Weight</span>
                <span className="text-lg font-black text-slate-800 mt-1 block">20 Marks</span>
                <span className="text-[11px] text-slate-500">Conceptual mastery</span>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
                <span className="text-[10px] uppercase font-bold text-blue-700 block">Practical Skills</span>
                <span className="text-lg font-black text-blue-900 mt-1 block">30 Marks</span>
                <span className="text-[11px] text-blue-700">Hardware wiring</span>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
                <span className="text-[10px] uppercase font-bold text-purple-700 block">IoT Project</span>
                <span className="text-lg font-black text-purple-900 mt-1 block">30 Marks</span>
                <span className="text-[11px] text-purple-700">Prototype functionality</span>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <span className="text-[10px] uppercase font-bold text-amber-700 block">Creativity</span>
                <span className="text-lg font-black text-amber-900 mt-1 block">10 Marks</span>
                <span className="text-[11px] text-amber-700">Innovative design</span>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                <span className="text-[10px] uppercase font-bold text-emerald-700 block">Participation</span>
                <span className="text-lg font-black text-emerald-900 mt-1 block">10 Marks</span>
                <span className="text-[11px] text-emerald-700">Peer collaboration</span>
              </div>
              <div className="p-3 bg-slate-900 text-white rounded-xl">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">Total Maximum</span>
                <span className="text-lg font-black text-white mt-1 block">100 Marks</span>
                <span className="text-[11px] text-slate-400">Calculated aggregate</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Detailed Mark Sheet Table */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Student Mark Sheet ({selectedMonth})</CardTitle>
            <Badge variant="success">Read-Only Official Record</Badge>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Roll No</th>
                  <th className="px-5 py-3.5">Student Name</th>
                  <th className="px-4 py-3.5">Theory (20)</th>
                  <th className="px-4 py-3.5">Practical (30)</th>
                  <th className="px-4 py-3.5">Project (30)</th>
                  <th className="px-4 py-3.5">Creativity (10)</th>
                  <th className="px-4 py-3.5">Part. (10)</th>
                  <th className="px-4 py-3.5 font-bold">Total (100)</th>
                  <th className="px-4 py-3.5">Grade</th>
                  <th className="px-5 py-3.5">Faculty Feedback</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {marks.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-6 py-8 text-center text-xs text-slate-400">
                      No assessment marks logged yet for this month.
                    </td>
                  </tr>
                ) : (
                  marks.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4 font-mono font-bold text-slate-800 text-xs">
                        {m.student?.roll_number}
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {m.student?.first_name} {m.student?.last_name}
                      </td>
                      <td className="px-4 py-4">{m.theory_marks}</td>
                      <td className="px-4 py-4">{m.practical_marks}</td>
                      <td className="px-4 py-4">{m.project_marks}</td>
                      <td className="px-4 py-4">{m.creativity_marks}</td>
                      <td className="px-4 py-4">{m.participation_marks}</td>
                      <td className="px-4 py-4 font-extrabold text-emerald-800 text-sm">
                        {m.total_marks}
                      </td>
                      <td className="px-4 py-4">
                        <Badge variant="success">{m.grade}</Badge>
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-600 max-w-xs line-clamp-2">
                        {m.faculty_remarks || 'Evaluated by AgriGuardian faculty'}
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
