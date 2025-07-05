// COPILOT FIX CSV-UTIL
import * as XLSX from 'xlsx';

export interface ProspectRow {
  id: string;
  name: string;
  title?: string;
  jobTitle?: string; // Handle both title and jobTitle for flexibility
  company: string;
  matchPct?: number;
  confidence?: number; // Handle both matchPct and confidence for flexibility
  email?: string;
  phone?: string;
  linkedInUrl?: string;
}

/**
 * Exports an array of prospect rows to a CSV file
 * @param rows Array of prospect data to export
 */
export function exportRowsToCsv(rows: ProspectRow[]): void {
  // Map the rows to a consistent format for the CSV file
  const data = rows.map(r => ({
    Name: r.name,
    'Job Title': r.title || r.jobTitle || '',
    Company: r.company,
    Match: r.matchPct ? `${r.matchPct}%` : r.confidence ? `${r.confidence}%` : '',
    Email: r.email || '',
    Phone: r.phone || '',
    LinkedIn: r.linkedInUrl || ''
  }));

  // Convert the data to a worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Convert worksheet to CSV
  const csv = XLSX.utils.sheet_to_csv(ws);

  // Create a blob and trigger download
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prospects_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
