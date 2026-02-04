import React from 'react';
import { LayoutDashboard, Printer, Package, FileBarChart, Settings } from 'lucide-react';

interface SidebarProps {
  currentView: 'overview' | 'devices' | 'inventory';
  onNavigate: (view: 'overview' | 'devices' | 'inventory') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
  const getLinkClass = (view: string) => {
    const isActive = currentView === view;
    if (isActive) {
      return "flex items-center gap-3 px-3 py-2 text-sm font-medium text-white bg-primary/10 border border-primary/20 rounded-md shadow-[0_0_15px_rgba(99,102,241,0.15)] group cursor-pointer";
    }
    return "flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-pointer";
  };

  const getIconClass = (view: string) => {
    return currentView === view ? "text-primary group-hover:text-white transition-colors" : "";
  };

  return (
    <aside className="w-64 bg-[#0f1420] flex flex-col shrink-0 border-r border-border hidden md:flex h-screen sticky top-0">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-primary/20 rounded-lg">
            <Printer className="text-primary" size={20} />
          </div>
          <span className="font-bold text-white tracking-tight">PrintOps NOC</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-6">
        <div className="px-4 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">Monitor</div>
        <ul className="space-y-1 px-3 mb-6">
          <li>
            <a onClick={() => onNavigate('overview')} className={getLinkClass('overview')}>
              <LayoutDashboard size={18} className={getIconClass('overview')} />
              Overview
            </a>
          </li>
          <li>
            <a onClick={() => onNavigate('devices')} className={getLinkClass('devices')}>
              <Printer size={18} className={getIconClass('devices')} />
              Devices
            </a>
          </li>
          <li>
            <a onClick={() => onNavigate('inventory')} className={getLinkClass('inventory')}>
              <Package size={18} className={getIconClass('inventory')} />
              Inventory
            </a>
          </li>
        </ul>

        <div className="px-4 mb-2 text-xs font-semibold text-secondary uppercase tracking-wider">System</div>
        <ul className="space-y-1 px-3">
          <li>
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-not-allowed opacity-50">
              <FileBarChart size={18} />
              Reports
            </a>
          </li>
          <li>
            <a className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:text-white hover:bg-white/5 rounded-md transition-colors cursor-not-allowed opacity-50">
              <Settings size={18} />
              Settings
            </a>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;