import { Printer } from '../types';

/**
 * Parses the raw HTML string from a Toshiba e-STUDIO "Device.html" page
 * and extracts printer status, ink levels, and alerts.
 */
export const parseToshibaDevicePage = (html: string, baseIp: string): Partial<Printer> => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Helper to safely get text content
  const getText = (id: string) => doc.getElementById(id)?.textContent?.trim() || '';

  // Extract Basic Info
  const model = getText('DeviceCopierModel');
  const name = getText('DeviceName');
  const location = getText('DeviceLocation');
  
  // Extract Alerts
  // Toshiba alerts are often in a td with id 'devicealert_id'
  const alerts: string[] = [];
  const alertNode = doc.getElementById('devicealert_id');
  if (alertNode) {
    const alertText = alertNode.textContent?.trim() || '';
    // Remove the bullet point if present
    const cleanAlert = alertText.replace(/^•\s*/, '').trim();
    if (cleanAlert && cleanAlert !== 'None' && !cleanAlert.includes('No notification')) {
      alerts.push(cleanAlert);
    }
  }

  // Extract Ink Levels
  // Note: ID casing is inconsistent in Toshiba HTML (e.g., YellowToner vs Magentatoner)
  const getInkLevel = (id: string, colorLabel: string): string | null => {
    const valStr = getText(id); // e.g., "99"
    if (!valStr) return null;
    return `${colorLabel}: ${valStr}%`;
  };

  const inkLevels = [
    getInkLevel('YellowToner', 'Yellow'),
    getInkLevel('Magentatoner', 'Magenta'),
    getInkLevel('Cyantoner', 'Cyan'),
    getInkLevel('Blacktoner', 'Black') // Sometimes 'Blacktoner' or 'BlackToner'
  ].filter(Boolean) as string[];

  // Determine Status based on alerts
  let status: 'online' | 'warning' | 'offline' = 'online';
  if (alerts.length > 0) {
    status = 'warning';
  }

  return {
    name: name || `Toshiba ${baseIp}`,
    model: model || 'Toshiba Device',
    location,
    ip: baseIp,
    url: `http://${baseIp}`,
    status,
    inkLevels,
    alerts,
    lastUpdated: new Date().toISOString()
  };
};