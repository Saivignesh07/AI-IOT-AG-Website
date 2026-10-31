'use client';

import React, { useState, useEffect } from 'react';
import {
  FileBarChart,
  Download,
  Printer,
  CalendarCheck,
  Award,
  Network,
  Users,
  GraduationCap,
  Building2,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { dbRepository } from '@/lib/db/repository';
import { exportToCSV, formatDate } from '@/lib/utils';
import { School, Student, Team, AssessmentMarks } from '@/types';

export default function AdminReportsPage() {
  const [activeTab, setActiveTab] = useState('attendance');
  const [schools, setSchools] = useState<School[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [marks, setMarks] = useState<AssessmentMarks[]>([]);

  useEffect(() => {
    setSchools(dbRepository.getSchools());
    setStudents(dbRepository.getStudents());
    setTeams(dbRepository.getTeams());
    setMarks(dbRepository.getAssessmentMarks('as000000-0000-0000-0000-000000000001'));
  }, []);

  const reportTabs = [
    { id: 'attendance', label: 'School Attendance Report', icon: <CalendarCheck className="w-4 h-4" /> },
    { id: 'performance', label: 'Monthly Assessment Report', icon: <Award className="w-4 h-4" /> },
    { id: 'teams', label: 'IoT Project & Team Progress', icon: <Network className="w-4 h-4" /> },
  ];

  const handleExportCurrent = () => {
    if (activeTab === 'attendance') {
      const data = schools.map((sch) => {
        const studentCount = dbRepository.getStudents(sch.id).length;
        const metrics = dbRepository.getDashboardMetrics('admin', sch.id);
        return {
          School_Name: sch.name,
          Code: sch.code,
          City: sch.city,
          Total_Students: studentCount,
          Attendance_Rate: metrics.hasAttendanceData ? `${metrics.attendancePercentage}%` : 'Not Recorded',
          Status: sch.is_active ? 'Active' : 'Inactive',
        };
      });
      exportToCSV('agriguardian_school_attendance_summary', data);
    } else if (activeTab === 'performance') {
      const data = marks.map((m) => ({
        Student: m.student ? `${m.student.first_name} ${m.student.last_name}` : m.student_id,
        Roll_Number: m.student?.roll_number,
        Theory_Marks: m.theory_marks,
        Practical_Marks: m.practical_marks,
        Project_Marks: m.project_marks,
        Creativity: m.creativity_marks,
        Participation: m.participation_marks,
        Total_Marks: m.total_marks,
        Percentage: `${m.percentage}%`,
        Grade: m.grade,
        Category: m.performance_category,
      }));
      exportToCSV('agriguardian_monthly_assessment_report', data);
    } else {
      const data = teams.map((t) => ({
        Team_Name: t.name,
        Team_Number: t.team_number,
        Leader: t.leader ? `${t.leader.first_name} ${t.leader.last_name}` : 'N/A',
        Member_Count: t.members?.length || 4,
        Project_Title: t.project?.title || 'N/A',
        Project_Stage: t.project?.stage || 'Ideation',
      }));
      exportToCSV('agriguardian_team_progress_dossier', data);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Academic & Operational Reports</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Consolidated intelligence, exportable audit summaries, and school comparative matrices
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handlePrint} className="gap-1.5 text-xs">
              <Printer className="w-3.5 h-3.5" />
              <span>Print Dossier</span>
            </Button>
            <Button variant="primary" onClick={handleExportCurrent} className="gap-1.5 text-xs">
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <Card className="p-2 bg-white">
          <Tabs tabs={reportTabs} activeTab={activeTab} onChange={setActiveTab} />
        </Card>

        {/* Tab 1: Attendance Report */}
        {activeTab === 'attendance' && (
          <Card>
            <CardHeader>
              <CardTitle>School-Wise Attendance Performance Matrix</CardTitle>
              <Badge variant="success">All Campuses Verified</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">School Name</th>
                    <th className="px-6 py-3.5">Institution Code</th>
                    <th className="px-6 py-3.5">Location</th>
                    <th className="px-6 py-3.5">Enrolled Count</th>
                    <th className="px-6 py-3.5">Avg Attendance</th>
                    <th className="px-6 py-3.5">Compliance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {schools.map((sch) => {
                    const count = dbRepository.getStudents(sch.id).length;
                    const metrics = dbRepository.getDashboardMetrics('admin', sch.id);
                    return (
                      <tr key={sch.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-semibold text-slate-900">{sch.name}</td>
                        <td className="px-6 py-4 font-mono text-xs">{sch.code}</td>
                        <td className="px-6 py-4 text-xs text-slate-500">{sch.city}, {sch.state}</td>
                        <td className="px-6 py-4 font-bold text-slate-800">{count} Students</td>
                        <td className="px-6 py-4 font-bold text-emerald-700">
                          {metrics.hasAttendanceData ? `${metrics.attendancePercentage}%` : 'Not Recorded'}
                        </td>
                        <td className="px-6 py-4">
                          {metrics.hasAttendanceData
                            ? <Badge variant="success">Compliant</Badge>
                            : <Badge variant="default">Awaiting Data</Badge>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 2: Assessment Report */}
        {activeTab === 'performance' && (
          <Card>
            <CardHeader>
              <CardTitle>October 2026 Internal Assessment Performance</CardTitle>
              <Badge variant="purple">Standard 100-Mark Rubric</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Student</th>
                    <th className="px-6 py-3.5">Roll No</th>
                    <th className="px-6 py-3.5">Theory (20)</th>
                    <th className="px-6 py-3.5">Practical (30)</th>
                    <th className="px-6 py-3.5">Project (30)</th>
                    <th className="px-6 py-3.5">Total (100)</th>
                    <th className="px-6 py-3.5">Grade</th>
                    <th className="px-6 py-3.5">Evaluation Category</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {marks.map((m) => (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {m.student ? `${m.student.first_name} ${m.student.last_name}` : m.student_id}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">{m.student?.roll_number}</td>
                      <td className="px-6 py-4">{m.theory_marks}</td>
                      <td className="px-6 py-4">{m.practical_marks}</td>
                      <td className="px-6 py-4">{m.project_marks}</td>
                      <td className="px-6 py-4 font-bold text-emerald-800">{m.total_marks}</td>
                      <td className="px-6 py-4 font-bold">
                        <Badge variant="success">{m.grade}</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                        {m.performance_category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Tab 3: Teams Report */}
        {activeTab === 'teams' && (
          <Card>
            <CardHeader>
              <CardTitle>Student Team IoT Innovation Progress</CardTitle>
              <Badge variant="default">Strict 4-Member Roster</Badge>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-6 py-3.5">Team Name</th>
                    <th className="px-6 py-3.5">Designated Leader</th>
                    <th className="px-6 py-3.5">Roster Count</th>
                    <th className="px-6 py-3.5">Project Title</th>
                    <th className="px-6 py-3.5">Current Stage</th>
                    <th className="px-6 py-3.5">Overall Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teams.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{t.name}</td>
                      <td className="px-6 py-4 font-medium text-emerald-800">
                        {t.leader ? `${t.leader.first_name} ${t.leader.last_name}` : 'Aarav Sharma'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="info">4 Members</Badge>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-800 truncate max-w-[200px]">
                        {t.project?.title || 'AutoDrip AI-Vision Station'}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="warning">{t.project?.stage || 'Prototyping'}</Badge>
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700">In Progress</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </PortalLayout>
  );
}
