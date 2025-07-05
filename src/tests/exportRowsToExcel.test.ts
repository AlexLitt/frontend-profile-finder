// COPILOT FIX XLSX-UTIL: Unit test for exportRowsToExcel utility
import * as XLSX from 'xlsx';
import { exportRowsToExcel, ProspectRow } from '../utils/exportRowsToExcel';

// Mock the XLSX library
jest.mock('xlsx', () => ({
  utils: {
    book_new: jest.fn(() => ({})),
    json_to_sheet: jest.fn((data) => ({ data })),
    book_append_sheet: jest.fn(),
  },
  write: jest.fn(() => new Uint8Array([1, 2, 3])),
}));

// Mock URL and document APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();
const mockAnchorElement = {
  href: '',
  download: '',
  click: jest.fn(),
};
document.createElement = jest.fn(() => mockAnchorElement as any);

describe('exportRowsToExcel', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('should process data correctly and trigger a download', () => {
    // Sample prospect data
    const mockProspects: ProspectRow[] = [
      {
        id: '1',
        name: 'John Doe',
        jobTitle: 'Software Engineer',
        company: 'Tech Corp',
        confidence: 95,
        email: 'john@example.com',
        phone: '123-456-7890',
        linkedInUrl: 'https://linkedin.com/in/johndoe'
      },
      {
        id: '2',
        name: 'Jane Smith',
        title: 'Product Manager', // Test the title field instead of jobTitle
        company: 'Product Inc',
        matchPct: 85, // Test the matchPct field instead of confidence
        email: 'jane@example.com'
      }
    ];

    // Execute the export function
    exportRowsToExcel(mockProspects);

    // Check if XLSX.utils.book_new was called to create a new workbook
    expect(XLSX.utils.book_new).toHaveBeenCalled();

    // Check if XLSX.utils.json_to_sheet was called with the correct data
    const expectedSheetData = [
      {
        Name: 'John Doe',
        'Job Title': 'Software Engineer',
        Company: 'Tech Corp',
        Match: '95%',
        Email: 'john@example.com',
        Phone: '123-456-7890',
        LinkedIn: 'https://linkedin.com/in/johndoe'
      },
      {
        Name: 'Jane Smith',
        'Job Title': 'Product Manager',
        Company: 'Product Inc',
        Match: '85%',
        Email: 'jane@example.com',
        Phone: '',
        LinkedIn: ''
      }
    ];
    expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(expectedSheetData);

    // Check if book_append_sheet was called with the right sheet name
    expect(XLSX.utils.book_append_sheet).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'Prospects');

    // Check if XLSX.write was called with the correct options
    expect(XLSX.write).toHaveBeenCalledWith(expect.anything(), { type: 'array', bookType: 'xlsx' });

    // Check if URL.createObjectURL was called
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    // Check if anchor element was properly configured
    expect(mockAnchorElement.href).toBe('mock-url');
    expect(mockAnchorElement.download).toMatch(/^prospects_\d{4}-\d{2}-\d{2}\.xlsx$/);
    
    // Check if click was triggered to download the file
    expect(mockAnchorElement.click).toHaveBeenCalled();
    
    // Check if URL.revokeObjectURL was called to clean up
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });
});
