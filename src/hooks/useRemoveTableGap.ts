import React from 'react';

/**
 * Custom hook that removes any spacer rows between table header and body
 * This directly manipulates the DOM to ensure there's no gap
 */
export const useRemoveTableGap = () => {
  React.useEffect(() => {
    // Function to remove the gap
    const removeTableGap = () => {
      // Target all hidden spacer rows - using multiple potential selectors
      const spacerRows = document.querySelectorAll('tr[tabindex="-1"][aria-hidden="true"]');
      
      spacerRows.forEach(row => {
        if (row.classList.contains('w-px') || 
            row.classList.contains('h-px') || 
            (row.getAttribute('style') && row.getAttribute('style').includes('margin'))) {
          // Type assertion to HTMLElement to access style property
          const htmlRow = row as HTMLElement;
          htmlRow.style.height = '0';
          htmlRow.style.display = 'none';
          htmlRow.style.margin = '0';
          htmlRow.style.padding = '0';
          htmlRow.style.border = 'none';
        }
      });
      
      // Additionally, make sure tbody starts immediately after thead
      const tableHeaders = document.querySelectorAll('thead');
      tableHeaders.forEach(header => {
        const nextSibling = header.nextElementSibling;
        if (nextSibling) {
          // Type assertion to HTMLElement
          const htmlNextSibling = nextSibling as HTMLElement;
          htmlNextSibling.style.marginTop = '0';
          htmlNextSibling.style.paddingTop = '0';
        }
      });
    };
    
    // Run on mount
    removeTableGap();
    
    // Also set an interval to catch any dynamically added elements
    const interval = setInterval(removeTableGap, 500);
    
    // Clean up interval on unmount
    return () => clearInterval(interval);
  }, []);
};
