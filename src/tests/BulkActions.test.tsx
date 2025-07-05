import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ModernResultsTable from '../components/ModernResultsTable';

// Mock feature flags
jest.mock('../utils/featureFlags', () => ({
  INTEGRATIONS_ENABLED: false
}));

// Mock hooks that might interfere with test
jest.mock('../hooks/useRemoveTableGap', () => ({
  useRemoveTableGap: jest.fn()
}));

// Mock styles
jest.mock('../utils/styleTokens', () => ({
  buttonStyles: {
    actionButton: 'action-button-class',
    iconButton: 'icon-button-class',
  },
  tableStyles: {
    columns: {
      checkbox: 'checkbox-column-class',
      name: 'name-column-class',
      jobTitle: 'job-title-column-class',
      company: 'company-column-class',
      match: 'match-column-class',
      actions: 'actions-column-class',
    },
    container: 'table-container-class',
    wrapper: 'table-wrapper-class',
    row: 'table-row-class',
    cell: 'table-cell-class',
    header: 'table-header-class',
    nameCellContent: 'name-cell-content-class',
    selectionToolbar: {
      container: 'selection-toolbar-container',
      bar: 'selection-toolbar-bar',
      active: 'selection-toolbar-active',
      actionGroup: 'selection-toolbar-action-group',
      bulkActions: 'bulk-actions-class'
    }
  },
}));

// Mock components
jest.mock('@heroui/react', () => ({
  Table: ({ children, selectedKeys, onSelectionChange }) => (
    <table data-selected-keys={Array.from(selectedKeys || []).join(',')} data-testid="test-table">
      {children}
      <button onClick={() => onSelectionChange(new Set(['1', '2', '3']))}>Select All</button>
    </table>
  ),
  TableHeader: ({ children }) => <thead>{children}</thead>,
  TableColumn: ({ children }) => <th>{children}</th>,
  TableBody: ({ children }) => <tbody>{children}</tbody>,
  TableRow: ({ children }) => <tr>{children}</tr>,
  TableCell: ({ children }) => <td>{children}</td>,
  Button: ({ children, onPress, isIconOnly, startContent }) => (
    <button onClick={onPress} data-icon-only={isIconOnly ? 'true' : 'false'}>
      {startContent}{children}
    </button>
  ),
  Tooltip: ({ children, content }) => <div title={content}>{children}</div>,
  Pagination: () => <div data-testid="pagination" />,
  Chip: ({ children }) => <span>{children}</span>,
}));

// Mock Iconify
jest.mock('@iconify/react', () => ({
  Icon: ({ icon }) => <span data-icon={icon}>icon</span>,
}));

describe('Bulk Actions in ModernResultsTable', () => {
  const mockProps = {
    results: [
      { id: '1', name: 'John Doe', jobTitle: 'Developer', company: 'Tech Co', confidence: 90, email: 'john@example.com', phone: '123-456-7890', linkedInUrl: 'https://linkedin.com' },
      { id: '2', name: 'Jane Smith', jobTitle: 'Designer', company: 'Design Co', confidence: 85, email: 'jane@example.com', phone: '123-456-7890', linkedInUrl: 'https://linkedin.com' },
      { id: '3', name: 'Bob Johnson', jobTitle: 'Manager', company: 'Mgmt Co', confidence: 75, email: 'bob@example.com', phone: '123-456-7890', linkedInUrl: 'https://linkedin.com' },
    ],
    selectedKeys: new Set(['1', '2', '3']),
    onSelectionChange: jest.fn(),
    currentPage: 1,
    onPageChange: jest.fn(),
    totalPages: 1,
    onExport: jest.fn(),
    onCrmIntegration: jest.fn(),
    onSaveToList: jest.fn(),
    onExportSelected: jest.fn(), // COPILOT FIX BULK-ACTIONS
    onSaveSelectedToList: jest.fn(), // COPILOT FIX BULK-ACTIONS
  };

  test('renders bulk action buttons when all rows are selected', () => {
    render(<ModernResultsTable {...mockProps} />);
    
    // Look for the bulk action buttons
    expect(screen.getByText('Export')).toBeInTheDocument();
    expect(screen.getByText('Save to List')).toBeInTheDocument();
  });

  test('bulk export button calls onExportSelected when clicked', () => {
    render(<ModernResultsTable {...mockProps} />);
    
    // Find and click the Export button
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    // Check that onExportSelected was called
    expect(mockProps.onExportSelected).toHaveBeenCalledTimes(1);
  });

  test('bulk save to list button calls onSaveSelectedToList when clicked', () => {
    render(<ModernResultsTable {...mockProps} />);
    
    // Find and click the Save to List button
    const saveButton = screen.getByText('Save to List');
    fireEvent.click(saveButton);
    
    // Check that onSaveSelectedToList was called
    expect(mockProps.onSaveSelectedToList).toHaveBeenCalledTimes(1);
  });

  test('does not render bulk action buttons when not all rows are selected', () => {
    const partialSelection = {
      ...mockProps,
      selectedKeys: new Set(['1', '2']), // Only 2 out of 3 selected
    };
    
    render(<ModernResultsTable {...partialSelection} />);
    
    // Bulk action buttons should not be rendered
    const exportButtons = screen.queryAllByText('Export');
    const saveButtons = screen.queryAllByText('Save to List');
    
    // Should find only icon export buttons, not the bulk action text button
    expect(exportButtons.length).toBeLessThanOrEqual(1);
    expect(saveButtons.length).toBe(0);
  });

  test('regular action buttons are hidden when bulk action buttons are shown', () => {
    render(<ModernResultsTable {...mockProps} />);
    
    // Count buttons with icon-only attribute set to true (regular action buttons)
    const iconOnlyButtons = screen.queryAllByAttribute('data-icon-only', 'true');
    
    // There shouldn't be any icon-only export or save to list buttons when bulk actions are visible
    expect(iconOnlyButtons.length).toBeLessThanOrEqual(2); // There might be other icon-only buttons
  });
});
