'use client';

import React, { useState, useEffect } from 'react';
import {
  GraduationCap,
  Plus,
  Search,
  Phone,
  Mail,
  Building2,
  CalendarCheck,
  CheckCircle2,
  Shield,
  Layers,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { Faculty, Profile, School } from '@/types';

export default function FacultyManagementPage() {
  const [facultyList, setFacultyList] = useState<(Faculty & { profile?: Profile })[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    specialization: 'AI & IoT Agriculture Specialist',
    qualification: 'M.Tech / Ph.D. in Embedded Systems',
  });

  const loadData = () => {
    setFacultyList(dbRepository.getFaculty());
    setSchools(dbRepository.getSchools());
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  const handleCreateFaculty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      alert('Name and Email are required');
      return;
    }
    dbRepository.addFaculty(
      formData.name,
      formData.email,
      formData.phone,
      formData.specialization,
      formData.qualification
    );
    setIsAddModalOpen(false);
  };

  const filteredFaculty = facultyList.filter(
    (f) =>
      f.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">AgriGuardian Faculty Management</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage specialized AI + IoT faculty instructors, credential assignments, and substitution permissions
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Faculty Account</span>
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search faculty by instructor name, email, or specialization..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 pr-2">
            {filteredFaculty.length} Instructors
          </span>
        </div>

        {/* Faculty Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFaculty.map((f) => {
            const facultySessions = dbRepository
              .getSessions()
              .filter((s) => s.faculty_id === f.id || s.substitute_faculty_id === f.id);
            const completedCount = facultySessions.filter((s) => s.status === 'completed').length;

            return (
              <Card key={f.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-emerald-800 to-green-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {f.profile?.full_name?.substring(0, 2).toUpperCase() || 'FC'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{f.profile?.full_name}</CardTitle>
                        <Badge variant="purple">Faculty</Badge>
                      </div>
                      <p className="text-xs text-emerald-800 font-medium mt-0.5">{f.specialization}</p>
                    </div>
                  </div>
                  <Badge variant={f.is_substitute_eligible ? 'success' : 'default'}>
                    {f.is_substitute_eligible ? 'Substitute Authorized' : 'Standard'}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-xs text-slate-600 space-y-1">
                    <p className="font-medium text-slate-700">Credentials: {f.qualification}</p>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        {f.profile?.email}
                      </span>
                      {f.phone && (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          {f.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sessions & Teaching Stats */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 text-center">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Classes</span>
                      <span className="text-sm font-extrabold text-slate-800">{facultySessions.length}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Completed</span>
                      <span className="text-sm font-extrabold text-emerald-700">{completedCount}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Assigned Schools</span>
                      <span className="text-sm font-extrabold text-blue-700">{schools.length}</span>
                    </div>
                  </div>

                  {/* Recent Topic Taught */}
                  {facultySessions.length > 0 && (
                    <div className="pt-2 border-t border-slate-100 text-xs flex items-center justify-between">
                      <span className="text-slate-500">Latest Active Session:</span>
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                        {facultySessions[0].topic}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Modal: Create Faculty Account */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create AgriGuardian Faculty Account"
          description="Provision a verified instructor account with system credentials"
          maxWidth="md"
        >
          <form onSubmit={handleCreateFaculty} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Full Name with Title *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Dr. K. Radhakrishnan"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Email Address (Username) *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="faculty.name@agriguardian.io"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Contact Phone
              </label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98110 00099"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                AI / IoT Domain Specialization
              </label>
              <input
                type="text"
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                placeholder="e.g. Smart Agri-Telemetry & Sensor Networks"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Qualifications
              </label>
              <input
                type="text"
                value={formData.qualification}
                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                placeholder="e.g. Ph.D. in Robotics, M.Sc. Agronomy"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Provision Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
