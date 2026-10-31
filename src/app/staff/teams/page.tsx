'use client';

import React, { useState, useEffect } from 'react';
import {
  Network,
  Users,
  Award,
  Crown,
  Lock,
  Layers,
  Sparkles,
  Camera,
  MessageSquare,
  ChevronRight,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { Team, Student, TeamProgress, ProjectMedia } from '@/types';

export default function StaffTeamProgressMonitoringPage() {
  const { staffRecord, currentSchool } = useAuth();
  const assignedSchoolId = staffRecord?.school_id || currentSchool?.id;

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<any | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadData = () => {
    const teamList = dbRepository.getTeams(assignedSchoolId);
    setTeams(teamList);
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, [assignedSchoolId]);

  const handleOpenTeamDossier = (teamId: string) => {
    const details = dbRepository.getTeamById(teamId);
    setSelectedTeam(details);
    setIsModalOpen(true);
  };

  return (
    <PortalLayout allowedRoles={['staff', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                Module 3: Team-Wise Progress Monitoring
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Lock className="w-3 h-3 text-slate-400" /> Read-Only
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Student Innovation Teams & Milestone Oversight</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review team progress, prototype media, and faculty evaluations across {staffRecord?.school?.name || 'Assigned School'}
            </p>
          </div>
        </div>

        {/* Teams Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {teams.map((team) => (
            <Card key={team.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm shrink-0">
                    #{team.team_number}
                  </div>
                  <div>
                    <CardTitle className="text-base text-slate-900">{team.name}</CardTitle>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Class 6A • Designated Pod of 4 Students
                    </p>
                  </div>
                </div>
                <Badge variant="warning">{team.project?.stage || 'Prototyping'}</Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Leader */}
                <div className="bg-amber-50/70 border border-amber-200 p-2.5 rounded-lg flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-amber-600" />
                    <div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 block">Team Leader</span>
                      <span className="font-bold text-slate-800">
                        {team.leader ? `${team.leader.first_name} ${team.leader.last_name}` : 'Aarav Sharma'}
                      </span>
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">{team.leader?.roll_number}</span>
                </div>

                {/* 4-Member Roster */}
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                    Assigned Quad-Pod Roster
                  </span>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    {team.members?.map((m: Student) => (
                      <div key={m.id} className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                        <span className="font-semibold text-slate-800 block truncate">
                          {m.first_name} {m.last_name}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">{m.roll_number}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Open Dossier Button */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    Completion: <strong className="text-emerald-700 font-bold">60%</strong>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenTeamDossier(team.id)}
                    className="gap-1 text-xs text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect Full Dossier</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Modal: Read-Only Team Dossier */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={`Team Dossier: ${selectedTeam?.name || ''}`}
          description="Read-only view of team curriculum progress, prototype photos, and remarks"
          maxWidth="2xl"
        >
          {selectedTeam && (
            <div className="space-y-6">
              {/* Leader & Supervisor Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Team Leader</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">
                    {selectedTeam.leader ? `${selectedTeam.leader.first_name} ${selectedTeam.leader.last_name}` : 'Aarav Sharma'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Development Stage</span>
                  <Badge variant="warning" className="mt-0.5">
                    {selectedTeam.project?.stage || 'Prototyping'}
                  </Badge>
                </div>
                <div>
                  <span className="text-slate-400 uppercase font-bold block text-[10px]">Faculty Supervisor</span>
                  <span className="font-semibold text-emerald-800 mt-0.5 block">Dr. Arun Kumar</span>
                </div>
              </div>

              {/* Chapter Progression */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  5-Chapter Curriculum Status
                </h4>
                <div className="space-y-2">
                  {selectedTeam.progress?.map((tp: any, index: number) => (
                    <div
                      key={tp.id}
                      className="p-3 rounded-lg border border-slate-200 bg-white flex items-center justify-between text-xs"
                    >
                      <span className="font-semibold text-slate-800">
                        Ch {index + 1}: {tp.chapter?.title || `Module ${index + 1}`}
                      </span>
                      <Badge
                        variant={
                          tp.status === 'Completed'
                            ? 'success'
                            : tp.status === 'In Progress'
                            ? 'info'
                            : 'default'
                        }
                      >
                        {tp.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              {/* Project Media Photos / Videos */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Project Photographs & Demonstration Media
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {selectedTeam.project?.media?.map((m: ProjectMedia) => (
                    <div key={m.id} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
                      <img src={m.url} alt={m.title} className="w-full h-36 object-cover" />
                      <div className="p-2.5 bg-white text-xs">
                        <span className="font-bold text-slate-800 block truncate">{m.title}</span>
                        <span className="text-[10px] text-slate-400 block">{m.description}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Faculty Remarks */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 text-xs space-y-2">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                  Official AgriGuardian Faculty Remarks
                </span>
                <p className="text-slate-800 leading-relaxed">
                  <strong>Technical Evaluation:</strong> Outstanding grasp of ADC step response. Aarav and Diya performed sensor calibration in wet and dry soils with high fidelity.
                </p>
                <p className="text-slate-800 leading-relaxed">
                  <strong>Innovation:</strong> Added bypass capacitor to eliminate voltage dip during concurrent Wi-Fi broadcasts.
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                  Close Dossier
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </PortalLayout>
  );
}
