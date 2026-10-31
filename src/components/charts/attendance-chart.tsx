'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { CalendarX } from 'lucide-react';

interface AttendanceChartProps {
  data?: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

export function AttendanceChart({ data }: AttendanceChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="w-full h-72 flex flex-col items-center justify-center gap-3 text-slate-400">
        <CalendarX className="w-10 h-10 opacity-40" />
        <p className="text-sm font-medium">No sessions recorded yet</p>
        <p className="text-xs text-slate-400">Attendance data will appear here once sessions are marked</p>
      </div>
    );
  }

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis dataKey="date" tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} />
          <YAxis tick={{ fill: '#64748B', fontSize: 12 }} axisLine={{ stroke: '#CBD5E1' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '8px' }} />
          <Bar dataKey="present" name="Present" fill="#15803D" radius={[4, 4, 0, 0]} />
          <Bar dataKey="late" name="Late" fill="#EAB308" radius={[4, 4, 0, 0]} />
          <Bar dataKey="absent" name="Absent" fill="#E11D48" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
