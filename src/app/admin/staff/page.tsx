'use client';

import React, { useState, useEffect } from 'react';
import {
  Users,
  Plus,
  Search,
  Building2,
  Mail,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { dbRepository } from '@/lib/db/repository';
import { SchoolStaff, Profile, School } from '@/types';

export default function StaffManagementPage() {
  const [staffList, setStaffList] = useState<(SchoolStaff & { profile?: Profile; school?: School })[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Form
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    schoolId: '',
    designation: 'STEM Lab Coordinator',
    employeeId: '',
  });

  const loadData = () => {
    setStaffList(dbRepository.getStaff());
    const schList = dbRepository.getSchools();
    setSchools(schList);
    if (schList.length > 0 && !formData.schoolId) {
      setFormData((prev) => ({ ...prev, schoolId: schList[0].id }));
    }
  };

  useEffect(() => {
    loadData();
    return dbRepository.subscribe(loadData);
  }, []);

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.schoolId) {
      alert('Name, Email, and School assignment are required.');
      return;
    }
    dbRepository.addStaff(
      formData.name,
      formData.email,
      formData.schoolId,
      formData.designation,
      formData.employeeId || `ST-${Math.floor(Math.random() * 900 + 100)}`
    );
    setIsAddModalOpen(false);
  };

  const filteredStaff = staffList.filter(
    (s) =>
      s.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.school?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.designation?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">School Staff Accounts & Isolation</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision view-only institutional staff access with strict database-level single-school tenancy
            </p>
          </div>
          <Button variant="primary" onClick={() => setIsAddModalOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            <span>Create Staff Account</span>
          </Button>
        </div>

        {/* Security Policy Reminder Box */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3 text-xs text-emerald-900">
          <Lock className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-emerald-950 block mb-0.5">
              Strict Multi-School Tenancy & Read-Only Governance:
            </span>
            School staff accounts are bound to a single school UUID at the database layer. Even via API or direct request, staff cannot view data belonging to other schools, and all write operations (creating/editing marks, sessions, or attendance) are blocked by PostgreSQL RLS.
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
              placeholder="Search staff by coordinator name, school, email, or designation..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>
          <span className="text-xs font-semibold text-slate-500 pr-2">
            {filteredStaff.length} Accounts Active
          </span>
        </div>

        {/* Staff Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Staff Coordinator</th>
                  <th className="px-6 py-3.5">Assigned Institution</th>
                  <th className="px-6 py-3.5">Designation & Dept</th>
                  <th className="px-6 py-3.5">Employee ID</th>
                  <th className="px-6 py-3.5">Access Permission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredStaff.map((staff) => (
                  <tr key={staff.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                          {staff.profile?.full_name?.substring(0, 2).toUpperCase() || 'ST'}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{staff.profile?.full_name}</p>
                          <p className="text-xs text-slate-500">{staff.profile?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building2 className="w-4 h-4 text-emerald-700" />
                        <span>{staff.school?.name}</span>
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono block pl-5">
                        {staff.school?.city}, {staff.school?.state}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-800 block">{staff.designation}</span>
                      <span className="text-xs text-slate-500">{staff.department}</span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                      {staff.employee_id}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Lock className="w-3 h-3 text-emerald-700" />
                        Strict Read-Only
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Modal: Create Staff Account */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Create School Staff Account"
          description="Provision school authority login tied to their institutional data silo"
          maxWidth="md"
        >
          <form onSubmit={handleCreateStaff} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Coordinator Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Rajiv Menon"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                School Work Email *
              </label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="staff.name@school.edu.in"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Assigned Partner School *
              </label>
              <select
                required
                value={formData.schoolId}
                onChange={(e) => setFormData({ ...formData, schoolId: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800 bg-white"
              >
                {schools.map((sch) => (
                  <option key={sch.id} value={sch.id}>
                    {sch.name} ({sch.city})
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-500 mt-1">
                Data isolation will restrict this user strictly to the selected school.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Designation / Position
              </label>
              <input
                type="text"
                value={formData.designation}
                onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                placeholder="e.g. Vice Principal, STEM Coordinator"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                School Employee ID
              </label>
              <input
                type="text"
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                placeholder="e.g. GW-ST-902"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-700 text-slate-800"
              />
            </div>

            <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                Provision Staff Account
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </PortalLayout>
  );
}
