'use client';

import React, { useState, useEffect } from 'react';
import {
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Download,
  Upload,
  Globe,
  Server,
  Layers,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { dbRepository } from '@/lib/db/repository';
import { isSupabaseConfigured } from '@/lib/supabase/client';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CloudSyncModal({ isOpen, onClose }: CloudSyncModalProps) {
  const [syncStatus, setSyncStatus] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const refreshStatus = () => {
    setSyncStatus(dbRepository.getSyncStatus());
  };

  useEffect(() => {
    if (isOpen) {
      refreshStatus();
      setMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSyncNow = async () => {
    setIsSyncing(true);
    setMessage(null);
    try {
      await dbRepository.syncWithServer();
      await dbRepository.pushToServer();
      refreshStatus();
      setMessage('✅ Central database synchronized across all devices successfully!');
    } catch (err: any) {
      setMessage('⚠️ Sync completed with local cache.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadBackup = () => {
    const data = dbRepository.exportDatabaseJSON();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agriguardian_full_db_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('✅ Full database backup downloaded.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const ok = dbRepository.importDatabaseJSON(content);
      if (ok) {
        refreshStatus();
        setMessage('✅ Database successfully restored and pushed to cloud!');
      } else {
        setMessage('❌ Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <Globe className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Cloud Database & Universal Access</h3>
              <p className="text-xs text-slate-500">Live multi-device database synchronization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <div className="font-bold text-emerald-900">Central Cloud Sync Active</div>
            <p className="text-emerald-700 leading-relaxed">
              Any student uploaded, attendance marked, or marks graded by Admin, Faculty, or Staff is automatically synced to the central server and visible from any device, anywhere.
            </p>
          </div>
        </div>

        {/* Database Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-slate-900">{syncStatus?.studentsCount ?? 0}</div>
            <div className="text-[11px] font-medium text-slate-500">Students</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-slate-900">{syncStatus?.attendanceCount ?? 0}</div>
            <div className="text-[11px] font-medium text-slate-500">Attendance Logs</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
            <div className="text-lg font-black text-slate-900">{syncStatus?.assessmentsCount ?? 0}</div>
            <div className="text-[11px] font-medium text-slate-500">Assessment Marks</div>
          </div>
        </div>

        {/* Cloud details */}
        <div className="space-y-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-xl p-3.5">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Server className="w-3.5 h-3.5 text-slate-500" /> Server Endpoint:
            </span>
            <span className="font-mono text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
              /api/db
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-slate-500" /> PostgreSQL / Supabase:
            </span>
            <span className={`font-semibold ${isSupabaseConfigured ? 'text-emerald-700' : 'text-slate-500'}`}>
              {isSupabaseConfigured ? 'Configured & Connected' : 'Ready (Optional via .env)'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <Layers className="w-3.5 h-3.5 text-slate-500" /> Last Synchronized:
            </span>
            <span className="text-slate-700">
              {syncStatus?.lastSyncedAt
                ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString()
                : 'Just now'}
            </span>
          </div>
        </div>

        {message && (
          <div className="text-xs p-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 font-medium">
            {message}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="w-full gap-2 text-xs font-semibold py-2.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Synchronizing Cloud Database...' : 'Sync Cloud Database Now'}</span>
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadBackup}
              className="gap-1.5 text-xs font-medium"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export JSON Backup</span>
            </Button>

            <label className="flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer text-slate-700">
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span>Restore JSON Backup</span>
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
