import React from 'react';
import { render, screen } from '@testing-library/react';
import { Button, Switch, Input, Card, CardHeader } from '@heroui/react';
import { Icon } from '@iconify/react';
import { buttonStyles, layoutStyles } from '../utils/styleTokens';

// Mock for @heroui/react components
jest.mock('@heroui/react', () => ({
  Button: ({ children, className }) => <button className={className}>{children}</button>,
  Switch: ({ className }) => <div className={className}>Switch</div>,
  Input: ({ className }) => <input className={className} />,
  Card: ({ children }) => <div>{children}</div>,
  CardHeader: ({ className, children }) => <div className={className}>{children}</div>,
}));

// Mock for @iconify/react
jest.mock('@iconify/react', () => ({
  Icon: () => <span>Icon</span>,
}));

describe('Search Toolbar Alignment', () => {
  test('Toolbar elements should have proper alignment classes', () => {
    // Create a simplified version of the toolbar
    const { container } = render(
      <Card>
        <CardHeader className="p-6 flex flex-col gap-4">
          <div className={layoutStyles.searchToolbar.container}>
            <div>
              <h2 className="text-xl font-bold">Search Results</h2>
              <p className="text-gray-500 text-sm">Showing results</p>
            </div>
            <div className={layoutStyles.searchToolbar.actionsRow}>
              <div className={layoutStyles.searchToolbar.toggleWrapper}>
                <span className="text-sm text-gray-600 inline-flex items-center">All Results</span>
                <Switch size="sm" color="primary" className="my-0" />
              </div>
              <Button
                variant="flat" 
                color="primary"
                size="sm"
                className={buttonStyles.actionButton}
              >
                New Search
              </Button>
            </div>
          </div>
          <div className={layoutStyles.searchToolbar.inputsRow}>
            <Input 
              className="w-full sm:max-w-xs rounded-full my-0" 
              size="sm"
            />
            <Button
              variant="flat"
              color="warning"
              size="sm"
              className={buttonStyles.actionButton}
            >
              Clear All Results
            </Button>
          </div>
        </CardHeader>
      </Card>
    );

    // COPILOT FIX SB-ALIGN: Verify toolbar elements have proper alignment classes
    
    // Check that actionsRow has proper alignment
    const actionsRow = container.querySelector(`.${layoutStyles.searchToolbar.actionsRow.replace(/ /g, '.')}`);
    expect(actionsRow?.className).toContain('items-center');
    
    // Check that toggleWrapper has proper alignment
    const toggleWrapper = container.querySelector(`.${layoutStyles.searchToolbar.toggleWrapper.replace(/ /g, '.')}`);
    expect(toggleWrapper?.className).toContain('items-center');
    
    // Check that inputsRow has proper alignment
    const inputsRow = container.querySelector(`.${layoutStyles.searchToolbar.inputsRow.replace(/ /g, '.')}`);
    expect(inputsRow?.className).toContain('items-center');
    
    // Check that buttons have proper alignment
    const buttons = container.querySelectorAll(`.${buttonStyles.actionButton.replace(/ /g, '.')}`);
    Array.from(buttons).forEach(button => {
      expect(button.className).toContain('items-center');
      expect(button.className).toContain('my-0');
    });
  });
});
