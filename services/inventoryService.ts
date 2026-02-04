import { InventoryItem, InventoryLog } from '../types';

// New Raw Data provided (Spanish fields)
const RAW_INVENTORY_DATA = {
  "items": [
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Botella de tinta",
      "codigo": "GT753 / GT53XL",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Botella de tinta",
      "codigo": "G752",
      "color": "Cian",
      "cantidad_minima": 2,
      "cantidad_disponible": 4
    },
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Botella de tinta",
      "codigo": "G752",
      "color": "Amarillo",
      "cantidad_minima": 2,
      "cantidad_disponible": 5
    },
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Botella de tinta",
      "codigo": "G752",
      "color": "Magenta",
      "cantidad_minima": 2,
      "cantidad_disponible": 4
    },
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Cabezal de Impresión",
      "codigo": "GT M0H50A",
      "color": "Tricolor",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Bodega Coffee Castellana, Bodega Producción Teatro",
      "modelo_impresora": "HP Smart Tank 510 series",
      "tipo": "Cabezal de Impresión",
      "codigo": "GT M0H51A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "SPP Bodega despachos",
      "modelo_impresora": "HP LaserJet 1020",
      "tipo": "Toner",
      "codigo": "12A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Pastor Casa",
      "modelo_impresora": "HP LaserJet Pro M102w",
      "tipo": "Toner",
      "codigo": "17A CF217A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Ed. Administrativo 203 Cooperativa",
      "modelo_impresora": "HP LaserJet Pro M402n",
      "tipo": "Toner",
      "codigo": "26A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "MVNL",
      "modelo_impresora": "HP Impresora LaserJet M15w",
      "tipo": "Toner",
      "codigo": "48A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Parqueadero",
      "modelo_impresora": "HP LaserJet Pro M203dw",
      "tipo": "Toner",
      "codigo": "30A",
      "color": "Negro",
      "cantidad_minima": 1,
      "cantidad_disponible": 0
    },
    {
      "ubicacion": "Estudio Grabación piso 4 admin",
      "modelo_impresora": "HP LaserJet Professional M1212nf MFP",
      "tipo": "Toner",
      "codigo": "78A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Camerino Castellana Pastor / Bajos Exclusivos / Campestre",
      "modelo_impresora": "HP LaserJet P1102w",
      "tipo": "Toner",
      "codigo": "85A",
      "color": "Negro",
      "cantidad_minima": 5,
      "cantidad_disponible": 5
    },
    {
      "ubicacion": "Casa Fuente",
      "modelo_impresora": "Samsung ML1660",
      "tipo": "Toner",
      "codigo": "104S",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Producción 3 piso admin",
      "modelo_impresora": "HP Color LaserJet CP2025dn",
      "tipo": "Toner",
      "codigo": "304A",
      "color": "Magenta",
      "cantidad_minima": 1,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Producción 3 piso admin",
      "modelo_impresora": "HP Color LaserJet CP2025dn",
      "tipo": "Toner",
      "codigo": "304A",
      "color": "Cian",
      "cantidad_minima": 1,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Producción 3 piso admin",
      "modelo_impresora": "HP Color LaserJet CP2025dn",
      "tipo": "Toner",
      "codigo": "304A",
      "color": "Amarillo",
      "cantidad_minima": 1,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Producción 3 piso admin",
      "modelo_impresora": "HP Color LaserJet CP2025dn",
      "tipo": "Toner",
      "codigo": "304A",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Biblioteca Berea",
      "modelo_impresora": "HP LaserJet M281fdw",
      "tipo": "Toner",
      "codigo": "410X",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Biblioteca Berea",
      "modelo_impresora": "HP LaserJet M281fdw",
      "tipo": "Toner",
      "codigo": "410A",
      "color": "Cian",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Biblioteca Berea",
      "modelo_impresora": "HP LaserJet M281fdw",
      "tipo": "Toner",
      "codigo": "410A",
      "color": "Amarillo",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Biblioteca Berea",
      "modelo_impresora": "HP LaserJet M281fdw",
      "tipo": "Toner",
      "codigo": "410A",
      "color": "Magenta",
      "cantidad_minima": 2,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Financiera, Pastor, SPP, Carmelo, Cooperativa",
      "modelo_impresora": "HP PageWide Pro 477dw MFP",
      "tipo": "Cartucho",
      "codigo": "HP 974X",
      "color": "Negro",
      "cantidad_minima": 5,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Financiera, Pastor, SPP, Carmelo, Cooperativa",
      "modelo_impresora": "HP PageWide Pro 477dw MFP",
      "tipo": "Cartucho",
      "codigo": "HP 974X",
      "color": "Amarillo",
      "cantidad_minima": 5,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Financiera, Pastor, SPP, Carmelo, Cooperativa",
      "modelo_impresora": "HP PageWide Pro 477dw MFP",
      "tipo": "Cartucho",
      "codigo": "HP 974X",
      "color": "Magenta",
      "cantidad_minima": 5,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Financiera, Pastor, SPP, Carmelo, Cooperativa",
      "modelo_impresora": "HP PageWide Pro 477dw MFP",
      "tipo": "Cartucho",
      "codigo": "HP 974X",
      "color": "Cian",
      "cantidad_minima": 5,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "David Casallas, Camerino Nogal, Emisora, Gerizim",
      "modelo_impresora": "HP DeskJet Ink Advantage Ultra 4720",
      "tipo": "Cartucho",
      "codigo": "46 CZ637A",
      "color": "Negro",
      "cantidad_minima": 5,
      "cantidad_disponible": 4
    },
    {
      "ubicacion": "David Casallas, Bodega Coffee, Camerino Nogal, Radio, Gerizim",
      "modelo_impresora": "HP DeskJet Ink Advantage Ultra 4720",
      "tipo": "Cartucho",
      "codigo": "46 Color CZ638AL",
      "color": "Tricolor",
      "cantidad_minima": 5,
      "cantidad_disponible": 4
    },
    {
      "ubicacion": "Master Auditorio Fotógrafos",
      "modelo_impresora": "HP LaserJet P1606",
      "tipo": "Toner",
      "codigo": "CE278AC",
      "color": "Negro",
      "cantidad_minima": 1,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Developer Unit",
      "codigo": "DV311K",
      "color": "Negro",
      "cantidad_minima": 1,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Developer Unit",
      "codigo": "DV311M",
      "color": "Magenta",
      "cantidad_minima": 1,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Developer Unit",
      "codigo": "DV311C",
      "color": "Cian",
      "cantidad_minima": 1,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Developer Unit",
      "codigo": "DV311Y",
      "color": "Amarillo",
      "cantidad_minima": 1,
      "cantidad_disponible": 1
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Toner",
      "codigo": "TN216K",
      "color": "Negro",
      "cantidad_minima": 2,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Toner",
      "codigo": "TN216M",
      "color": "Magenta",
      "cantidad_minima": 2,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Toner",
      "codigo": "TN216C",
      "color": "Cian",
      "cantidad_minima": 1,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Inhouse",
      "modelo_impresora": "Konica Minolta bizhub C280",
      "tipo": "Toner",
      "codigo": "TN216Y",
      "color": "Amarillo",
      "cantidad_minima": 1,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Administrativa, Piso 5, Piso 6",
      "modelo_impresora": "TOSHIBA e-STUDIO2505AC",
      "tipo": "Toner",
      "codigo": "T-FC50UY",
      "color": "Amarillo",
      "cantidad_minima": 1,
      "cantidad_disponible": 2
    },
    {
      "ubicacion": "Administrativa",
      "modelo_impresora": "TOSHIBA e-STUDIO2505AC",
      "tipo": "Toner",
      "codigo": "T-FC50UM",
      "color": "Magenta",
      "cantidad_minima": 1,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Administrativa",
      "modelo_impresora": "TOSHIBA e-STUDIO2505AC",
      "tipo": "Toner",
      "codigo": "T-FC50UC",
      "color": "Cian",
      "cantidad_minima": 1,
      "cantidad_disponible": 3
    },
    {
      "ubicacion": "Administrativa",
      "modelo_impresora": "TOSHIBA e-STUDIO2505AC",
      "tipo": "Toner",
      "codigo": "T-FC50UK",
      "color": "Negro",
      "cantidad_minima": 1,
      "cantidad_disponible": 3
    }
  ]
};

