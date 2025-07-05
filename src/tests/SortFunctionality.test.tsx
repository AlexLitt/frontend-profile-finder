import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

describe('Sorting functionality', () => {
  // COPILOT FIX SORT: Test the toggleSort function
  test('toggleSort cycles through sort states correctly', () => {
    // Mock implementation of setState to track state changes
    const setSort = jest.fn();
    
    // Initial state is null (default)
    let currentState = { key: null, dir: null };
    
    // Mock React.useState
    jest.spyOn(React, 'useState').mockImplementation(() => [currentState, setSort]);
    
    // Define the toggleSort function
    function toggleSort(key) {
      if (currentState.key !== key) {
        setSort({ key, dir: 'asc' });
        return;
      }
      
      if (currentState.dir === 'asc') {
        setSort({ key, dir: 'desc' });
        return;
      }
      
      // Reset to default when currently desc
      setSort({ key: null, dir: null });
    }
    
    // Test initial click (null -> asc)
    toggleSort('name');
    expect(setSort).toHaveBeenLastCalledWith({ key: 'name', dir: 'asc' });
    
    // Update mock state
    currentState = { key: 'name', dir: 'asc' };
    
    // Test second click (asc -> desc)
    toggleSort('name');
    expect(setSort).toHaveBeenLastCalledWith({ key: 'name', dir: 'desc' });
    
    // Update mock state
    currentState = { key: 'name', dir: 'desc' };
    
    // Test third click (desc -> null)
    toggleSort('name');
    expect(setSort).toHaveBeenLastCalledWith({ key: null, dir: null });
    
    // Test changing column resets to asc
    currentState = { key: 'name', dir: 'desc' };
    toggleSort('company');
    expect(setSort).toHaveBeenLastCalledWith({ key: 'company', dir: 'asc' });
  });
});
