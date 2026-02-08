import React, { useEffect, useState, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import PrinterCard from './components/PrinterCard';
import DashboardOverview from './components/DashboardOverview';
import ConsumptionChart from './components/ConsumptionChart';
import InventoryView from './components/InventoryView';
import { subscribeToPrinterStatus, fetchPrinters } from './services/printerService';
import { Printer, DashboardStats } from './types';
import { Search, Bell, HelpCircle, Loader2, Droplet, LayoutGrid } from 'lucide-react';
import { parseInkString } from './utils/helpers';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'devices' | 'inventory'>('overview');
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [scanComplete, setScanComplete] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Carga inicial y actualización cada 12 horas
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    const loadPrinters = async () => {
      if (printers.length === 0) setIsLoading(true);
      try {
        const printersData = await fetchPrinters();
        setPrinters(printersData);
        setScanComplete(true);
      } catch (err) {
        // Si falla, deja los datos actuales
      }
      if (printers.length === 0) setIsLoading(false);
    };
    loadPrinters();
    intervalId = setInterval(loadPrinters, 30 * 1000); // 30 seconds
    return () => clearInterval(intervalId);
  }, []);

  const stats: DashboardStats = useMemo(() => {
    return {
      total: printers.length,
      online: printers.filter(p => p.status === 'online').length,
      warnings: printers.filter(p => {
        const hasLowInk = p.inkLevels.some(lvl => parseInkString(lvl).level < 15);
        return p.status === 'warning' || (p.status === 'online' && hasLowInk);
      }).length,
      critical: printers.filter(p => p.status === 'offline').length
    };
  }, [printers]);

  // Base list of filtered printers (used for Devices view)
  const allFilteredPrinters = useMemo(() => {
    return printers.filter(p =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.ip.includes(searchTerm) ||
      p.model.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [printers, searchTerm]);

  // Subset for Overview (lowest ink, max 4)
  const criticalInkPrinters = useMemo(() => {
    // Clone array to avoid sorting the original reference
    const sorted = [...allFilteredPrinters].sort((a, b) => {
      const getMinLevel = (printer: Printer) => {
        if (!printer.inkLevels || printer.inkLevels.length === 0) return 100;
        const levels = printer.inkLevels.map(l => parseInkString(l).level);
        return Math.min(...levels);
      };
      return getMinLevel(a) - getMinLevel(b);
    });

    return sorted.slice(0, 4);
  }, [allFilteredPrinters]);

  return (
    <div className="flex min-h-screen bg-background text-slate-300">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />

      <main className="flex-1 flex flex-col min-w-0 relative overflow-hidden">
        {/* Background Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        {/* Header */}
        <header className="h-16 bg-background/80 backdrop-blur border-b border-border flex items-center justify-between px-6 shrink-0 z-10 sticky top-0">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-white tracking-wide">
              {currentView === 'overview' ? 'Overview Dashboard' :
                currentView === 'devices' ? 'Device Management' : 'Inventory Management'}
            </h1>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5 transition-colors ${scanComplete ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-primary/10 text-primary border-primary/30'}`}>
              {!scanComplete && <Loader2 size={10} className="animate-spin" />}
              {scanComplete ? 'SYSTEM ONLINE' : 'SCANNING NETWORK...'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            {currentView !== 'inventory' && (
              <div className="relative group hidden sm:block">
                <Search className="text-secondary absolute left-2.5 top-2 transition-colors group-focus-within:text-primary" size={18} />
                <input
                  type="text"
                  placeholder="Search devices..."
                  className="pl-9 pr-4 py-1.5 text-sm bg-surface border border-border rounded-md w-64 focus:ring-1 focus:ring-primary focus:border-primary text-white placeholder-secondary transition-all shadow-sm outline-none"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div className="h-6 w-px bg-border mx-1 hidden sm:block"></div>
            <button className="relative p-2 text-secondary hover:text-white transition-colors">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.8)] animate-pulse"></span>
            </button>
            <button className="p-2 text-secondary hover:text-white transition-colors">
              <HelpCircle size={20} />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 z-0 custom-scrollbar relative">
          <div className="max-w-[1600px] mx-auto h-full flex flex-col">

            {currentView === 'overview' && (
              <>
                <DashboardOverview stats={stats} />

                <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
                  <div className="xl:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <span className="size-2 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse"></span>
                        Critical Supply Levels
                      </h2>
                      <span className="text-xs text-secondary flex items-center gap-1">
                        <Droplet size={12} />
                        Showing lowest 4
                      </span>
                    </div>

                    {isLoading && printers.length === 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                          <div key={i} className="h-64 bg-surface rounded-xl border border-border animate-pulse"></div>
                        ))}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {criticalInkPrinters.map((printer) => (
                          <PrinterCard key={printer.ip} printer={printer} />
                        ))}
                        {criticalInkPrinters.length === 0 && (
                          <div className="col-span-full py-12 text-center text-secondary border border-dashed border-border rounded-xl">
                            No critical printers match your search.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="xl:col-span-1 flex flex-col gap-6">
                    <div className="h-96 xl:h-auto xl:min-h-[400px] xl:sticky xl:top-0">
                      <ConsumptionChart />
                    </div>
                  </div>
                </div>
              </>
            )}

            {currentView === 'devices' && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-surface rounded-lg border border-border text-secondary">
                      <LayoutGrid size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white tracking-tight">All Devices</h2>
                      <p className="text-xs text-secondary">Manage and monitor your entire fleet</p>
                    </div>
                  </div>
                  <div className="text-sm font-mono text-secondary">
                    Showing <span className="text-white font-bold">{allFilteredPrinters.length}</span> devices
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-8">
                  {allFilteredPrinters.map((printer) => (
                    <PrinterCard key={printer.ip} printer={printer} />
                  ))}
                  {allFilteredPrinters.length === 0 && (
                    <div className="col-span-full py-20 text-center text-secondary border border-dashed border-border rounded-xl bg-surface/30">
                      No devices found matching "{searchTerm}"
                    </div>
                  )}
                </div>
              </>
            )}

            {currentView === 'inventory' && (
              <InventoryView printers={printers} />
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;