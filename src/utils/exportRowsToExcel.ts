// COPILOT FIX XLSX-UTIL
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
 * Exports an array of prospect rows to an Excel file
 * @param rows Array of prospect data to export
 */
export function exportRowsToExcel(rows: ProspectRow[]): void {
  // Map the rows to a consistent format for the Excel sheet
  const data = rows.map(r => ({
    Name: r.name,
    'Job Title': r.title || r.jobTitle || '',
    Company: r.company,
    Match: r.matchPct ? `${r.matchPct}%` : r.confidence ? `${r.confidence}%` : '',
    Email: r.email || '',
    Phone: r.phone || '',
    LinkedIn: r.linkedInUrl || ''
  }));

  // Create a new workbook
  const wb = XLSX.utils.book_new();
  
  // Convert the data to a worksheet
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Add the worksheet to the workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Prospects');

  // Generate blob and trigger download
  const blob = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  const url = URL.createObjectURL(new Blob([blob]));
  const a = document.createElement('a');
  a.href = url;
  a.download = `prospects_${new Date().toISOString().slice(0, 10)}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}
