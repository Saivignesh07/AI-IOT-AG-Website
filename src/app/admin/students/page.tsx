'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Upload,
  Search,
  Download,
  Filter,
  ArrowRightLeft,
  Eye,
  UserCheck,
  Building2,
  FileSpreadsheet,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { exportToCSV } from '@/lib/utils';
import { Student, School, ClassGrade, Section, Team } from '@/types';
import { ExcelImportModal } from '@/components/excel-import-modal';

export default function StudentManagementPage() {
  const { currentSchool } = useAuth();
  const [students, setStudents] = useState<(Student & { team?: Team; grade_level?: number })[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClassId, setSelectedClassId] = useState<string>('all');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExcelImportModalOpen, setIsExcelImportModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Single Add Form
  const [formData, setFormData] = useState({
    roll_number: '',
    first_name: '',
    last_name: '',
    gender: 'Male',
    parent_name: '',
    parent_phone: '',
    email: '',
    school_id: '',
    class_id: '',
    section_id: '',
  });

  // Transfer Form
  const [transferTarget, setTransferTarget] = useState({
    targetClassId: '',
    targetSectionId: '',
  });

  // Bulk CSV Raw text
  const [csvRawText, setCsvRawText] = useState('');
  const [importSchoolId, setImportSchoolId] = useState('');
  const [importClassId, setImportClassId] = useState('');
  const [importSectionId, setImportSectionId] = useState('');

  const loadData = () => {
    const schList = dbRepository.getSchools();
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();
    setSchools(schList);
    setClasses(clsList);
    setSections(secList);

    const effectiveSchoolId = currentSchool?.id;
    const effectiveClassId = selectedClassId === 'all' ? undefined : selectedClassId;
    setStudents(dbRepository.getStudents(effectiveSchoolId, effectiveClassId));

    if (schList.length > 0 && !formData.school_id) {
      setFormData((prev) => ({
        ...prev,
        school_id: schList[0].id,
        class_id: clsList[0]?.id || '',
        section_id: secList[0]?.id || '',
      }));
      setImportSchoolId(schList[0].id);
      setImportClassId(clsList[0]?.id || '');
      setImportSectionId(secList[0]?.id || '');
    }
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, [currentSchool, selectedClassId]);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.roll_number) {
      alert('Roll number and Student Name are required.');
      return;
    }
    dbRepository.addStudent(
      {
        roll_number: formData.roll_number,
        first_name: formData.first_name,
        last_name: formData.last_name,
        gender: formData.gender,
        parent_name: formData.parent_name,
        parent_phone: formData.parent_phone,
        email: formData.email,
        school_id: formData.school_id,
        is_active: true,
      },
      formData.class_id,
      formData.section_id
    );
    setIsAddModalOpen(false);
  };

  const handleBulkImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvRawText.trim()) {
      alert('Please paste CSV data or upload a file.');
      return;
    }

    try {
      const lines = csvRawText.trim().split('\n');
      const parsedStudents: any[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || (i === 0 && line.toLowerCase().includes('roll'))) continue;
        const parts = line.split(',').map((p) => p.trim().replace(/^"|"$/g, ''));
        if (parts.length >= 3) {
          parsedStudents.push({
            roll_number: parts[0],
            first_name: parts[1],
            last_name: parts[2] || '',
            gender: parts[3] || 'Other',
            parent_name: parts[4] || '',
            parent_phone: parts[5] || '',
            email: parts[6] || '',
          });
        }
      }

      if (parsedStudents.length === 0) {
        alert('Could not parse any valid student records from the CSV.');
        return;
      }

      dbRepository.bulkImportStudents(parsedStudents, importSchoolId, importClassId, importSectionId);
      alert(`Successfully imported ${parsedStudents.length} students!`);
      setCsvRawText('');
      setIsImportModalOpen(false);
    } catch (err: any) {
      alert('Import error: ' + err.message);
    }
  };

  const handleDownloadSampleCSV = () => {
    const sample = [
      {
        roll_number: 'GW-06A-10',
        first_name: 'Sameer',
        last_name: 'Khan',
        gender: 'Male',
        parent_name: 'Tariq Khan',
        parent_phone: '+91 98111 22334',
        email: 'sameer.khan@greenwood.edu',
      },
      {
        roll_number: 'GW-06A-11',
        first_name: 'Nisha',
        last_name: 'Kapoor',
        gender: 'Female',
        parent_name: 'Sunita Kapoor',
        parent_phone: '+91 98111 22335',
        email: 'nisha.kapoor@greenwood.edu',
      },
    ];
    exportToCSV('agriguardian_student_import_template', sample);
  };

  const handleOpenTransfer = (st: Student) => {
    setSelectedStudent(st);
    setTransferTarget({
      targetClassId: classes[0]?.id || '',
      targetSectionId: sections[0]?.id || '',
    });
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;
    dbRepository.transferStudent(
      selectedStudent.id,
      transferTarget.targetClassId,
      transferTarget.targetSectionId
    );
    alert(`Transferred ${selectedStudent.first_name} ${selectedStudent.last_name} successfully.`);
    setIsTransferModalOpen(false);
  };

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Student Directory & Enrollments</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enroll, bulk-import, transfer, and organize students into AI + IoT class sections
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="primary"
              onClick={() => setIsExcelImportModalOpen(true)}
              className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm ring-1 ring-emerald-600"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
              <span>Import Shree A G Jain Excel (Sheets 6-9)</span>
            </Button>
            <Button variant="outline" onClick={() => setIsImportModalOpen(true)} className="gap-1.5 text-xs">
              <Upload className="w-4 h-4" />
              <span>Bulk CSV Import</span>
            </Button>
            <Button variant="outline" onClick={() => setIsAddModalOpen(true)} className="gap-1.5 text-xs">
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </Button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, roll number, or email..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClassId}
              onChange={(e) => setSelectedClassId(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Classes (6, 7, 8, 9)</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>
                  Class {c.grade_level}
                </option>
              ))}
            </select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportToCSV('agriguardian_students_export', filteredStudents)}
              className="text-xs gap-1 shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </Button>
          </div>
        </div>

        {/* Student Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Roll No</th>
                  <th className="px-6 py-3.5">Student Name</th>
                  <th className="px-6 py-3.5">School</th>
                  <th className="px-6 py-3.5">Class</th>
                  <th className="px-6 py-3.5">Assigned Team</th>
                  <th className="px-6 py-3.5">Parent / Contact</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      {students.length === 0 ? (
                        <div className="max-w-md mx-auto space-y-3.5">
                          <div className="w-14 h-14 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
                            <FileSpreadsheet className="w-7 h-7" />
                          </div>
                          <div>
                            <h3 className="text-base font-bold text-slate-900">
                              Shree A G Jain School is Ready for Ingestion
                            </h3>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              All prior dummy records have been wiped. Classes 6, 7, 8, and 9 are configured and ready to receive student rosters from your multi-sheet Excel file.
                            </p>
                          </div>
                          <div className="pt-2 flex justify-center">
                            <Button
                              variant="primary"
                              onClick={() => setIsExcelImportModalOpen(true)}
                              className="gap-2 text-xs bg-emerald-700 hover:bg-emerald-800 text-white shadow-md px-5 py-2.5"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Import Shree A G Jain School Excel (Sheets 6-9)</span>
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="py-6 text-slate-400 text-xs">
                          No students found matching your search or class filter.
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredStudents.map((st) => {
                    const sch = schools.find((s) => s.id === st.school_id);
                    return (
                      <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-800 text-xs">
                          {st.roll_number}
                        </td>
                        <td className="px-6 py-3.5">
                          <p className="font-semibold text-slate-900">
                            {st.first_name} {st.last_name}
                          </p>
                          <p className="text-[11px] text-slate-400">{st.email}</p>
                        </td>
                        <td className="px-6 py-3.5 text-xs text-slate-600 truncate max-w-[150px]">
                          {sch?.name || 'Assigned School'}
                        </td>
                        <td className="px-6 py-3.5">
                          {st.grade_level ? (
                            <Badge variant="default">Class {st.grade_level}</Badge>
                          ) : (
                            <span className="text-slate-400 text-xs italic">—</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5">
                          {st.team ? (
                            <span className="font-semibold text-emerald-800 text-xs flex items-center gap-1">
                              <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              {st.team.name}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs italic">Unassigned</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-xs">
                          <span className="font-medium text-slate-800 block">{st.parent_name || 'N/A'}</span>
                          <span className="text-slate-500 text-[11px]">{st.parent_phone}</span>
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <button
                            onClick={() => handleOpenTransfer(st)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            title="Transfer Student"
                          >
                            <ArrowRightLeft className="w-3.5 h-3.5" />
                            <span>Transfer</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Single Add Student */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Enroll Individual Student"
          description="Register a student and enroll them into an AI + IoT class section"
          maxWidth="lg"
        >
          <form onSubmit={handleCreateStudent} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Roll Number *
                </label>
                <input
                  type="text"
                  required
                  value={formData.roll_number}
                  onChange={(e) => setFormData({ ...formData, roll_number: e.target.value })}
                  placeholder="e.g. GW-06A-12"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Gender
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800 bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  placeholder="e.g. Tanmay"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.last_name}
                  onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                  placeholder="e.g. Deshmukh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  School *
                </label>
                <select
                  value={formData.school_id}
                  onChange={(e) => setFormData({ ...formData, school_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800 bg-white"
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
                  Class & Section *
                </label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800 bg-white"
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
                  Parent / Guardian Name
                </label>
                <input
                  type="text"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  placeholder="e.g. Sanjay Deshmukh"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Parent Emergency Phone
                </label>
                <input
                  type="text"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  placeholder="+91 98200 44556"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Enroll Student
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Bulk CSV Import */}
        <Modal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          title="Bulk Student Import via CSV"
          description="Upload an entire batch of students directly into an AI+IoT classroom"
          maxWidth="lg"
        >
          <form onSubmit={handleBulkImport} className="space-y-4">
            <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">
                CSV format: roll_number, first_name, last_name, gender, parent_name, parent_phone, email
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSampleCSV}
                className="gap-1 text-xs shrink-0"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Template</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Target School
                </label>
                <select
                  value={importSchoolId}
                  onChange={(e) => setImportSchoolId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
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
                  Target Class
                </label>
                <select
                  value={importClassId}
                  onChange={(e) => setImportClassId(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>
                      Class {c.grade_level}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Paste CSV Data (or comma-separated values)
              </label>
              <textarea
                rows={6}
                value={csvRawText}
                onChange={(e) => setCsvRawText(e.target.value)}
                placeholder="GW-06A-14, Arjun, Mehta, Male, Ramesh Mehta, +91 98110 55443, arjun.m@greenwood.edu&#10;GW-06A-15, Sanya, Joshi, Female, Geeta Joshi, +91 98110 55444, sanya.j@greenwood.edu"
                className="w-full font-mono text-xs px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsImportModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Parse & Import Students
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Transfer Student */}
        <Modal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          title={`Transfer ${selectedStudent?.first_name} ${selectedStudent?.last_name}`}
          description="Reassign student to a different class/section with full audit tracking"
          maxWidth="md"
        >
          <form onSubmit={handleExecuteTransfer} className="space-y-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p>
                <span className="text-slate-500 font-semibold">Roll Number:</span>{' '}
                <span className="font-mono font-bold text-slate-800">{selectedStudent?.roll_number}</span>
              </p>
              <p>
                <span className="text-slate-500 font-semibold">Current Status:</span>{' '}
                <span className="text-emerald-700 font-bold">Active in Section A</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Destination Class *
              </label>
              <select
                value={transferTarget.targetClassId}
                onChange={(e) => setTransferTarget({ ...transferTarget, targetClassId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    Class {c.grade_level} ({c.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Destination Section *
              </label>
              <select
                value={transferTarget.targetSectionId}
                onChange={(e) => setTransferTarget({ ...transferTarget, targetSectionId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    Section {sec.name} ({sec.room_number || 'Room TBD'})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsTransferModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Confirm Transfer
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Multi-Sheet Excel Import for Shree A G Jain School */}
        <ExcelImportModal
          isOpen={isExcelImportModalOpen}
          onClose={() => setIsExcelImportModalOpen(false)}
          onSuccess={() => loadData()}
        />
      </div>
    </PortalLayout>
  );
}
