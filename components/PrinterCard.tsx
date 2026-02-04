import React, { useMemo } from 'react';
import { Printer } from '../types';
import { parseInkString, formatDate } from '../utils/helpers';
import InkBar from './InkBar';
import { Printer as PrinterIcon, Wifi, WifiOff, AlertTriangle, Clock, MoreHorizontal } from 'lucide-react';

interface PrinterCardProps {
  printer: Printer;
}

const PrinterCard: React.FC<PrinterCardProps> = ({ printer }) => {
  const parsedInks = useMemo(() => {
    return printer.inkLevels.map(parseInkString).sort((a, b) => {
      // Sort order: C, M, Y, K, Unknown (Color/Tricolor)
      const order = { cyan: 0, magenta: 1, yellow: 2, black: 3, unknown: 4 };
      return order[a.color] - order[b.color];
    });
  }, [printer.inkLevels]);

  const isLowInk = parsedInks.some(ink => ink.level < 15);
  
  let statusColor = 'bg-emerald-500';
  let StatusIcon = Wifi;
  let statusText = 'Online';

  if (printer.status === 'offline') {
    statusColor = 'bg-red-500';
    StatusIcon = WifiOff;
    statusText = 'Offline';
  } else if (printer.status === 'warning' || isLowInk) {
    statusColor = 'bg-amber-500';
    StatusIcon = AlertTriangle;
    statusText = isLowInk ? 'Low Supply' : 'Warning';
  }

  return (
    <div className={`bg-surface border border-border rounded-xl shadow-lg transition-all duration-300 hover:border-opacity-50 group flex flex-col h-full ${
      printer.status === 'offline' ? 'opacity-70 grayscale-[0.5]' : 'hover:border-primary/50'
    }`}>
      {/* Header */}
      <div className="p-5 flex items-start gap-4 border-b border-border">
        <div className="relative size-12 rounded-lg bg-background p-2 shrink-0 flex items-center justify-center border border-border">
           <PrinterIcon className="text-slate-400" size={24} />
           <div className={`absolute -top-1 -right-1 size-2.5 rounded-full ${statusColor} ring-2 ring-surface ${printer.status === 'online' ? 'animate-pulse' : ''}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h3 className="font-bold text-white text-sm tracking-tight truncate pr-2" title={printer.name}>
              {printer.name}
            </h3>
            <button className="text-secondary hover:text-white transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
          
          <div className="mt-1 flex flex-col gap-0.5">
            <a href={`http://${printer.ip}`} target="_blank" rel="noopener noreferrer" className="text-[11px] text-primary hover:text-primary/80 hover:underline font-mono truncate">
              {printer.ip}
            </a>
            {printer.lastUpdated && (
              <span className="text-[10px] text-secondary flex items-center gap-1">
                <Clock size={10} /> {formatDate(printer.lastUpdated)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex-1 flex flex-col">
        {parsedInks.length > 0 ? (
          <div className="space-y-2 mt-auto">
            {parsedInks.map((ink, idx) => (
              <InkBar key={idx} parsedInk={ink} />
            ))}
          </div>
        ) : (
          <div className="h-full min-h-[80px] flex flex-col items-center justify-center text-secondary bg-background/50 rounded-lg border border-dashed border-border">
            <span className="text-xs italic">Levels unavailable</span>
          </div>
        )}
      </div>
      
      {/* Footer Status Line */}
      <div className={`h-1 w-full rounded-b-xl ${
         printer.status === 'offline' ? 'bg-red-500/20' : 
         isLowInk ? 'bg-amber-500/20' : 'bg-emerald-500/20'
      }`}></div>
    </div>
  );
};

export default PrinterCard;