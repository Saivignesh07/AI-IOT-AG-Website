'use client';

import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';

interface AssessmentChartProps {
  data?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
}

const DEFAULT_GRADE_DATA = [
  { name: 'A+ (90-100%)', value: 45, color: '#15803D' },
  { name: 'A (80-89%)', value: 30, color: '#16A34A' },
  { name: 'B (70-79%)', value: 15, color: '#3B82F6' },
  { name: 'C (60-69%)', value: 7, color: '#F59E0B' },
  { name: 'Needs Support (<60%)', value: 3, color: '#EF4444' },
];

export function AssessmentDistributionChart({ data = DEFAULT_GRADE_DATA }: AssessmentChartProps) {
  return (
    <div className="w-full h-72 flex items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
            contentStyle={{
              backgroundColor: '#FFFFFF',
              borderColor: '#E2E8F0',
              borderRadius: '0.75rem',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              fontSize: '12px',
            }}
          />
          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
