import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function GrowthChart({ title, data, dataKey = 'value', color = '#10b981', height = 250 }) {
  const gradId = `grad-${dataKey}-${color.replace('#', '')}`;
  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
      <h2 className="text-sm font-semibold text-white mb-4">{title}</h2>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.3} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '8px', fontSize: '12px' }}
            labelStyle={{ color: '#94a3b8' }}
            itemStyle={{ color: '#e2e8f0' }}
          />
          <Area type="monotone" dataKey={dataKey} stroke={color} fill={`url(#${gradId})`} strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}