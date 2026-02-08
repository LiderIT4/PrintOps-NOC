import { Printer } from '../types';

// Fetches the full list of printers from the backend
export const fetchPrinters = async (): Promise<Printer[]> => {
  try {
    const response = await fetch('http://localhost:4000/api/printers');
    if (!response.ok) {
      throw new Error(`Error fetching printers: ${response.statusText}`);
    }
    const data = await response.json();
    console.log('Fetched printers:', data.printers);
    return data.printers.map((p: any) => ({
      ...p,
      url: `http://${p.ip}`,
      // Normalize ink levels for display if needed
      // ensuring model and location are set
      model: p.name.toLowerCase().includes('toshiba') ? 'Toshiba e-Studio' :
        p.name.toLowerCase().includes('konica') ? 'Konica Minolta' : 'HP LaserJet',
      location: p.name
    }));
  } catch (error) {
    console.error('Failed to fetch printers:', error);
    return [];
  }
};

export const subscribeToPrinterStatus = (
  onUpdate: (printer: Printer) => void,
  onComplete: () => void
) => {
  // Initial fetch
  fetchPrinters().then(printers => {
    printers.forEach(p => onUpdate(p));
    onComplete();
  });

  // Poll for updates every 30 seconds (or logic to listen to socket if we added that)
  const interval = setInterval(() => {
    fetchPrinters().then(printers => {
      printers.forEach(p => onUpdate(p));
    });
  }, 30000);

  return () => clearInterval(interval);
};