// COPILOT FIX CSV-UTIL: Unit test for exportRowsToCsv utility
import * as XLSX from 'xlsx';
import { exportRowsToCsv, ProspectRow } from '../utils/exportRowsToCsv';

// Mock the XLSX library
jest.mock('xlsx', () => ({
  utils: {
    json_to_sheet: jest.fn((data) => ({ data })),
    sheet_to_csv: jest.fn(() => 'Name,Job Title,Company,Match,Email,Phone,LinkedIn\nJohn Doe,Software Engineer,Tech Corp,95%,john@example.com,123-456-7890,https://linkedin.com/in/johndoe'),
  },
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

describe('exportRowsToCsv', () => {
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
    exportRowsToCsv(mockProspects);

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

    // Check if sheet_to_csv was called with the worksheet
    expect(XLSX.utils.sheet_to_csv).toHaveBeenCalled();

    // Check if URL.createObjectURL was called with a Blob
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));

    // Check if anchor element was properly configured
    expect(mockAnchorElement.href).toBe('mock-url');
    expect(mockAnchorElement.download).toMatch(/^prospects_\d{4}-\d{2}-\d{2}\.csv$/);
    
    // Check if click was triggered to download the file
    expect(mockAnchorElement.click).toHaveBeenCalled();
    
    // Check if URL.revokeObjectURL was called to clean up
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('mock-url');
  });
});
