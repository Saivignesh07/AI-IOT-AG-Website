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

interface AttendanceChartProps {
  data?: Array<{
    date: string;
    present: number;
    absent: number;
    late: number;
  }>;
}

const DEFAULT_DATA = [
  { date: 'Mon 26', present: 28, absent: 2, late: 2 },
  { date: 'Tue 27', present: 30, absent: 1, late: 1 },
  { date: 'Wed 28', present: 29, absent: 3, late: 0 },
  { date: 'Thu 29', present: 31, absent: 1, late: 0 },
  { date: 'Fri 30', present: 27, absent: 4, late: 1 },
  { date: 'Sat 31', present: 32, absent: 0, late: 0 },
];

export function AttendanceChart({ data = DEFAULT_DATA }: AttendanceChartProps) {
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
