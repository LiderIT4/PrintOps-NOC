import { ParsedInkLevel } from '../types';

export const parseInkString = (inkString: string): ParsedInkLevel => {
  const lowerStr = inkString.toLowerCase();
  
  // Detect color
  let normalizedColor: ParsedInkLevel['color'] = 'unknown';
  if (lowerStr.includes('cyan') || lowerStr.includes('cian')) normalizedColor = 'cyan';
  else if (lowerStr.includes('magenta')) normalizedColor = 'magenta';
  else if (lowerStr.includes('yellow') || lowerStr.includes('amarillo')) normalizedColor = 'yellow';
  else if (lowerStr.includes('black') || lowerStr.includes('negro')) normalizedColor = 'black';
  else if (lowerStr.includes('color')) normalizedColor = 'cyan'; // Fallback for generic 'color' cartridges to a visible color, or handle separately

  // Detect level using Regex to find the number followed optionally by %
  // Matches "90%", "90", "is 90%"
  const match = lowerStr.match(/(\d+)%/);
  let level = 0;
  
  if (match && match[1]) {
    level = parseInt(match[1], 10);
  } else {
    // Fallback try to find just a number if % is missing but unlikely in this dataset
    const numberMatch = lowerStr.match(/(\d+)/);
    if (numberMatch) level = parseInt(numberMatch[0], 10);
  }

  // Handle special case for 'color' generic cartridge usually found in simpler HPs
  // We might want to render it differently, but for now mapping to unknown or a composite
  if (lowerStr.startsWith('color:') || lowerStr.includes('color cartridge')) {
     // If we want to display it specifically, we might need a 'tricolor' type, 
     // but 'unknown' with a specific renderer or mapping it to 'cyan' for visual pop is a temporary fix.
     // Let's keep it 'unknown' but ensure the UI renders it.
     if (normalizedColor === 'unknown') normalizedColor = 'unknown'; 
  }

  return {
    color: normalizedColor,
    level,
    raw: inkString
  };
};

export const getInkColorClass = (color: string): string => {
  switch (color) {
    case 'cyan': return 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.4)]';
    case 'magenta': return 'bg-fuchsia-400 shadow-[0_0_10px_rgba(232,121,249,0.4)]';
    case 'yellow': return 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.4)]';
    case 'black': return 'bg-slate-200';
    case 'unknown': return 'bg-gradient-to-r from-cyan-400 via-fuchsia-400 to-yellow-400'; // Tricolor representation
    default: return 'bg-gray-400';
  }
};

export const formatDate = (isoString?: string) => {
  if (!isoString) return '';
  const date = new Date(isoString);
  return new Intl.DateTimeFormat('es-ES', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date);
};