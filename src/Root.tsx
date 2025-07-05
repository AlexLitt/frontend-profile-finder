// Integration file for ResultsProvider
// This file shows how to integrate the ResultsProvider with the app

import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ResultsProvider } from './contexts/results-context';
import App from './App';

// Create a new query client
const queryClient = new QueryClient();

/**
 * Root component that wraps the app with necessary providers
 * To integrate the ResultsProvider, update your index.tsx to import
 * and use this Root component instead of directly using App
 */
export const Root: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ResultsProvider>
        <Router>
          <App />
        </Router>
      </ResultsProvider>
    </QueryClientProvider>
  );
};

/**
 * Integration steps:
 * 
 * 1. In your main.tsx or index.tsx file:
 *    - Import the Root component from this file
 *    - Replace <App /> with <Root />
 * 
 * 2. In your components that need access to the results state:
 *    - Import the useResults hook from contexts/results-context
 *    - Use it to access the state and dispatch function:
 *      
 *      const { state, dispatch } = useResults();
 *      
 *      // Use state.results for the results array
 *      // Use state.selectedIds for the selected IDs
 *      
 *      // Dispatch actions like:
 *      dispatch({ type: 'CLEAR_RESULTS' });
 *      dispatch({ type: 'SELECT_IDS', payload: ['id1', 'id2'] });
 */

export default Root;
