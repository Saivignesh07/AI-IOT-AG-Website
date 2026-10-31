'use client';

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  Upload,
  CheckCircle2,
  AlertCircle,
  Building2,
  Users,
  Layers,
  ArrowRight,
  FileCheck,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Tabs } from '@/components/ui/tabs';
import { dbRepository } from '@/lib/db/repository';

interface ParsedSheet {
  sheetName: string;
  gradeLevel: number; // 6, 7, 8, 9
  students: Array<{
    name: string;
    roll?: string;
    gender?: string;
    parentName?: string;
    parentPhone?: string;
  }>;
}

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const [fileName, setFileName] = useState<string>('');
  const [parsedSheets, setParsedSheets] = useState<ParsedSheet[]>([]);
  const [activePreviewTab, setActivePreviewTab] = useState<string>('6');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successResult, setSuccessResult] = useState<{ totalImported: number; classWiseCounts: Record<number, number> } | null>(null);

  const resetState = () => {
    setFileName('');
    setParsedSheets([]);
    setErrorMsg('');
    setSuccessResult(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessResult(null);
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });

        const results: ParsedSheet[] = [];

        workbook.SheetNames.forEach((sheetName) => {
          // Detect grade level from sheet name (e.g. '6', '7', '8', '9', 'Class 6', 'Grade 7')
          let gradeLevel = 0;
          const lower = sheetName.toLowerCase().trim();
          if (lower.includes('6')) gradeLevel = 6;
          else if (lower.includes('7')) gradeLevel = 7;
          else if (lower.includes('8')) gradeLevel = 8;
          else if (lower.includes('9')) gradeLevel = 9;

          if (gradeLevel === 0) return; // skip unrelated sheets

          const worksheet = workbook.Sheets[sheetName];
          const rawRows: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

          if (!rawRows || rawRows.length === 0) return;

          const studentsList: Array<{ name: string; roll?: string; gender?: string }> = [];

          // Identify name column index
          let nameColIdx = -1;
          let rollColIdx = -1;
          let startRow = 0;

          // Check first few rows for header
          for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
            const row = rawRows[r] || [];
            for (let c = 0; c < row.length; c++) {
              const val = String(row[c] || '').toLowerCase().trim();
              if (val.includes('name') || val.includes('student') || val.includes('candidate')) {
                nameColIdx = c;
                startRow = r + 1;
              }
              if (val.includes('roll') || val.includes('reg') || val.includes('s.no') || val.includes('sl')) {
                rollColIdx = c;
              }
            }
            if (nameColIdx !== -1) break;
          }

          // If no explicit header, assume column 0 is roll / sno and column 1 is name, or column 0 is name
          if (nameColIdx === -1) {
            nameColIdx = rawRows[0]?.length > 1 ? 1 : 0;
            startRow = 0;
          }

          for (let r = startRow; r < rawRows.length; r++) {
            const row = rawRows[r];
            if (!row || row.length === 0) continue;

            const nameVal = String(row[nameColIdx] || '').trim();
            if (!nameVal || nameVal.toLowerCase() === 'name' || nameVal.toLowerCase().includes('student')) {
              continue;
            }

            // Exclude common header or footer text
            if (/^(total|boys|girls|absent|present|signature)$/i.test(nameVal)) continue;

            const rollVal = rollColIdx !== -1 ? String(row[rollColIdx] || '').trim() : undefined;

            studentsList.push({
              name: nameVal,
              roll: rollVal && !isNaN(Number(rollVal)) ? `SAGJ-0${gradeLevel}-${String(rollVal).padStart(2, '0')}` : rollVal,
            });
          }

          results.push({
            sheetName,
            gradeLevel,
            students: studentsList,
          });
        });

        if (results.length === 0) {
          setErrorMsg(
            `Found sheets (${workbook.SheetNames.join(', ')}), but could not identify sheets corresponding to Class 6, 7, 8, or 9. Please ensure sheets are named 6, 7, 8, 9.`
          );
        } else {
          // Sort 6, 7, 8, 9
          results.sort((a, b) => a.gradeLevel - b.gradeLevel);
          setParsedSheets(results);
          setActivePreviewTab(String(results[0].gradeLevel));
        }
      } catch (err: any) {
        setErrorMsg('Failed to parse Excel file: ' + err.message);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setErrorMsg('File reading failed. Please try again.');
      setIsProcessing(false);
    };

    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = () => {
    if (parsedSheets.length === 0) return;

    try {
      const res = dbRepository.importExcelWorkbookStudents(parsedSheets);
      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMsg('Import failed: ' + err.message);
    }
  };

  const previewTabs = parsedSheets.map((p) => ({
    id: String(p.gradeLevel),
    label: `Sheet "${p.sheetName}" (Class ${p.gradeLevel})`,
    count: p.students.length,
  }));

  const activeSheet = parsedSheets.find((p) => String(p.gradeLevel) === activePreviewTab);
  const totalStudentsInWorkbook = parsedSheets.reduce((sum, p) => sum + p.students.length, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        resetState();
        onClose();
      }}
      title="Import Shree A G Jain School Excel Workbook"
      description="Upload the official Excel file containing sheets for Classes 6, 7, 8, and 9"
      maxWidth="2xl"
    >
      <div className="space-y-5">
        {/* School Target Confirmation Banner */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-800 text-white flex items-center justify-center font-bold text-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 block">
                Target Institution
              </span>
              <h4 className="font-extrabold text-sm text-slate-900">Shree A G Jain School (Code: SAGJ-01)</h4>
              <p className="text-slate-500 text-[11px]">Primary active campus for AI + IoT education cohorts</p>
            </div>
          </div>
          <Badge variant="success">Campus Active</Badge>
        </div>

        {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

        {/* Success Banner */}
        {successResult && (
          <div className="bg-emerald-100/70 border border-emerald-300 rounded-xl p-5 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-700 mx-auto" />
            <h4 className="font-extrabold text-base text-emerald-950">
              Successfully Enrolled {successResult.totalImported} Students!
            </h4>
            <div className="flex justify-center gap-3 text-xs pt-1">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-slate-800">
                Class 6: {successResult.classWiseCounts[6] || 0}
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-slate-800">
                Class 7: {successResult.classWiseCounts[7] || 0}
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-slate-800">
                Class 8: {successResult.classWiseCounts[8] || 0}
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-semibold text-slate-800">
                Class 9: {successResult.classWiseCounts[9] || 0}
              </span>
            </div>
            <p className="text-xs text-emerald-800 pt-2">
              All students have been assigned roll numbers and enrolled in their respective classes.
            </p>
            <Button
              variant="primary"
              onClick={() => {
                resetState();
                onClose();
              }}
              className="mt-3"
            >
              Close & View Student Directory
            </Button>
          </div>
        )}

        {/* Upload Dropzone */}
        {!successResult && parsedSheets.length === 0 && (
          <div className="border-2 border-dashed border-slate-300 hover:border-emerald-600 rounded-2xl p-8 text-center bg-slate-50/50 hover:bg-emerald-50/30 transition-all cursor-pointer relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
            <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h5 className="font-bold text-sm text-slate-800 mt-1">
                Drop your Shree A G Jain School Excel file here, or click to browse
              </h5>
              <p className="text-xs text-slate-500 max-w-sm">
                Workbook containing sheets <strong>6</strong>, <strong>7</strong>, <strong>8</strong>, and <strong>9</strong> with student names. Supports .xlsx and .xls formats.
              </p>
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 mt-2">
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                  <span>Parsing workbook sheets...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Parsed Sheets Preview */}
        {!successResult && parsedSheets.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-emerald-700" />
                <span className="font-bold text-sm text-slate-900 truncate max-w-xs">{fileName}</span>
              </div>
              <Badge variant="success">
                {totalStudentsInWorkbook} Total Students Detected
              </Badge>
            </div>

            {/* Sheet Tabs */}
            <Tabs
              tabs={previewTabs}
              activeTab={activePreviewTab}
              onChange={setActivePreviewTab}
            />

            {/* Table of Parsed Students */}
            {activeSheet && (
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">
                    Class {activeSheet.gradeLevel} Roster (Sheet: &quot;{activeSheet.sheetName}&quot;)
                  </span>
                  <span className="font-bold text-emerald-800">
                    {activeSheet.students.length} Students
                  </span>
                </div>
                <div className="max-h-56 overflow-y-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-500 uppercase text-[10px] font-bold sticky top-0">
                      <tr>
                        <th className="px-4 py-2">S.No</th>
                        <th className="px-4 py-2">Student Name</th>
                        <th className="px-4 py-2">Assigned Roll</th>
                        <th className="px-4 py-2">Target Class</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSheet.students.map((st, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <td className="px-4 py-1.5 text-slate-400 font-mono">{i + 1}</td>
                          <td className="px-4 py-1.5 font-bold text-slate-800">{st.name}</td>
                          <td className="px-4 py-1.5 font-mono text-emerald-800">
                            {st.roll || `SAGJ-0${activeSheet.gradeLevel}A-${String(i + 1).padStart(2, '0')}`}
                          </td>
                          <td className="px-4 py-1.5 text-slate-600">Class {activeSheet.gradeLevel}A</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={resetState}>
                Upload Different File
              </Button>
              <Button
                variant="primary"
                onClick={handleConfirmImport}
                className="gap-2 font-bold bg-emerald-700 hover:bg-emerald-800"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Enroll {totalStudentsInWorkbook} Students into Shree A G Jain School</span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
