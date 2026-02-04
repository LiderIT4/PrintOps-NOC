export type ConnectionStatus = 'online' | 'offline' | 'warning';

export interface ParsedInkLevel {
  color: 'cyan' | 'magenta' | 'yellow' | 'black' | 'unknown';
  level: number;
  raw: string;
}

export interface Printer {
  name: string;
  url: string;
  model: string;
  ip: string;
  status: ConnectionStatus;
  inkLevels: string[]; // Raw strings from backend
  location?: string;   // Optional enrichment
  lastUpdated?: string; // ISO Timestamp
}

export interface DashboardStats {
  total: number;
  online: number;
  warnings: number;
  critical: number;
}

export interface InventoryItem {
  id: string;
  name: string; // Often combined Brand + Reference
  type: string; // e.g., "Toner", "Ink Bottle", "Developer"
  model: string; // The reference code (e.g., "TN216K")
  color: 'cyan' | 'magenta' | 'yellow' | 'black' | 'unknown';
  quantity: number;
  minStock: number; // min_required from JSON
  compatiblePrinters: string[]; // List of compatible printer models
  image?: string;
  location?: string; // Where this specific stock is kept or intended for
}

export interface InventoryLog {
  id: string;
  itemId: string;
  itemName: string;
  action: 'restock' | 'usage'; // usage = installed in printer
  quantityChange: number;
  targetPrinter?: string; // Name of the printer where it was installed
  description?: string; // Custom description if printer not in list
  timestamp: string;
}