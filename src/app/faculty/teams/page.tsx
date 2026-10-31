'use client';

import React, { useState, useEffect } from 'react';
import {
  Network,
  Plus,
  Users,
  Award,
  Crown,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Alert } from '@/components/ui/alert';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { formatDate } from '@/lib/utils';
import { Team, Student, School, ClassGrade, Section } from '@/types';

export default function FacultyTeamManagementPage() {
  const { user, facultyRecord, currentSchool } = useAuth();

  const [teams, setTeams] = useState<any[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Team Creation Form State
  const [teamSchoolId, setTeamSchoolId] = useState('');
  const [teamClassId, setTeamClassId] = useState('');
  const [teamSectionId, setTeamSectionId] = useState('');
  const [teamName, setTeamName] = useState('');
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedLeaderId, setSelectedLeaderId] = useState<string>('');
  const [availableStudents, setAvailableStudents] = useState<Student[]>([]);
  const [errorMessage, setErrorMessage] = useState('');

  const loadData = () => {
    const schList = dbRepository.getSchools();
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();

    setSchools(schList);
    setClasses(clsList);
    setSections(secList);
    setTeams(dbRepository.getTeams());

    if (schList.length > 0 && !teamSchoolId) {
      setTeamSchoolId(schList[0].id);
    }
    if (clsList.length > 0 && !teamClassId) {
      setTeamClassId(clsList[0].id);
    }
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  // Update available students when school/class/section changes in modal
  useEffect(() => {
    if (teamSchoolId && teamClassId) {
      const allStudentsInSection = dbRepository.getStudents(
        teamSchoolId,
        teamClassId,
        teamSectionId || undefined
      );

      // Filter unassigned students for this class
      const existingTeams = dbRepository.getTeams(teamSchoolId, teamClassId);
      const assignedIds = new Set<string>();
      existingTeams.forEach((t) => {
        t.members?.forEach((m) => assignedIds.add(m.id));
      });

      // Filter out assigned
      const unassigned = allStudentsInSection.filter((s) => !assignedIds.has(s.id));
      setAvailableStudents(unassigned);
      setSelectedStudentIds([]);
      setSelectedLeaderId('');
      setErrorMessage('');
    }
  }, [teamSchoolId, teamClassId, teamSectionId, isCreateModalOpen]);

  // Toggle student selection
  const handleToggleStudent = (studentId: string) => {
    setErrorMessage('');
    if (selectedStudentIds.includes(studentId)) {
      const updated = selectedStudentIds.filter((id) => id !== studentId);
      setSelectedStudentIds(updated);
      if (selectedLeaderId === studentId) {
        setSelectedLeaderId(updated[0] || '');
      }
    } else {
      if (selectedStudentIds.length >= 4) {
        setErrorMessage('AgriGuardian guideline: A team must have exactly 4 members maximum.');
        return;
      }
      const updated = [...selectedStudentIds, studentId];
      setSelectedStudentIds(updated);
      if (!selectedLeaderId) {
        setSelectedLeaderId(studentId);
      }
    }
  };

  const handleSaveTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!teamName.trim()) {
      setErrorMessage('Please enter a Team Name.');
      return;
    }
    if (selectedStudentIds.length === 0) {
      setErrorMessage('Please select at least 1 student.');
      return;
    }

    const facultySupervisorId = facultyRecord?.id || 'fa000000-0000-0000-0000-000000000001';

    try {
      dbRepository.createTeam(
        teamName,
        teamSchoolId,
        teamClassId,
        teamSectionId,
        selectedLeaderId || selectedStudentIds[0],
        selectedStudentIds,
        facultySupervisorId
      );
      setIsCreateModalOpen(false);
      setTeamName('');
      setSelectedStudentIds([]);
      alert(`Team "${teamName}" created successfully with ${selectedStudentIds.length} members!`);
    } catch (err: any) {
      setErrorMessage(err.message);
    }
  };

  const filteredTeams = teams.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.leader?.first_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.school?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded border border-purple-200">
                Module 3: Student Team Management
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">4-Member AI + IoT Innovation Teams</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Organize students into collaborative pods of four, assign leaders, and handle remaining rosters
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsCreateModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Form New Team (4 Members)</span>
          </Button>
        </div>

        {/* Rule Highlight Card */}
        <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 flex items-start gap-3 text-xs text-purple-950">
          <Network className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block mb-0.5">AgriGuardian 4-Member Pod Architecture:</span>
            Students work best in quadruplet pods (Hardware Lead, ML Vision Lead, Firmware Lead, Data Lead).
            A student cannot be assigned to multiple active teams in the same class. If remaining students are fewer than four, they are grouped as a remainder team rather than excluded.
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search teams by team name, leader name, or school..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 pr-2">
            {filteredTeams.length} Active Teams
          </span>
        </div>

        {/* Team Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredTeams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                    #{team.team_number}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base text-slate-900">{team.name}</CardTitle>
                      <Badge variant="purple">{team.members?.length || 4} Members</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {team.school?.name} • Class 6A
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Supervisor</span>
                  <span className="text-xs font-semibold text-emerald-800">
                    {user?.full_name || 'Agri Faculty'}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Team Leader Banner */}
                <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600 shrink-0" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Designated Leader</span>
                      <span className="font-bold text-slate-900">
                        {team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : 'Aarav Sharma'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500">
                    {team.leader?.roll_number}
                  </span>
                </div>

                {/* 4-Member Roster */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Pod Roster (Four-Member Roster)
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {team.members?.map((member: Student, idx: number) => {
                      const isLeader = member.id === team.leader_student_id;
                      return (
                        <div
                          key={member.id}
                          className={`p-2 rounded-lg border text-xs flex items-center justify-between ${
                            isLeader ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-50 border-slate-100'
                          }`}
                        >
                          <div>
                            <span className="font-semibold text-slate-800 block truncate max-w-[110px]">
                              {member.first_name} {member.last_name}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {member.roll_number}
                            </span>
                          </div>
                          {isLeader && <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Project Status Snippet */}
                {team.project && (
                  <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                    <span className="text-slate-500 truncate max-w-[200px]">
                      Project: <strong>{team.project.title}</strong>
                    </span>
                    <Badge variant="warning">{team.project.stage}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Team Creation Wizard */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New 4-Member Student Team"
          description="Group available unassigned students into a collaborative pod"
          maxWidth="lg"
        >
          <form onSubmit={handleSaveTeam} className="space-y-4">
            {errorMessage && <Alert variant="error">{errorMessage}</Alert>}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  1. School *
                </label>
                <select
                  value={teamSchoolId}
                  onChange={(e) => setTeamSchoolId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {schools.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  2. Class *
                </label>
                <select
                  value={teamClassId}
                  onChange={(e) => setTeamClassId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
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
                  3. Section *
                </label>
                <select
                  value={teamSectionId}
                  onChange={(e) => setTeamSectionId(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                >
                  {sections
                    .filter((s) => s.school_id === teamSchoolId && s.class_id === teamClassId)
                    .map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        Section {sec.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                4. Team Name *
              </label>
              <input
                type="text"
                required
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="e.g. AgriBot Sensor Champions"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            {/* Select 4 Members */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  5. Select Students ({selectedStudentIds.length} / 4 Selected)
                </label>
                <span className="text-[11px] text-slate-500">
                  {availableStudents.length} Unassigned Students Available
                </span>
              </div>

              {availableStudents.length === 0 ? (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                  All students in this section are already assigned to active teams.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 border border-slate-200 rounded-xl">
                  {availableStudents.map((st) => {
                    const isSelected = selectedStudentIds.includes(st.id);
                    return (
                      <div
                        key={st.id}
                        onClick={() => handleToggleStudent(st.id)}
                        className={`p-2.5 rounded-lg border text-xs flex items-center justify-between cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div>
                          <p className="font-semibold leading-tight">
                            {st.first_name} {st.last_name}
                          </p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">{st.roll_number}</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          className="w-4 h-4 text-emerald-600 rounded"
                        />
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Assign Leader */}
            {selectedStudentIds.length > 0 && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  6. Assign Team Leader *
                </label>
                <select
                  value={selectedLeaderId}
                  onChange={(e) => setSelectedLeaderId(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white"
                >
                  {selectedStudentIds.map((id) => {
                    const st = availableStudents.find((s) => s.id === id);
                    return (
                      <option key={id} value={id}>
                        {st?.first_name} {st?.last_name} ({st?.roll_number})
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Save & Register Team
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
