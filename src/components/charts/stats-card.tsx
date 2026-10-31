'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  color?: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
}

export function StatsCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'emerald',
}: StatsCardProps) {
  const colorStyles = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    blue: 'bg-blue-50 text-blue-800 border-blue-100',
    amber: 'bg-amber-50 text-amber-800 border-amber-100',
    purple: 'bg-purple-50 text-purple-800 border-purple-100',
    rose: 'bg-rose-50 text-rose-800 border-rose-100',
  };

  const iconStyles = {
    emerald: 'bg-emerald-800 text-emerald-100',
    blue: 'bg-blue-700 text-blue-100',
    amber: 'bg-amber-600 text-amber-100',
    purple: 'bg-purple-700 text-purple-100',
    rose: 'bg-rose-700 text-rose-100',
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <div className="p-5 flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 tracking-tight">{value}</h4>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1.5 mt-2">
              <span
                className={cn(
                  'text-xs font-bold px-1.5 py-0.5 rounded',
                  trend.isPositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                )}
              >
                {trend.isPositive ? '↑' : '↓'} {trend.value}
              </span>
              <span className="text-[11px] text-slate-400">vs last month</span>
            </div>
          )}
        </div>
        <div className={cn('p-3 rounded-xl shadow-xs shrink-0', iconStyles[color])}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}
