import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SelectionToolbar from '../components/SelectionToolbar';

// Mock the Icon component
jest.mock('@iconify/react', () => ({
  Icon: ({ icon }) => <span data-testid={`icon-${icon}`}>{icon}</span>
}));

describe('SelectionToolbar Component', () => {
  const defaultProps = {
    selectedCount: 2,
    totalCount: 10,
    onSelectAll: jest.fn(),
    onClear: jest.fn(),
    isAllSelected: false,
    isAnySelected: true,
    actions: [
      {
        id: 'export',
        icon: 'test-icon-export',
        tooltip: 'Export selected',
        onClick: jest.fn(),
        enabled: true
      },
      {
        id: 'copy',
        icon: 'test-icon-copy',
        tooltip: 'Copy to clipboard',
        onClick: jest.fn(),
        enabled: true
      },
      {
        id: 'addToList',
        icon: 'test-icon-list',
        tooltip: 'Add selected to list',
        onClick: jest.fn(),
        enabled: false
      }
    ]
  };

  test('renders selection count correctly', () => {
    render(<SelectionToolbar {...defaultProps} />);
    expect(screen.getByText('2 of 10 selected')).toBeInTheDocument();
  });

  test('shows Select All button when not all rows are selected', () => {
    render(<SelectionToolbar {...defaultProps} />);
    const selectAllButton = screen.getByText('Select All');
    expect(selectAllButton).toBeInTheDocument();
    
    fireEvent.click(selectAllButton);
    expect(defaultProps.onSelectAll).toHaveBeenCalledTimes(1);
  });

  test('hides Select All button when all rows are selected', () => {
    render(<SelectionToolbar {...defaultProps} isAllSelected={true} />);
    expect(screen.queryByText('Select All')).not.toBeInTheDocument();
  });

  test('Clear button is enabled when rows are selected', () => {
    render(<SelectionToolbar {...defaultProps} />);
    const clearButton = screen.getByText('Clear');
    expect(clearButton).not.toBeDisabled();
    
    fireEvent.click(clearButton);
    expect(defaultProps.onClear).toHaveBeenCalledTimes(1);
  });

  test('Clear button is disabled when no rows are selected', () => {
    render(<SelectionToolbar {...defaultProps} isAnySelected={false} selectedCount={0} />);
    const clearButton = screen.getByText('Clear');
    expect(clearButton).toBeDisabled();
  });

  test('renders all action buttons', () => {
    render(<SelectionToolbar {...defaultProps} />);
    
    // All icons should be rendered, regardless of enabled status
    expect(screen.getByTestId('icon-test-icon-export')).toBeInTheDocument();
    expect(screen.getByTestId('icon-test-icon-copy')).toBeInTheDocument();
    expect(screen.getByTestId('icon-test-icon-list')).toBeInTheDocument();
  });

  test('disabled actions have aria-disabled attribute', () => {
    const { container } = render(<SelectionToolbar {...defaultProps} />);
    
    // Check for the aria-disabled attribute
    const buttons = container.querySelectorAll('button[aria-disabled="true"]');
    expect(buttons.length).toBe(1); // Only the addToList action is disabled
  });

  test('clicking action buttons calls their onClick handlers', () => {
    render(<SelectionToolbar {...defaultProps} />);
    
    // Find and click buttons (using closest parent since the icon is inside)
    const exportIcon = screen.getByTestId('icon-test-icon-export');
    fireEvent.click(exportIcon.closest('button'));
    expect(defaultProps.actions[0].onClick).toHaveBeenCalledTimes(1);
    
    const copyIcon = screen.getByTestId('icon-test-icon-copy');
    fireEvent.click(copyIcon.closest('button'));
    expect(defaultProps.actions[1].onClick).toHaveBeenCalledTimes(1);
  });
});
