import React, { createContext, useContext, useReducer, ReactNode, Dispatch } from 'react';
import { SearchResult } from '../api/profileSearch';

// Define the state shape
interface ResultsState {
  results: SearchResult[];
  selectedIds: string[];
  loading: boolean;
  error: string | null;
}

// Define action types
type ResultsAction = 
  | { type: 'SET_RESULTS'; payload: SearchResult[] }
  | { type: 'SELECT_IDS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_RESULTS' }; // COPILOT FIX CLR-1: Added CLEAR_RESULTS action

// Create initial state
const initialState: ResultsState = {
  results: [],
  selectedIds: [],
  loading: false,
  error: null
};

// Create the reducer function
const resultsReducer = (state: ResultsState, action: ResultsAction): ResultsState => {
  switch (action.type) {
    case 'SET_RESULTS':
      return { ...state, results: action.payload, loading: false, error: null };
    case 'SELECT_IDS':
      return { ...state, selectedIds: action.payload };
    case 'CLEAR_SELECTION':
      return { ...state, selectedIds: [] };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'CLEAR_RESULTS': // COPILOT FIX CLR-1: Added CLEAR_RESULTS case
      return { ...state, results: [], selectedIds: [] };
    default:
      return state;
  }
};

// Create context
const ResultsContext = createContext<{
  state: ResultsState;
  dispatch: Dispatch<ResultsAction>;
} | undefined>(undefined);

// Create provider component
export const ResultsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(resultsReducer, initialState);

  // Load initial results from localStorage if available
  React.useEffect(() => {
    try {
      const savedResults = localStorage.getItem('results');
      if (savedResults) {
        const parsedResults = JSON.parse(savedResults);
        if (Array.isArray(parsedResults)) {
          dispatch({ type: 'SET_RESULTS', payload: parsedResults });
        }
      }
    } catch (error) {
      console.error('Error loading results from localStorage:', error);
    }
  }, []);

  // Listen for actions that should be persisted to localStorage
  React.useEffect(() => {
    if (state.results.length > 0) {
      localStorage.setItem('results', JSON.stringify(state.results));
    }
  }, [state.results]);

  // COPILOT FIX CLR-2: Update ResultsProvider to persist the emptied list
  React.useEffect(() => {
    const handleActions = async (action: ResultsAction) => {
      if (action.type === 'CLEAR_RESULTS') {
        localStorage.removeItem('results');
      }
    };

    // Create a middleware pattern to intercept actions
    const originalDispatch = dispatch;
    const enhancedDispatch = (action: ResultsAction) => {
      handleActions(action);
      return originalDispatch(action);
    };
    
    // COPILOT FIX CLR-2: Make dispatch available globally for transition period
    // This allows the Clear All Results button to work without full context integration
    window.__dispatchResults = enhancedDispatch;

    return () => {
      // Clean up
      if (window.__dispatchResults === enhancedDispatch) {
        delete window.__dispatchResults;
      }
    };
  }, [dispatch]);

  return (
    <ResultsContext.Provider value={{ state, dispatch }}>
      {children}
    </ResultsContext.Provider>
  );
};

// Create a hook to use the results context
export const useResults = () => {
  const context = useContext(ResultsContext);
  if (context === undefined) {
    throw new Error('useResults must be used within a ResultsProvider');
  }
  return context;
};
