// COPILOT FIX CLEAR-BTN: Test for consistent visibility of Clear All Results button

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import Results from '../pages/results';

// Mock the components and hooks we're not testing
jest.mock('../hooks/useSearchCache', () => ({
  useSearchCache: () => ({
    getSearchResults: jest.fn(() => []),
    saveSearchResults: jest.fn(),
    getCachedResults: jest.fn(() => []),
    clearCache: jest.fn(),
    getAccumulatedResults: jest.fn(() => []), // Empty for disabled test
    saveResultsToAccumulated: jest.fn(),
    addToast: jest.fn(),
  }),
}));

jest.mock('../hooks/useResultsUrlPersistence', () => ({
  useResultsUrlPersistence: () => ({
    syncParamsToUrl: jest.fn(),
    loadFromUrlParams: jest.fn(() => ({
      currentPage: 1,
      rowsPerPage: 10,
      sortColumn: 'name',
      sortDirection: 'asc',
    })),
  }),
}));

// Mock @iconify/react to avoid rendering issues in tests
jest.mock('@iconify/react', () => ({
  Icon: (props) => <span data-testid={`icon-${props.icon}`}>{props.icon}</span>,
}));

describe('Clear All Results Button', () => {
  const queryClient = new QueryClient();
  
  // Helper function to render the component with different mock states
  const renderWithProvider = (accumulatedResults = []) => {
    // Override the mock implementation for this specific test
    require('../hooks/useSearchCache').useSearchCache = jest.fn(() => ({
      getSearchResults: jest.fn(() => []),
      saveSearchResults: jest.fn(),
      getCachedResults: jest.fn(() => []),
      clearCache: jest.fn(),
      getAccumulatedResults: jest.fn(() => accumulatedResults),
      saveResultsToAccumulated: jest.fn(),
      addToast: jest.fn(),
    }));
    
    return render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Results />
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
  
  test('Clear All Results button should be disabled when there are no results', () => {
    renderWithProvider([]);
    
    // Button should be in the DOM
    const clearButton = screen.getByText('Clear All Results');
    expect(clearButton).toBeInTheDocument();
    
    // Button should be disabled
    const buttonElement = clearButton.closest('button');
    expect(buttonElement).toHaveAttribute('disabled');
    expect(buttonElement).toHaveAttribute('aria-disabled', 'true');
    
    // Button should have the disabled style class
    expect(buttonElement).toHaveClass('is-disabled');
  });
  
  test('Clear All Results button should be enabled when there are accumulated results', () => {
    // Mock some accumulated results
    const mockResults = [
      { id: '1', name: 'Test Person', jobTitle: 'Developer', company: 'Test Co' }
    ];
    
    renderWithProvider(mockResults);
    
    // Button should be in the DOM
    const clearButton = screen.getByText('Clear All Results');
    expect(clearButton).toBeInTheDocument();
    
    // Button should be enabled
    const buttonElement = clearButton.closest('button');
    expect(buttonElement).not.toHaveAttribute('disabled');
    expect(buttonElement).toHaveAttribute('aria-disabled', 'false');
    
    // Button should not have the disabled style class
    expect(buttonElement).not.toHaveClass('is-disabled');
  });

  // COPILOT FIX CLR-TEST: Test that clearing results doesn't navigate away
  test('Clear All Results button should clear results and stay on results page', async () => {
    const mockResults = [
      { id: '1', name: 'John Doe', jobTitle: 'CEO', company: 'Test Corp' },
      { id: '2', name: 'Jane Smith', jobTitle: 'CTO', company: 'Test Corp' }
    ];
    
    renderWithProvider(mockResults);
    
    // Should show results initially
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Store initial URL
    const initialUrl = window.location.pathname + window.location.search;
    
    // Click clear button
    const clearButton = screen.getByText('Clear All Results');
    fireEvent.click(clearButton);
    
    // Wait for the mutation to complete (simulate async behavior)
    await waitFor(() => {
      // Verify URL hasn't changed - no navigation occurred
      expect(window.location.pathname + window.location.search).toBe(initialUrl);
      
      // Results should be cleared (empty state should be shown)
      expect(screen.getByText('No results found')).toBeInTheDocument();
      
      // Original results should no longer be visible
      expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
      expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
      
      // Clear button should now be disabled
      const buttonElement = clearButton.closest('button');
      expect(buttonElement).toHaveAttribute('disabled');
    });
  });
});
