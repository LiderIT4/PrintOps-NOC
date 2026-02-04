import React from 'react';
import { ParsedInkLevel } from '../types';
import { getInkColorClass } from '../utils/helpers';

interface InkBarProps {
  parsedInk: ParsedInkLevel;
}

const InkBar: React.FC<InkBarProps> = ({ parsedInk }) => {
  const colorClass = getInkColorClass(parsedInk.color);
  
  // Format label (C, M, Y, K, Tri)
  let label = '';
  let textColor = 'text-slate-300';

  switch (parsedInk.color) {
    case 'black': label = 'K'; break;
    case 'cyan': label = 'C'; textColor = 'text-cyan-400'; break;
    case 'magenta': label = 'M'; textColor = 'text-fuchsia-400'; break;
    case 'yellow': label = 'Y'; textColor = 'text-yellow-400'; break;
    case 'unknown': label = 'Tri'; textColor = 'text-white'; break; // Tricolor/Generic
  }

  return (
    <div className="flex items-center gap-2 text-[10px] mb-1.5">
      <span className={`w-4 font-bold ${textColor} text-right shrink-0`}>{label}</span>
      <div className="h-1.5 flex-1 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
        <div 
          className={`h-full ${colorClass} transition-all duration-1000 ease-out`} 
          style={{ width: `${parsedInk.level}%` }}
        />
      </div>
      <span className="w-7 text-right font-mono font-medium text-slate-400 shrink-0">
        {parsedInk.level}%
      </span>
    </div>
  );
};

export default InkBar;