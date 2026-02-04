import React from 'react';
import { DashboardStats } from '../types';
import { Printer, Wifi, AlertTriangle, XCircle } from 'lucide-react';

interface Props {
  stats: DashboardStats;
}

const StatCard = ({ title, value, icon: Icon, colorClass, borderClass }: any) => (
  <div className={`bg-surface p-5 rounded-xl border border-border shadow-lg flex items-center gap-4 relative overflow-hidden group transition-all hover:translate-y-[-2px] ${borderClass}`}>
    <div className={`absolute right-0 top-0 h-full w-1 ${colorClass} opacity-50`}></div>
    <div className={`p-3 rounded-lg bg-opacity-10 ring-1 ring-inset ${colorClass.replace('bg-', 'text-').replace('bg-', 'ring-')} bg-current`}>
      <Icon size={24} />
    </div>
    <div>
      <p className="text-xs font-semibold text-secondary uppercase tracking-wider mb-0.5">{title}</p>
      <h3 className="text-2xl font-bold text-white tracking-tight">{value}</h3>
    </div>
  </div>
);

const DashboardOverview: React.FC<Props> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard 
        title="Total Devices" 
        value={stats.total} 
        icon={Printer} 
        colorClass="bg-blue-500" 
        borderClass="hover:border-blue-500/30"
      />
      <StatCard 
        title="Online" 
        value={stats.online} 
        icon={Wifi} 
        colorClass="bg-emerald-500" 
        borderClass="hover:border-emerald-500/30"
      />
      <StatCard 
        title="Warnings" 
        value={stats.warnings} 
        icon={AlertTriangle} 
        colorClass="bg-amber-500" 
        borderClass="hover:border-amber-500/30"
      />
      <StatCard 
        title="Critical" 
        value={stats.critical} 
        icon={XCircle} 
        colorClass="bg-red-500" 
        borderClass="hover:border-red-500/30"
      />
    </div>
  );
};

export default DashboardOverview;
