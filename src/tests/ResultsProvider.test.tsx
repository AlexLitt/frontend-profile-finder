// COPILOT FIX CLR-TEST: Test for the CLEAR_RESULTS reducer action

import React from 'react';
import { render, act } from '@testing-library/react';
import { ResultsProvider, useResults } from '../contexts/results-context';

// Test component to access the context
const TestComponent = ({ onStateChange }: { onStateChange: (state: any) => void }) => {
  const { state, dispatch } = useResults();
  
  React.useEffect(() => {
    onStateChange({ state, dispatch });
  }, [state, dispatch, onStateChange]);
  
  return <div>Test Component</div>;
};

// Helper to render the provider with test data
const renderResultsProviderWithData = () => {
  let capturedState: any = null;
  let capturedDispatch: any = null;
  
  render(
    <ResultsProvider>
      <TestComponent 
        onStateChange={({ state, dispatch }) => {
          capturedState = state;
          capturedDispatch = dispatch;
        }} 
      />
    </ResultsProvider>
  );
  
  // Add some test data
  act(() => {
    capturedDispatch({ 
      type: 'SET_RESULTS', 
      payload: [
        { id: '1', name: 'Test Person', jobTitle: 'Developer', company: 'Test Co' },
        { id: '2', name: 'Another Person', jobTitle: 'Designer', company: 'Design Co' }
      ] 
    });
    capturedDispatch({ 
      type: 'SELECT_IDS', 
      payload: ['1'] 
    });
  });
  
  return {
    dispatch: capturedDispatch,
    getState: () => capturedState
  };
};

describe('ResultsProvider', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      },
      writable: true
    });
  });
  
  it('clears results & selections', () => {
    const { dispatch, getState } = renderResultsProviderWithData();
    
    // Verify initial state has data
    expect(getState().results).toHaveLength(2);
    expect(getState().selectedIds).toHaveLength(1);
    
    // Clear results
    act(() => {
      dispatch({ type:'CLEAR_RESULTS' });
    });
    
    // Verify results and selection are cleared
    expect(getState().results).toHaveLength(0);
    expect(getState().selectedIds).toHaveLength(0);
    
    // Verify localStorage was cleared
    expect(localStorage.removeItem).toHaveBeenCalledWith('results');
  });
});
