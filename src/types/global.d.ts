// Global type declarations for the application

import { Dispatch } from 'react';

// Define the action types for the results reducer
type ResultsAction = 
  | { type: 'SET_RESULTS'; payload: any[] }
  | { type: 'SELECT_IDS'; payload: string[] }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'CLEAR_RESULTS' };

// Extend the Window interface to include our global dispatch function
declare global {
  interface Window {
    __dispatchResults?: Dispatch<ResultsAction>;
  }
}
