import { Printer } from '../types';

const RAW_DATA: Record<string, any> = {
  "Pastor": {
    "timestamp": "2025-12-16T17:34:17.884Z",
    "name": "Pastor",
    "ip": "172.16.11.231",
    "status": "online",
    "inkLevels": [
      "Yellow Cartridge Estimated Ink Level is 90%",
      "Magenta Cartridge Estimated Ink Level is 60%",
      "Cyan Cartridge Estimated Ink Level is 70%",
      "Black Cartridge Estimated Ink Level is 80%"
    ]
  },
  "SPP": {
    "timestamp": "2025-12-16T17:35:14.407Z",
    "name": "SPP",
    "ip": "172.16.111.2",
    "status": "online",
    "inkLevels": [
      "Yellow Cartridge Estimated Ink Level is 80%",
      "Magenta Cartridge Estimated Ink Level is 40%",
      "Cyan Cartridge Estimated Ink Level is 20%",
      "Black Cartridge Estimated Ink Level is 90%"
    ]
  },
  "Financiera": {
    "timestamp": "2025-12-16T17:34:18.679Z",
    "name": "Financiera",
    "ip": "172.16.11.41",
    "status": "online",
    "inkLevels": [
      "Yellow Cartridge Estimated Ink Level is 20%",
      "Magenta Cartridge Estimated Ink Level is 60%",
      "Cyan Cartridge Estimated Ink Level is 20%",
      "Black Cartridge Estimated Ink Level is 20%"
    ]
  },
  "Mantenimiento": {
    "timestamp": "2025-12-16T17:33:56.761Z",
    "name": "Mantenimiento",
    "ip": "172.16.111.110",
    "status": "online",
    "inkLevels": [
      "Yellow Cartridge Estimated Ink Level is 70%",
      "Magenta Cartridge Estimated Ink Level is 50%",
      "Cyan Cartridge Estimated Ink Level is 70%",
      "Black Cartridge Estimated Ink Level is 20%"
    ]
  },
  "Cooperativa": {
    "timestamp": "2025-12-16T17:35:24.148Z",
    "name": "Cooperativa",
    "ip": "172.16.11.172",
    "status": "online",
    "inkLevels": [
      "Yellow Cartridge Estimated Ink Level is 20%",
      "Magenta Cartridge Estimated Ink Level is 80%",
      "Cyan Cartridge Estimated Ink Level is 90%",
      "Black Cartridge Estimated Ink Level is 80%"
    ]
  },
  "Radio": {
    "timestamp": "2026-02-04T20:30:30.292Z",
    "name": "Radio",
    "ip": "172.16.117.127",
    "status": "online",
    "inkLevels": [
      "color: 60%",
      "black: 20%"
    ]
  },
  "Eventos Gerizim": {
    "timestamp": "2026-02-04T20:31:20.650Z",
    "name": "Eventos Gerizim",
    "ip": "172.16.111.127",
    "status": "online",
    "inkLevels": [
      "color: 40%",
      "black: 20%"
    ]
  },
  "Estudio Grabación": {
    "timestamp": "2026-02-04T20:32:39.817Z",
    "name": "Estudio Grabación",
    "ip": "172.16.17.40",
    "status": "online",
    "inkLevels": [
      "black: 0%"
    ]
  },
  "Bodega Coffee": {
    "timestamp": "2025-12-03T17:56:47.533Z",
    "name": "Bodega Coffee",
    "ip": "172.16.113.14",
    "status": "online",
    "inkLevels": [
      "yellow: 100%",
      "magenta: 100%",
      "cyan: 100%",
      "black: 100%"
    ]
  },
  "Producción Piso 3": {
    "timestamp": "2025-12-16T17:34:07.921Z",
    "name": "Producción Piso 3",
    "ip": "172.16.17.5",
    "status": "online",
    "inkLevels": [
      "yellow: 37%",
      "magenta: 34%",
      "cyan: 44%",
      "black: 96%"
    ]
  },
  "Konica": {
    "timestamp": "2025-12-16T17:35:52.964Z",
    "name": "Konica",
    "ip": "172.16.17.45",
    "status": "online",
    "inkLevels": [
      "yellow: 86%",
      "magenta: 28%",
      "cyan: 36%",
      "black: 76%"
    ]
  },
  "Toshiba Administrativa": {
    "timestamp": "2025-12-16T17:36:14.998Z",
    "name": "Toshiba Administrativa",
    "ip": "172.16.11.48",
    "status": "online",
    "inkLevels": [
      "yellow: 13%",
      "magenta: 94%",
      "cyan: 90%",
      "black: 64%"
    ]
  },
  "Toshiba Piso 5": {
    "timestamp": "2025-12-16T17:36:35.927Z",
    "name": "Toshiba Piso 5",
    "ip": "172.16.11.215",
    "status": "online",
    "inkLevels": [
      "yellow: 89%",
      "magenta: 64%",
      "cyan: 88%",
      "black: 52%"
    ]
  },
  "Cocina piso 7": {
    "timestamp": "2025-12-16T17:35:38.383Z",
    "name": "Cocina piso 7",
    "ip": "172.16.111.59",
    "status": "online",
    "inkLevels": [
      "yellow: 100%",
      "magenta: 100%",
      "cyan: 100%",
      "black: 100%"
    ]
  },
  "Factura Electrónica": {
    "timestamp": "2025-11-26T19:37:26.620Z",
    "name": "Factura Electrónica",
    "ip": "172.16.111.25",
    "status": "online",
    "inkLevels": [
      "color: 40%",
      "black: 60%"
    ]
  },
  "Toshiba Piso 6": {
    "timestamp": "2025-12-16T21:08:38.614Z",
    "name": "Toshiba Piso 6",
    "ip": "172.16.11.169",
    "status": "online",
    "inkLevels": [
      "yellow: 94%",
      "magenta: 88%",
      "cyan: 86%",
      "black: 77%"
    ]
  }
};

// Convert Dictionary to Array and map to Printer Type
const MOCK_PRINTERS: Printer[] = Object.values(RAW_DATA).map((p: any) => ({
  name: p.name,
  ip: p.ip,
  url: `http://${p.ip}`, // Inferred
  status: p.status,
  inkLevels: p.inkLevels,
  lastUpdated: p.timestamp,
  // Inference for missing fields based on name/ip for UI completeness
  model: p.name.toLowerCase().includes('toshiba') ? 'Toshiba e-Studio' : 
         p.name.toLowerCase().includes('konica') ? 'Konica Minolta' : 'HP LaserJet',
  location: p.name // Default to name if no location provided
}));

export const subscribeToPrinterStatus = (
  onUpdate: (printer: Printer) => void, 
  onComplete: () => void
) => {
  let currentIndex = 0;
  
  // Faster interval to load this specific dataset quickly
  const interval = setInterval(() => {
    if (currentIndex >= MOCK_PRINTERS.length) {
      clearInterval(interval);
      onComplete();
      return;
    }
    
    onUpdate(MOCK_PRINTERS[currentIndex]);
    currentIndex++;
  }, 150); // 150ms per printer for effect

  return () => clearInterval(interval);
};