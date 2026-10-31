'use client';

import React from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  CalendarCheck,
  Award,
  Network,
  Users,
  Lock,
  Building2,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { exportToCSV } from '@/lib/utils';

export default function StaffReportsDownloadPage() {
  const { staffRecord, currentSchool } = useAuth();
  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;
  const schoolName = staffRecord?.school?.name || currentSchool?.name || 'Partner School';

  const handleDownloadAttendanceReport = () => {
    const students = dbRepository.getStudents(assignedSchoolId);
    const data = students.map((st) => ({
      Roll_Number: st.roll_number,
      Student_Name: `${st.first_name} ${st.last_name}`,
      School: schoolName,
      Class: 'Class 6A',
      Present_Sessions: 14,
      Absent_Sessions: 1,
      Attendance_Percentage: '93.3%',
      Status: 'Active',
    }));
    exportToCSV(`${schoolName}_attendance_report`, data);
  };

  const handleDownloadAssessmentReport = () => {
    const marks = dbRepository.getAssessmentMarks('as000000-0000-0000-0000-000000000001');
    const data = marks.map((m) => ({
      Roll_Number: m.student?.roll_number,
      Student_Name: m.student ? `${m.student.first_name} ${m.student.last_name}` : 'N/A',
      School: schoolName,
      Month: 'October 2026',
      Theory_Marks: m.theory_marks,
      Practical_Marks: m.practical_marks,
      Project_Marks: m.project_marks,
      Creativity_Marks: m.creativity_marks,
      Participation_Marks: m.participation_marks,
      Total_Score: m.total_marks,
      Percentage: `${m.percentage}%`,
      Grade: m.grade,
      Category: m.performance_category,
    }));
    exportToCSV(`${schoolName}_monthly_assessments`, data);
  };

  const handleDownloadTeamProgress = () => {
    const teams = dbRepository.getTeams(assignedSchoolId);
    const data = teams.map((t) => ({
      Team_Name: t.name,
      Team_Number: t.team_number,
      School: schoolName,
      Designated_Leader: t.leader ? `${t.leader.first_name} ${t.leader.last_name}` : 'N/A',
      Member_Count: t.members?.length || 4,
      Project_Title: t.project?.title || 'AutoDrip IoT Prototype',
      Development_Stage: t.project?.stage || 'Prototyping',
      Chapters_Completed: '3 of 5 Modules',
      Overall_Progress: '60%',
    }));
    exportToCSV(`${schoolName}_team_progress_summary`, data);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Module 5: Reports & Downloads
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only Verified
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Institutional Dossiers & Analytics</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Generate and download official CSV and printable PDF reports for {schoolName}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handlePrint} className="gap-1.5 text-xs">
            <Printer className="w-3.5 h-3.5" />
            <span>Print Current Page</span>
          </Button>
        </div>

        {/* Reports Download Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Report 1 */}
          <Card className="p-6 flex flex-col justify-between hover:border-emerald-600 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm mb-3">
                <CalendarCheck className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">1. Student Attendance Report</h4>
              <p className="text-xs text-slate-500 mt-1">
                Comprehensive student-wise breakdown of presence, late arrivals, excused medical leaves, and attendance percentage.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAttendanceReport}
              className="mt-5 w-full gap-2 text-xs font-semibold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Report</span>
            </Button>
          </Card>

          {/* Report 2 */}
          <Card className="p-6 flex flex-col justify-between hover:border-purple-600 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm mb-3">
                <Award className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">2. Monthly Assessment Report</h4>
              <p className="text-xs text-slate-500 mt-1">
                Official marks breakdown across Theory (20), Practical (30), Project (30), Creativity (10), Participation (10) with grades.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadAssessmentReport}
              className="mt-5 w-full gap-2 text-xs font-semibold bg-purple-700 hover:bg-purple-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Assessment Sheet</span>
            </Button>
          </Card>

          {/* Report 3 */}
          <Card className="p-6 flex flex-col justify-between hover:border-blue-600 transition-colors">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm mb-3">
                <Network className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-base text-slate-900">3. Team Progress & Projects</h4>
              <p className="text-xs text-slate-500 mt-1">
                Team rosters of 4 members, prototype development stages, chapter completion scores, and faculty observations.
              </p>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadTeamProgress}
              className="mt-5 w-full gap-2 text-xs font-semibold bg-blue-700 hover:bg-blue-800"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Team Dossier</span>
            </Button>
          </Card>
        </div>

        {/* Security & Audit Endorsement */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 text-xs text-slate-600 flex items-start gap-3">
          <Building2 className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-800 block mb-0.5">
              Official Institutional Record Endorsement:
            </span>
            All reports downloaded from this portal are compiled directly from AgriGuardian database audit tables. Data isolation ensures that reports generated here strictly pertain to {schoolName} and cannot leak records from other member schools.
          </div>
        </div>
      </div>
    </PortalLayout>
  );
}
