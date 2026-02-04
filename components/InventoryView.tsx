import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, InventoryLog, Printer } from '../types';
import { getInventory, updateStock, getLogs } from '../services/inventoryService';
import { Package, Plus, Minus, Search, History, Save, X, Printer as PrinterIcon, PenTool, AlertCircle, Tag, MapPin, Download, ChevronRight } from 'lucide-react';
import { getInkColorClass, formatDate } from '../utils/helpers';

interface InventoryViewProps {
  printers: Printer[];
}

const InventoryView: React.FC<InventoryViewProps> = ({ printers }) => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogs, setShowLogs] = useState(false);
  
  // Modal State
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [modalMode, setModalMode] = useState<'restock' | 'usage' | null>(null);
  
  // Form State
  const [quantityInput, setQuantityInput] = useState(1);
  const [targetType, setTargetType] = useState<'printer' | 'manual'>('printer');
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [manualDescription, setManualDescription] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const data = await getInventory();
    setItems(data);
    const logData = await getLogs();
    setLogs(logData);
  };

  const handleOpenModal = (item: InventoryItem, mode: 'restock' | 'usage') => {
    setSelectedItem(item);
    setModalMode(mode);
    setQuantityInput(1);
    setTargetType('printer');
    setSelectedPrinter('');
    setManualDescription('');
  };

  const handleCloseModal = () => {
    setSelectedItem(null);
    setModalMode(null);
  };

  const handleSubmit = async () => {
    if (!selectedItem || !modalMode) return;

    const change = modalMode === 'restock' ? quantityInput : -quantityInput;
    
    if (modalMode === 'usage') {
      if (targetType === 'printer' && !selectedPrinter) {
        alert("Please select a printer");
        return;
      }
      if (targetType === 'manual' && !manualDescription) {
        alert("Please enter a description");
        return;
      }
    }

    const details = modalMode === 'usage' ? {
      targetPrinter: targetType === 'printer' ? selectedPrinter : undefined,
      description: targetType === 'manual' ? manualDescription : undefined
    } : undefined;

    const result = await updateStock(selectedItem.id, change, modalMode, details);
    
    if (result.success) {
      loadData();
      handleCloseModal();
    } else {
      alert("Error updating stock");
    }
  };

  const handleExportCSV = () => {
    if (items.length === 0) {
      alert("No inventory data to export");
      return;
    }

    // Define Headers for Stock Report
    const headers = ["Printer Model", "Supply Type", "Reference", "Color", "Current Stock", "Min Required", "Location"];
    
    const csvRows = items.map(item => {
      const escape = (str: string | undefined) => {
        const val = str || '';
        return '"' + val.replace(/"/g, '""') + '"';
      };

      return [
        escape(item.compatiblePrinters.join('; ')),
        escape(item.type),
        escape(item.model),
        escape(item.color.toUpperCase()),
        item.quantity,
        item.minStock,
        escape(item.location)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...csvRows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `inventory_stock_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Group items by Printer Model
  const groupedItems = useMemo(() => {
    const filtered = items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.compatiblePrinters.some(cp => cp.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const groups: Record<string, InventoryItem[]> = {};

    filtered.forEach(item => {
      // Use the first compatible printer as the group key, or "Universal"
      const key = item.compatiblePrinters[0] || "Universal / Others";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });

    // Sort items within groups by color (CMYK)
    const colorOrder = { black: 0, cyan: 1, magenta: 2, yellow: 3, unknown: 4 };
    
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => {
        return (colorOrder[a.color] || 5) - (colorOrder[b.color] || 5);
      });
    });

    // Sort groups alphabetically
    return Object.keys(groups).sort().reduce((acc, key) => {
      acc[key] = groups[key];
      return acc;
    }, {} as Record<string, InventoryItem[]>);

  }, [items, searchTerm]);

  // Helper for border colors
  const getBorderColorClass = (color: string) => {
     switch (color) {
       case 'cyan': return 'border-l-cyan-400';
       case 'magenta': return 'border-l-fuchsia-400';
       case 'yellow': return 'border-l-yellow-400';
       case 'black': return 'border-l-slate-200';
       default: return 'border-l-slate-500';
     }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-surface rounded-lg border border-border text-primary">
            <Package size={20} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Supply Inventory</h2>
            <p className="text-xs text-secondary">Manage stock by printer model</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="text-secondary absolute left-2.5 top-2 transition-colors group-focus-within:text-primary" size={16} />
            <input 
              type="text" 
              placeholder="Search ref or printer..." 
              className="pl-9 pr-4 py-1.5 text-sm bg-surface border border-border rounded-md w-64 focus:ring-1 focus:ring-primary focus:border-primary text-white placeholder-secondary transition-all shadow-sm outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <button 
            onClick={handleExportCSV}
            className="p-2 rounded-md border bg-surface border-border text-secondary hover:text-white hover:border-emerald-500 hover:bg-emerald-500/10 transition-colors"
            title="Export Current Stock Report (CSV)"
          >
            <Download size={20} />
          </button>

          <button 
            onClick={() => setShowLogs(!showLogs)}
            className={`p-2 rounded-md border transition-colors ${showLogs ? 'bg-primary/20 border-primary text-white' : 'bg-surface border-border text-secondary hover:text-white'}`}
            title="View History JSON"
          >
            <History size={20} />
          </button>
        </div>
      </div>

      <div className="flex flex-1 gap-6 min-h-0 overflow-hidden">
        {/* Inventory Grouped List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 pb-10">
          
          {Object.keys(groupedItems).length === 0 && (
             <div className="text-center py-20 border border-dashed border-border rounded-xl">
               <span className="text-secondary">No inventory items found matching your search.</span>
             </div>
          )}

          <div className="space-y-6">
            {Object.entries(groupedItems).map(([printerName, groupItems]) => (
              <div key={printerName} className="bg-surface/50 border border-border rounded-xl overflow-hidden shadow-sm">
                {/* Group Header */}
                <div className="bg-surface px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 z-10">
                   <div className="flex items-center gap-2">
                     <div className="p-1.5 bg-background rounded border border-border text-secondary">
                        <PrinterIcon size={14} />
                     </div>
                     <h3 className="font-bold text-white text-sm">{printerName}</h3>
                     <span className="text-[10px] bg-white/5 px-2 py-0.5 rounded text-secondary">{groupItems.length} items</span>
                   </div>
                </div>

                {/* Items List */}
                <div className="divide-y divide-border/50">
                  {groupItems.map(item => {
                    const isLowStock = item.quantity <= item.minStock;
                    const stockStatusColor = item.quantity === 0 ? 'text-red-500 bg-red-500/10' : isLowStock ? 'text-amber-500 bg-amber-500/10' : 'text-emerald-500 bg-emerald-500/10';

                    return (
                      <div key={item.id} className={`group flex items-center gap-4 p-3 hover:bg-white/5 transition-colors border-l-4 ${getBorderColorClass(item.color)} bg-background/30`}>
                        
                        {/* Reference & Type & Color Swatch */}
                        <div className="w-56 shrink-0 flex items-start gap-3">
                           {/* Color Swatch */}
                           <div className={`mt-0.5 size-9 rounded-md shrink-0 border border-white/10 shadow-sm ${getInkColorClass(item.color)} flex items-center justify-center`}>
                              {item.color === 'unknown' && <span className="text-[10px] font-bold text-black/40">TRI</span>}
                           </div>
                           
                           <div className="min-w-0">
                             <div className="flex items-center gap-2 font-mono font-bold text-sm text-white truncate">
                               {item.model}
                             </div>
                             <div className="text-[11px] text-secondary truncate mb-0.5">{item.type}</div>
                             <div className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-white/5 text-slate-400 capitalize border border-white/5">
                               {item.color}
                             </div>
                           </div>
                        </div>

                        {/* Location */}
                        <div className="flex-1 min-w-0 flex items-center gap-2">
                           <MapPin size={12} className="text-slate-600 shrink-0" />
                           <span className="text-xs text-slate-400 truncate" title={item.location}>{item.location}</span>
                        </div>

                        {/* Stock Level */}
                        <div className="w-32 flex flex-col items-center justify-center shrink-0">
                           <div className={`px-2 py-0.5 rounded text-xs font-bold font-mono border border-transparent ${stockStatusColor} ${isLowStock ? 'border-amber-500/20 animate-pulse' : ''}`}>
                             {item.quantity} / {item.minStock}
                           </div>
                           <span className="text-[9px] text-secondary uppercase tracking-wider mt-0.5">Available</span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => handleOpenModal(item, 'usage')}
                             disabled={item.quantity === 0}
                             className="p-1.5 rounded-md hover:bg-red-500/20 text-secondary hover:text-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                             title="Register Usage"
                           >
                             <Minus size={16} />
                           </button>
                           <button 
                             onClick={() => handleOpenModal(item, 'restock')}
                             className="p-1.5 rounded-md hover:bg-emerald-500/20 text-secondary hover:text-emerald-400 transition-colors"
                             title="Add Stock"
                           >
                             <Plus size={16} />
                           </button>
                        </div>

                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Logs Panel */}
        {showLogs && (
          <div className="w-80 bg-surface border-l border-border flex flex-col shrink-0 animate-in slide-in-from-right duration-300">
            <div className="p-4 border-b border-border bg-background/50">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History size={16} /> Transaction Log (JSON)
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-4">
                {logs.map((log) => (
                  <div key={log.id} className="text-xs font-mono bg-background p-3 rounded border border-border/50">
                    <div className="flex justify-between text-secondary mb-1">
                      <span>{log.action === 'restock' ? '📥 RESTOCK' : '📤 INSTALLED'}</span>
                      <span>{formatDate(log.timestamp)}</span>
                    </div>
                    <div className="text-white font-bold mb-1">{log.itemName}</div>
                    <div className="text-secondary">
                      Qty: <span className={log.quantityChange > 0 ? 'text-emerald-400' : 'text-red-400'}>{log.quantityChange > 0 ? '+' : ''}{log.quantityChange}</span>
                    </div>
                    {log.targetPrinter && (
                      <div className="mt-2 pt-2 border-t border-border/50 text-blue-300 truncate">
                        Loc: {log.targetPrinter}
                      </div>
                    )}
                  </div>
                ))}
                {logs.length === 0 && <div className="text-center text-secondary py-10">No history yet</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {selectedItem && modalMode && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-border flex justify-between items-center bg-background/50">
              <h3 className="font-bold text-white">
                {modalMode === 'restock' ? 'Restock Supply' : 'Install Cartridge'}
              </h3>
              <button onClick={handleCloseModal} className="text-secondary hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                 <div className={`size-12 rounded-lg ${getInkColorClass(selectedItem.color)} flex items-center justify-center shadow-lg`}>
                    <Package className="text-black/50" />
                 </div>
                 <div>
                   <div className="text-white font-bold">{selectedItem.model}</div>
                   <div className="text-sm text-secondary">{selectedItem.compatiblePrinters[0]}</div>
                   <div className="text-xs text-secondary mt-1 bg-white/5 inline-block px-1 rounded">Current: {selectedItem.quantity}</div>
                 </div>
              </div>

              {/* Quantity Input */}
              <div className="mb-6">
                <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2">
                  Quantity to {modalMode === 'restock' ? 'Add' : 'Remove'}
                </label>
                <div className="flex items-center gap-3">
                  <button onClick={() => setQuantityInput(Math.max(1, quantityInput - 1))} className="p-2 bg-background border border-border rounded hover:border-primary text-white"><Minus size={16} /></button>
                  <input 
                    type="number" 
                    value={quantityInput} 
                    onChange={(e) => setQuantityInput(parseInt(e.target.value) || 1)}
                    className="w-full bg-background border border-border rounded p-2 text-center text-white font-mono"
                  />
                  <button onClick={() => setQuantityInput(quantityInput + 1)} className="p-2 bg-background border border-border rounded hover:border-primary text-white"><Plus size={16} /></button>
                </div>
              </div>

              {/* Install Details (Only for Usage) */}
              {modalMode === 'usage' && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                   <div className="flex bg-background rounded-lg p-1 border border-border">
                      <button 
                        onClick={() => setTargetType('printer')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${targetType === 'printer' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                      >
                        <PrinterIcon size={14} /> Registered Printer
                      </button>
                      <button 
                        onClick={() => setTargetType('manual')}
                        className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${targetType === 'manual' ? 'bg-primary text-white shadow-sm' : 'text-secondary hover:text-white'}`}
                      >
                        <PenTool size={14} /> Manual / Other
                      </button>
                   </div>

                   {targetType === 'printer' ? (
                     <div>
                       <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2">Select Printer</label>
                       <select 
                          className="w-full bg-background border border-border rounded p-2 text-white text-sm outline-none focus:border-primary"
                          value={selectedPrinter}
                          onChange={(e) => setSelectedPrinter(e.target.value)}
                       >
                          <option value="">-- Select a device --</option>
                          {printers.map(p => (
                            <option key={p.ip} value={p.name}>{p.name} ({p.ip})</option>
                          ))}
                       </select>
                     </div>
                   ) : (
                     <div>
                       <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-2">Description / Location</label>
                       <textarea 
                          className="w-full bg-background border border-border rounded p-2 text-white text-sm outline-none focus:border-primary resize-none h-20"
                          placeholder="e.g. Old printer in storage room..."
                          value={manualDescription}
                          onChange={(e) => setManualDescription(e.target.value)}
                       />
                     </div>
                   )}
                </div>
              )}
            </div>

            <div className="p-4 bg-background/50 border-t border-border flex justify-end gap-3">
              <button onClick={handleCloseModal} className="px-4 py-2 text-sm text-secondary hover:text-white transition-colors">Cancel</button>
              <button 
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-lg text-sm font-bold text-white flex items-center gap-2 ${modalMode === 'restock' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-primary hover:bg-indigo-500'}`}
              >
                <Save size={16} /> Confirm {modalMode === 'restock' ? 'Stock' : 'Usage'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryView;