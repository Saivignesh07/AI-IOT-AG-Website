'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Search,
  Filter,
  Clock,
  User,
  Database,
  CheckCircle,
} from 'lucide-react';
import { PortalLayout } from '@/components/layout/portal-layout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { dbRepository } from '@/lib/db/repository';
import { formatDate } from '@/lib/utils';
import { AuditLog } from '@/types';

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const loadLogs = () => {
    setLogs(dbRepository.getAuditLogs());
  };

  useEffect(() => {
    loadLogs();
    return dbRepository.subscribe(loadLogs);
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.entity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user_email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesAction = actionFilter === 'all' ? true : log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  const getActionBadge = (action: string) => {
    if (action.includes('CREATE') || action.includes('ADD')) return <Badge variant="success">{action}</Badge>;
    if (action.includes('UPDATE')) return <Badge variant="info">{action}</Badge>;
    if (action.includes('SUBMIT')) return <Badge variant="purple">{action}</Badge>;
    return <Badge variant="default">{action}</Badge>;
  };

  return (
    <PortalLayout allowedRoles={['admin']}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-xl font-bold text-slate-900">System Audit Trail & Compliance</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Immutable log recording administrative changes, attendance submissions, and grade entries
          </p>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search audit trail by user email, action name, or entity..."
              className="w-full pl-9 pr-4 py-1.5 text-xs sm:text-sm border-0 focus:outline-none focus:ring-0 text-slate-800"
            />
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-slate-50 text-slate-700 font-medium"
            >
              <option value="all">All Actions</option>
              <option value="CREATE_SCHOOL">CREATE_SCHOOL</option>
              <option value="ADD_STUDENT">ADD_STUDENT</option>
              <option value="CREATE_TEAM">CREATE_TEAM</option>
              <option value="SUBMIT_ATTENDANCE">SUBMIT_ATTENDANCE</option>
              <option value="SUBMIT_ASSESSMENT_MARKS">SUBMIT_ASSESSMENT_MARKS</option>
            </select>
          </div>
        </div>

        {/* Audit Logs Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Timestamp</th>
                  <th className="px-6 py-3.5">User / Operator</th>
                  <th className="px-6 py-3.5">Action Executed</th>
                  <th className="px-6 py-3.5">Entity Type</th>
                  <th className="px-6 py-3.5">Operation Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-emerald-700" />
                        <span className="font-semibold text-slate-800">{log.user_email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-6 py-4 font-mono text-xs font-semibold text-slate-600">
                      {log.entity_type}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600 max-w-xs truncate">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </PortalLayout>
  );
}
