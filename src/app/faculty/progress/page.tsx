'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  Layers,
  Sparkles,
  Camera,
  MessageSquare,
  TrendingUp,
  Save,
  Plus,
  AlertCircle,
  Network,
  Video,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { useAuth } from '@/lib/auth/auth-context';
import { ProgressStatus, ProjectStage, Team, TeamProgress, Project, ProjectMedia } from '@/types';

function FacultyTeamProgressContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();

  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<string>('');
  const [teamDetails, setTeamDetails] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('chapters');

  // Modals
  const [isMediaModalOpen, setIsMediaModalOpen] = useState(false);
  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');

  // Faculty remarks form
  const [remarksState, setRemarksState] = useState({
    technical: 'Solid grasp of ADC sensor calibration on breadboard.',
    participation: 9,
    innovation: 'Added automatic capacitor decoupling filter without prompt.',
    improvement: 'Ensure wiring harness is zip-tied before field deployment.',
  });

  const loadData = () => {
    const allTeams = dbRepository.getTeams();
    setTeams(allTeams);

    const initialId = searchParams.get('teamId') || (allTeams.length > 0 ? allTeams[0].id : '');
    setSelectedTeamId(initialId);
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  useEffect(() => {
    if (selectedTeamId) {
      const details = dbRepository.getTeamById(selectedTeamId);
      setTeamDetails(details);
    }
  }, [selectedTeamId]);

  // Tab definitions
  const tabs = [
    { id: 'chapters', label: 'A. Chapter Progress', icon: <Layers className="w-4 h-4" /> },
    { id: 'practicals', label: 'B. Practical Labs', icon: <CheckCircle2 className="w-4 h-4" /> },
    { id: 'project', label: 'C. Project Milestones', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'media', label: 'D. Photos & Videos', icon: <Camera className="w-4 h-4" /> },
    { id: 'remarks', label: 'E. Faculty Remarks', icon: <MessageSquare className="w-4 h-4" /> },
  ];

  // Progress update handlers
  const handleUpdateChapterStatus = (chapterId: string, status: ProgressStatus) => {
    if (!selectedTeamId) return;
    dbRepository.updateTeamProgress(selectedTeamId, chapterId, status);
  };

  const handleUpdateProjectStage = (stage: ProjectStage) => {
    if (!selectedTeamId) return;
    dbRepository.updateProject(selectedTeamId, { stage });
  };

  const handleToggleMilestone = (index: number) => {
    if (!selectedTeamId || !teamDetails?.project) return;
    const currentMilestones = [...teamDetails.project.milestones];
    currentMilestones[index].completed = !currentMilestones[index].completed;
    dbRepository.updateProject(selectedTeamId, { milestones: currentMilestones });
  };

  const handleAddMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeamId || !mediaTitle || !mediaUrl) return;
    dbRepository.addProjectMedia({
      project_id: teamDetails?.project?.id || 'pr-default',
      team_id: selectedTeamId,
      media_type: mediaType,
      url: mediaUrl,
      title: mediaTitle,
      description: 'Uploaded via Faculty Progress Dashboard',
      file_size: 2100000,
    });
    setIsMediaModalOpen(false);
    setMediaTitle('');
    setMediaUrl('');
  };

  const handleSaveRemarks = () => {
    if (!selectedTeamId) return;
    dbRepository.addAuditLog('FACULTY_REMARKS_SAVED', 'faculty_remarks', selectedTeamId, remarksState);
    alert('Faculty remarks saved and synced to School Staff portal!');
  };

  // Compute overall progress percentage
  const progressList = teamDetails?.progress || [];
  const completedChapters = progressList.filter((p: TeamProgress) => p.status === 'Completed').length;
  const overallPercentage = progressList.length > 0 ? Math.round((completedChapters / progressList.length) * 100) : 60;

  return (
    <PortalLayout allowedRoles={['faculty', 'admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                Module 4: Team-Wise Progress Tracking
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">Innovation Pod Milestones & Media</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Supervise 5-chapter completion, practical rubric scores, prototype stages, and photo logs
            </p>
          </div>

          {/* Team Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">Active Team:</span>
            <select
              value={selectedTeamId}
              onChange={(e) => setSelectedTeamId(e.target.value)}
              className="text-xs font-bold border border-slate-300 rounded-lg px-3 py-1.5 bg-white text-slate-800 shadow-xs"
            >
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  #{t.team_number} {t.name} ({t.school?.name})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Team Summary Header Card */}
        {teamDetails && (
          <Card className="p-6 bg-gradient-to-r from-emerald-900 to-green-950 text-white border-emerald-950 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                    Team #{teamDetails.team_number}
                  </span>
                  <span className="text-xs text-emerald-200/80">Class 6A • Greenwood STEM</span>
                </div>
                <h3 className="text-2xl font-extrabold text-white">{teamDetails.name}</h3>
                <p className="text-xs text-emerald-200/90 mt-1 max-w-xl">
                  {teamDetails.project?.title || 'AI and IoT Autonomous Station'}
                </p>
              </div>

              {/* Progress Gauge */}
              <div className="bg-emerald-950/70 p-4 rounded-xl border border-emerald-800/40 text-center shrink-0 min-w-[160px]">
                <span className="text-[10px] uppercase font-bold text-emerald-300 block">
                  Overall Completion
                </span>
                <span className="text-3xl font-extrabold text-white mt-0.5 block">
                  {overallPercentage}%
                </span>
                <span className="text-[11px] text-emerald-400 block mt-0.5">
                  {completedChapters} of {progressList.length || 5} Chapters Done
                </span>
              </div>
            </div>

            {/* Roster Pills */}
            <div className="mt-4 pt-4 border-t border-emerald-800/60 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-emerald-300 mr-1">Roster:</span>
              {teamDetails.members?.map((m: any) => (
                <span
                  key={m.id}
                  className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-100 border border-emerald-700/50 flex items-center gap-1"
                >
                  {m.first_name} {m.last_name}
                  {m.id === teamDetails.leader_student_id && (
                    <span className="text-[10px] text-amber-300">★ Lead</span>
                  )}
                </span>
              ))}
            </div>
          </Card>
        )}

        {/* Tab Navigation */}
        <Card className="p-2 bg-white">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </Card>

        {/* TAB A: Chapter Progress */}
        {activeTab === 'chapters' && (
          <Card>
            <CardHeader>
              <CardTitle>5-Chapter Curriculum Completion Matrix</CardTitle>
              <Badge variant="purple">Standardized Progression</Badge>
            </CardHeader>
            <div className="divide-y divide-slate-100">
              {progressList.map((tp: any, index: number) => {
                const ch = tp.chapter;
                return (
                  <div key={tp.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        {index + 1}
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">{ch?.title || `Chapter ${index + 1}`}</h5>
                        <p className="text-xs text-slate-500 mt-0.5">{ch?.learning_outcomes}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <select
                        value={tp.status}
                        onChange={(e) => handleUpdateChapterStatus(tp.chapter_id, e.target.value as ProgressStatus)}
                        className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border cursor-pointer ${
                          tp.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            : tp.status === 'In Progress'
                            ? 'bg-blue-50 text-blue-800 border-blue-300'
                            : tp.status === 'Needs Improvement'
                            ? 'bg-amber-50 text-amber-800 border-amber-300'
                            : 'bg-slate-50 text-slate-600 border-slate-300'
                        }`}
                      >
                        <option value="Not Started">Not Started</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                        <option value="Needs Improvement">Needs Improvement</option>
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* TAB B: Practical Labs */}
        {activeTab === 'practicals' && (
          <Card>
            <CardHeader>
              <CardTitle>Hands-On Practical Lab Evaluations</CardTitle>
              <Badge variant="info">30 Max Marks Practical</Badge>
            </CardHeader>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900">
                    1. Leaf Blight Visual Classifier Experiment
                  </h5>
                  <Badge variant="success">Completed (28.5 / 30)</Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Trained a 2-class vision model on tomato leaves with 94% inference accuracy using laptop webcam and local test specimens.
                </p>
                <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                  Faculty Evaluation: Exemplary dataset curation and label clarity.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900">
                    2. Capacitive Soil Probe Analog Calibration
                  </h5>
                  <Badge variant="success">Completed (27.0 / 30)</Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Calibrated ADC voltage curve on ESP32 in dry soil (3200 ADC) vs saturated soil (1450 ADC). Set trigger threshold at 2100.
                </p>
                <div className="text-[11px] text-emerald-800 font-semibold pt-1">
                  Faculty Evaluation: Accurate step curve plotting and clean serial logging.
                </div>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/20 space-y-2">
                <div className="flex items-center justify-between">
                  <h5 className="font-bold text-sm text-slate-900">
                    3. 5V Submersible Drip Pump Relay Actuation
                  </h5>
                  <Badge variant="info">In Progress (Active)</Badge>
                </div>
                <p className="text-xs text-slate-600">
                  Wiring automated relay module to open solenoid pump when moisture drops below threshold for 10 continuous seconds.
                </p>
                <div className="text-[11px] text-blue-800 font-semibold pt-1">
                  Faculty Evaluation: Working on voltage smoothing capacitor.
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* TAB C: Project Milestones */}
        {activeTab === 'project' && teamDetails?.project && (
          <Card className="p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <h4 className="text-lg font-bold text-slate-900">{teamDetails.project.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{teamDetails.project.description}</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Current Development Stage:</span>
                <select
                  value={teamDetails.project.stage}
                  onChange={(e) => handleUpdateProjectStage(e.target.value as ProjectStage)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-emerald-800"
                >
                  <option value="Ideation">1. Ideation</option>
                  <option value="Prototyping">2. Prototyping</option>
                  <option value="Testing">3. Testing</option>
                  <option value="Refining">4. Refining</option>
                  <option value="Completed">5. Completed</option>
                </select>
              </div>
            </div>

            {/* Milestones Checklist */}
            <div>
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Key Deliverable Milestones
              </h5>
              <div className="space-y-2">
                {teamDetails.project.milestones?.map((m: any, idx: number) => (
                  <div
                    key={idx}
                    onClick={() => handleToggleMilestone(idx)}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                      m.completed
                        ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950 font-medium'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded flex items-center justify-center border ${m.completed ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-slate-300'}`}>
                        {m.completed && '✓'}
                      </span>
                      <span>{m.title}</span>
                    </span>
                    <Badge variant={m.completed ? 'success' : 'default'}>
                      {m.completed ? 'Done' : 'Pending'}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Challenges Faced */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <span className="font-bold text-slate-800 block mb-1">Challenges Documented by Team:</span>
              <p className="text-slate-600">{teamDetails.project.challenges_faced || 'None reported.'}</p>
            </div>
          </Card>
        )}

        {/* TAB D: Photos & Videos */}
        {activeTab === 'media' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-slate-900">Project Demonstration Media</h4>
                <p className="text-xs text-slate-500">Photographs and videos showcasing active circuit assembly</p>
              </div>
              <Button variant="primary" size="sm" onClick={() => setIsMediaModalOpen(true)} className="gap-1.5 text-xs">
                <Plus className="w-3.5 h-3.5" />
                <span>Upload Photo / Video</span>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {teamDetails?.project?.media?.map((m: ProjectMedia) => (
                <Card key={m.id} className="overflow-hidden group">
                  <div className="h-44 bg-slate-900 relative">
                    <img
                      src={m.url}
                      alt={m.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-white">
                      {m.media_type}
                    </span>
                  </div>
                  <div className="p-3 text-xs">
                    <h5 className="font-bold text-slate-900 truncate">{m.title}</h5>
                    <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-1">{m.description}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* TAB E: Faculty Remarks */}
        {activeTab === 'remarks' && (
          <Card className="p-6 space-y-4">
            <CardHeader className="px-0 pt-0">
              <div>
                <CardTitle>Supervisory Faculty Remarks</CardTitle>
                <p className="text-xs text-slate-500 mt-0.5">
                  These qualitative remarks are rendered directly in the School Staff portal
                </p>
              </div>
            </CardHeader>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  1. Technical Observations
                </label>
                <textarea
                  rows={2}
                  value={remarksState.technical}
                  onChange={(e) => setRemarksState({ ...remarksState, technical: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  2. Innovation & Creativity Notes
                </label>
                <textarea
                  rows={2}
                  value={remarksState.innovation}
                  onChange={(e) => setRemarksState({ ...remarksState, innovation: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  3. Actionable Improvement Suggestions
                </label>
                <textarea
                  rows={2}
                  value={remarksState.improvement}
                  onChange={(e) => setRemarksState({ ...remarksState, improvement: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm border border-slate-300 rounded-lg text-slate-800"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button variant="primary" onClick={handleSaveRemarks} className="gap-2">
                  <Save className="w-4 h-4" />
                  <span>Save Faculty Remarks</span>
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Modal: Upload Media */}
        <Modal
          isOpen={isMediaModalOpen}
          onClose={() => setIsMediaModalOpen(false)}
          title="Add Project Photograph or Video"
          description="Upload or link media evidence of team's active prototyping"
          maxWidth="md"
        >
          <form onSubmit={handleAddMedia} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Media Title *
              </label>
              <input
                type="text"
                required
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder="e.g. Field Drip Solenoid Actuator Test"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Media Type
              </label>
              <select
                value={mediaType}
                onChange={(e) => setMediaType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
              >
                <option value="photo">Photograph (JPEG / PNG)</option>
                <option value="video">Demonstration Video (MP4)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Image / Video URL *
              </label>
              <input
                type="url"
                required
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg text-slate-800"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Stored securely in Supabase Storage bucket <code>agriguardian-media</code>.
              </p>
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsMediaModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Add Media Artifact
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}

export default function FacultyTeamProgressPage() {
  return (
    <React.Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm font-semibold text-slate-600">Loading Team Progress...</div>}>
      <FacultyTeamProgressContent />
    </React.Suspense>
  );
}