// Transform Master JSON to Flat Inventory List
const transformDataToInventory = (): InventoryItem[] => {
  return RAW_INVENTORY_DATA.items.map(item => {
    // Map Spanish colors to English types for the App logic
    let color: InventoryItem['color'] = 'unknown';
    const c = item.color.toLowerCase();
    
    if (c.includes('negro')) color = 'black';
    else if (c.includes('cian')) color = 'cyan';
    else if (c.includes('magenta')) color = 'magenta';
    else if (c.includes('amarillo')) color = 'yellow';
    // 'Tricolor' remains 'unknown' to be handled as rainbow in helpers

    // Create a unique consistent ID based on immutable properties
    const id = `${item.modelo_impresora}-${item.codigo}-${item.color}`
      .replace(/[^a-z0-9]/gi, '-')
      .replace(/-+/g, '-')
      .toLowerCase();

    return {
      id: id,
      name: `${item.tipo} ${item.color} - ${item.modelo_impresora}`,
      type: item.tipo,
      model: item.codigo,
      color: color,
      quantity: item.cantidad_disponible,
      minStock: item.cantidad_minima,
      compatiblePrinters: [item.modelo_impresora],
      location: item.ubicacion
    };
  });
};

// Initialize State
let inventoryItems: InventoryItem[] = transformDataToInventory();
let inventoryLogs: InventoryLog[] = [];

export const getInventory = (): Promise<InventoryItem[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...inventoryItems]), 300);
  });
};

export const getLogs = (): Promise<InventoryLog[]> => {
  return new Promise((resolve) => {
    setTimeout(() => resolve([...inventoryLogs]), 300);
  });
};

export const updateStock = (
  itemId: string, 
  quantityChange: number, 
  action: 'restock' | 'usage',
  details?: { targetPrinter?: string; description?: string }
): Promise<{ success: boolean; item?: InventoryItem }> => {
  return new Promise((resolve) => {
    const itemIndex = inventoryItems.findIndex(i => i.id === itemId);
    if (itemIndex === -1) {
      resolve({ success: false });
      return;
    }

    const item = inventoryItems[itemIndex];
    const newQuantity = item.quantity + quantityChange;

    if (newQuantity < 0) {
      resolve({ success: false }); // Cannot have negative stock
      return;
    }

    // Update Item
    const updatedItem = { ...item, quantity: newQuantity };
    inventoryItems[itemIndex] = updatedItem;

    // Create Log Entry
    const newLog: InventoryLog = {
      id: Date.now().toString(),
      itemId: item.id,
      itemName: `${item.name} (${item.model})`,
      action,
      quantityChange,
      timestamp: new Date().toISOString(),
      targetPrinter: details?.targetPrinter,
      description: details?.description
    };
    
    // Add to logs (Newest first)
    inventoryLogs = [newLog, ...inventoryLogs];
    
    // Log JSON to console
    console.log("Updated Inventory Log JSON:", JSON.stringify(inventoryLogs, null, 2));

    resolve({ success: true, item: updatedItem });
  });
};