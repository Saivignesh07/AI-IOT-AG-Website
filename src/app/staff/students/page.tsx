'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Search,
  Filter,
  Lock,
  Download,
  Building2,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs } from '@/components/ui/tabs';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { exportToCSV } from '@/lib/utils';
import { Student, ClassGrade, Section, Team } from '@/types';

export default function StaffStudentDirectoryPage() {
  const { staffRecord, currentSchool } = useAuth();
  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;

  const [students, setStudents] = useState<(Student & { team?: Team })[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [searchQuery, setSearchQuery] = useState('');

  const loadData = () => {
    const clsList = dbRepository.getClasses();
    setClasses(clsList);
    const targetClass = clsList.find((c) => c.grade_level === selectedGrade);
    const studs = dbRepository.getStudents(assignedSchoolId, targetClass?.id);
    setStudents(studs);
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, [assignedSchoolId, selectedGrade]);

  const gradeTabs = [6, 7, 8, 9].map((g) => ({
    id: String(g),
    label: `Class ${g}`,
  }));

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExport = () => {
    const exportData = filteredStudents.map((st) => ({
      Roll_Number: st.roll_number,
      Full_Name: `${st.first_name} ${st.last_name}`,
      Gender: st.gender,
      Class: `Class ${selectedGrade}`,
      Team_Name: st.team?.name || 'Unassigned',
      Attendance_Percentage: '94.2%',
      Latest_Grade: 'A+',
    }));
    exportToCSV(`students_class_${selectedGrade}`, exportData);
  };

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Module 1: Class-Wise Student Details
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Student Directory & Academic Tracking</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Monitoring enrolled students belonging strictly to {staffRecord?.school?.name || 'your assigned school'}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} className="gap-1.5 text-xs">
            <Download className="w-3.5 h-3.5" />
            <span>Export Roster</span>
          </Button>
        </div>

        {/* Class Selector Tabs */}
        <Card className="p-2 bg-white">
          <Tabs
            tabs={gradeTabs}
            activeTab={String(selectedGrade)}
            onChange={(id) => setSelectedGrade(Number(id))}
          />
        </Card>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search Class ${selectedGrade} students by name or roll number...`}
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 pr-2">
            {filteredStudents.length} Students in Class {selectedGrade}
          </span>
        </div>

        {/* Student Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Assigned Team</th>
                  <th className="px-6 py-3.5">Attendance Rate</th>
                  <th className="px-6 py-3.5">Assessment Performance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-xs text-slate-400">
                      No students enrolled in Class {selectedGrade} for this school
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => (
                    <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-800 text-xs">
                        {st.roll_number}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {st.first_name} {st.last_name}
                      </td>
                      <td className="px-6 py-4">
                        <Badge variant="default">Class {selectedGrade}</Badge>
                      </td>
                      <td className="px-6 py-4">
                        {st.team ? (
                          <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {st.team.name}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-bold text-emerald-700">
                        94.2%
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="success">Grade A+</Badge>
                          <span className="text-xs text-slate-500 font-medium">(92.5%)</span>
                        </div>
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
