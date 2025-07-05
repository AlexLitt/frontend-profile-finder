import React from 'react';
import { render, screen } from '@testing-library/react';
import ModernResultsTable from '../components/ModernResultsTable';

// Mock button styles and table styles
jest.mock('../utils/styleTokens', () => ({
  buttonStyles: {
    actionButton: 'action-button-class flex items-center justify-center',
    iconButton: 'icon-button-class',
  },
  tableStyles: {
    columns: {
      checkbox: 'checkbox-column-class w-10 min-w-10', // COPILOT FIX: Fixed width for checkbox column
      name: 'name-column-class', // COPILOT FIX: Removed pl-8, separate column for checkbox
      jobTitle: 'job-title-column-class',
      company: 'company-column-class',
      match: 'match-column-class',
      actions: 'actions-column-class',
    },
    nameCellContent: 'name-cell-content-class pl-2', // COPILOT FIX: Added padding to name cell content
    container: 'table-container-class overflow-x-auto', // COPILOT FIX #4: Overflow handling
    wrapper: 'table-wrapper-class min-w-full table-fixed', 
    row: 'h-16 border-b border-gray-100', // COPILOT FIX #4: Consistent row height
    cell: 'py-3', // COPILOT FIX #4: Consistent cell padding
  },
  layoutStyles: {
    formGap: 'form-gap-class',
    sectionGap: 'section-gap-class',
    searchToolbar: {
      container: 'search-toolbar-container',
      actionsRow: 'actions-row-class',
      toggleWrapper: 'toggle-wrapper-class gap-3', // COPILOT FIX #1: Added gap between toggle and label
      inputsRow: 'inputs-row-class gap-4', // COPILOT FIX #3: Gap between input field and buttons
      tableSpacer: 'table-spacer-class mt-6', // COPILOT FIX #5: Vertical space before table
    },
  },
}));

// Mock @heroui/react components
jest.mock('@heroui/react', () => ({
  Table: ({ children }) => <table>{children}</table>,
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableColumn: ({ children, className }) => <th className={className}>{children}</th>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableCell: ({ children }) => <td>{children}</td>,
  Chip: ({ children }) => <span>{children}</span>,
  Button: ({ children }) => <button>{children}</button>,
  Tooltip: ({ children }) => <>{children}</>,
  Pagination: () => <div data-testid="pagination"></div>,
}));

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children }) => <div>{children}</div>,
  },
}));

// Mock iconify
jest.mock('@iconify/react', () => ({
  Icon: () => <span data-testid="icon"></span>,
}));

describe('ModernResultsTable', () => {
  const mockResults = [
    {
      id: 'mock-1',
      name: 'John Doe',
      jobTitle: 'Software Engineer',
      company: 'Tech Company',
      linkedInUrl: 'https://linkedin.com/in/john-doe',
      email: 'john.doe@example.com',
      phone: '+1-555-1234',
      confidence: 90,
    },
  ];

  const defaultProps = {
    results: mockResults,
    selectedKeys: new Set(['mock-1']),
    onSelectionChange: jest.fn(),
    currentPage: 1,
    onPageChange: jest.fn(),
    totalPages: 1,
    onExport: jest.fn(),
    onCrmIntegration: jest.fn(),
    onSaveToList: jest.fn(),
    // COPILOT REMOVE SEARCH-SOURCE-TAG: Removed showSearchSource prop
  };

  test('renders correctly with proper styling classes', () => {
    render(<ModernResultsTable {...defaultProps} />);
    
    // COPILOT FIX #4: Check that table container has overflow handling
    const tableContainer = screen.getByRole('table').parentElement;
    expect(tableContainer).toHaveClass('table-container-class');
    
    // COPILOT FIX #4: Check that name column has left padding class for checkbox alignment
    const headers = screen.getAllByRole('columnheader');
    expect(headers[0]).toHaveClass('name-column-class');
    
    // Check that pagination is rendered
    expect(screen.getByTestId('pagination')).toBeInTheDocument();
  });
});
