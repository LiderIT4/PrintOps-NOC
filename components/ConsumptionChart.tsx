import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: '00:00', pages: 120 },
  { name: '04:00', pages: 50 },
  { name: '08:00', pages: 800 },
  { name: '12:00', pages: 1200 },
  { name: '16:00', pages: 950 },
  { name: '20:00', pages: 300 },
  { name: '23:59', pages: 150 },
];

const ConsumptionChart: React.FC = () => {
  return (
    <div className="bg-surface rounded-xl border border-border shadow-lg p-5 flex flex-col h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Daily Fleet Volume</h3>
          <p className="text-xs text-secondary mt-1">Total impressions today across all devices</p>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-2xl font-bold text-white font-mono">3,570</span>
           <span className="text-xs bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">+12%</span>
        </div>
      </div>
      
      <div className="flex-1 min-h-[200px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorPages" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a3447" vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={10} 
              tickLine={false} 
              axisLine={false} 
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ backgroundColor: '#161e2e', borderColor: '#2a3447', color: '#fff' }}
              itemStyle={{ color: '#6366f1' }}
              cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="pages" 
              stroke="#6366f1" 
              strokeWidth={2}
              fillOpacity={1} 
              fill="url(#colorPages)" 
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ConsumptionChart;
