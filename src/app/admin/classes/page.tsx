'use client';

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Plus,
  BookOpen,
  Cpu,
  Bot,
  Sparkles,
  ChevronRight,
  School as SchoolIcon,
  CheckCircle,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Tabs } from '@/components/ui/tabs';
import { dbRepository } from '@/lib/db/repository';
import { ClassGrade, Section, Chapter, School } from '@/types';

export default function ClassManagementPage() {
  const [classes, setClasses] = useState<ClassGrade[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedGrade, setSelectedGrade] = useState<number>(6);
  const [isAddSectionModalOpen, setIsAddSectionModalOpen] = useState(false);

  // New section form
  const [newSectionData, setNewSectionData] = useState({
    schoolId: '',
    name: 'C',
    roomNumber: 'Agri-Tech Lab 103',
  });

  const loadData = () => {
    const clsList = dbRepository.getClasses();
    const secList = dbRepository.getSections();
    const schList = dbRepository.getSchools();
    setClasses(clsList);
    setSections(secList);
    setSchools(schList);
    if (schList.length > 0 && !newSectionData.schoolId) {
      setNewSectionData((prev) => ({ ...prev, schoolId: schList[0].id }));
    }
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  const currentClass = classes.find((c) => c.grade_level === selectedGrade);
  const chapters = currentClass ? dbRepository.getChapters(currentClass.id) : [];

  const handleCreateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentClass) return;
    try {
      dbRepository.addSection(
        newSectionData.schoolId,
        currentClass.id,
        newSectionData.name,
        newSectionData.roomNumber
      );
      setIsAddSectionModalOpen(false);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const gradeTabs = classes.map((c) => {
    const studentCount = dbRepository.getStudents(undefined, c.id).length;
    return {
      id: String(c.grade_level),
      label: `Class ${c.grade_level}`,
      count: studentCount,
    };
  });

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Class & Curriculum Architecture</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Governing Classes 6, 7, 8, 9 with the standardized 5-Chapter AI + IoT AgriGuardian Framework
            </p>
          </div>
          <Button
            variant="primary"
            onClick={() => setIsAddSectionModalOpen(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section to Class {selectedGrade}</span>
          </Button>
        </div>

        {/* Grade Level Selector Tabs */}
        <Card className="p-2 bg-white">
          <Tabs
            tabs={gradeTabs}
            activeTab={String(selectedGrade)}
            onChange={(tabId) => setSelectedGrade(Number(tabId))}
          />
        </Card>

        {/* Current Class Overview Card */}
        {currentClass && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 p-6 space-y-4 bg-gradient-to-br from-emerald-900 to-green-950 text-white border-emerald-950">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded border border-emerald-400/30">
                  Curriculum Standard 2026-2027
                </span>
                <h3 className="text-xl font-extrabold mt-2 text-white">{currentClass.name}</h3>
                <p className="text-xs text-emerald-200/80 mt-1">{currentClass.description}</p>
              </div>

              <div className="pt-4 border-t border-emerald-800/60 space-y-2 text-xs">
                <div className="flex justify-between text-emerald-200">
                  <span>Enrolled Students:</span>
                  <span className="font-bold text-white">
                    {dbRepository.getStudents(undefined, currentClass.id).length} Students
                  </span>
                </div>
                <div className="flex justify-between text-emerald-200">
                  <span>Standardized Chapters:</span>
                  <span className="font-bold text-white">5 Chapters (2 AI, 2 IoT, 1 Capstone)</span>
                </div>
                <div className="flex justify-between text-emerald-200">
                  <span>Sections Created:</span>
                  <span className="font-bold text-white">
                    {sections.filter((s) => s.class_id === currentClass.id).length} Active Sections
                  </span>
                </div>
              </div>

              {/* Sections List in this Grade */}
              <div className="pt-4 border-t border-emerald-800/60">
                <p className="text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-2">
                  Active Sections in Schools:
                </p>
                <div className="space-y-1.5">
                  {sections
                    .filter((s) => s.class_id === currentClass.id)
                    .map((sec) => {
                      const sch = schools.find((s) => s.id === sec.school_id);
                      return (
                        <div
                          key={sec.id}
                          className="bg-emerald-950/60 p-2.5 rounded-lg border border-emerald-800/40 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-white">Section {sec.name}</span>
                            <span className="text-[11px] text-emerald-300 block truncate max-w-[170px]">
                              {sch?.name}
                            </span>
                          </div>
                          <Badge variant="success">Room {sec.room_number || 'TBD'}</Badge>
                        </div>
                      );
                    })}
                </div>
              </div>
            </Card>

            {/* 5 Chapters Display (2 AI, 2 IoT, 1 Capstone) */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-base text-slate-800">
                  Curriculum Structure: 5 Dedicated Modules
                </h4>
                <div className="flex items-center gap-2 text-xs font-semibold">
                  <span className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                    <Bot className="w-3.5 h-3.5" /> 2 AI Chapters
                  </span>
                  <span className="flex items-center gap-1 text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                    <Cpu className="w-3.5 h-3.5" /> 2 IoT Chapters
                  </span>
                  <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    <Sparkles className="w-3.5 h-3.5" /> 1 Capstone
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {chapters.map((ch) => {
                  const isCapstone = ch.category === 'AI_IoT_Capstone';
                  const isAI = ch.category === 'AI';

                  return (
                    <Card
                      key={ch.id}
                      className={`p-4 transition-all hover:shadow-sm ${
                        isCapstone
                          ? 'border-emerald-300 bg-emerald-50/20'
                          : isAI
                          ? 'border-purple-200 bg-white'
                          : 'border-blue-200 bg-white'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                              isCapstone
                                ? 'bg-emerald-600 text-white'
                                : isAI
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            Ch {ch.chapter_number}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-sm text-slate-900">{ch.title}</h5>
                              <Badge
                                variant={
                                  isCapstone ? 'success' : isAI ? 'purple' : 'info'
                                }
                              >
                                {isCapstone
                                  ? 'Combined AI + IoT Capstone'
                                  : isAI
                                  ? 'Artificial Intelligence'
                                  : 'Internet of Things'}
                              </Badge>
                            </div>
                            <p className="text-xs text-slate-500 mt-1">{ch.description}</p>
                            <div className="mt-2 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-700">
                              <span className="font-semibold text-slate-800">Learning Outcomes:</span>{' '}
                              {ch.learning_outcomes}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Practical Activities inside chapter */}
                      {ch.practicals && ch.practicals.length > 0 && (
                        <div className="mt-3 pt-3 border-t border-slate-100 pl-12">
                          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                            Associated Practical Activity
                          </p>
                          {ch.practicals.map((p) => (
                            <div key={p.id} className="text-xs text-slate-700 flex items-start gap-2">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-semibold text-slate-800">{p.title}</span>
                                <span className="text-slate-500 block text-[11px]">{p.description}</span>
                                {p.required_hardware && (
                                  <span className="text-[11px] text-emerald-800 font-medium block mt-0.5">
                                    Hardware: {p.required_hardware}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Modal: Add Section */}
        <Modal
          isOpen={isAddSectionModalOpen}
          onClose={() => setIsAddSectionModalOpen(false)}
          title={`Add New Section for Class ${selectedGrade}`}
          description="Create a section in a partner school and allocate a lab room"
          maxWidth="md"
        >
          <form onSubmit={handleCreateSection} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Partner School *
              </label>
              <select
                required
                value={newSectionData.schoolId}
                onChange={(e) => setNewSectionData({ ...newSectionData, schoolId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 bg-white text-slate-800"
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
                Section Name (e.g. A, B, C, D) *
              </label>
              <input
                type="text"
                required
                maxLength={2}
                value={newSectionData.name}
                onChange={(e) => setNewSectionData({ ...newSectionData, name: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800 font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Room Number / Lab Allocation
              </label>
              <input
                type="text"
                value={newSectionData.roomNumber}
                onChange={(e) => setNewSectionData({ ...newSectionData, roomNumber: e.target.value })}
                placeholder="e.g. Agri-IoT Lab 202"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddSectionModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Create Section
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
