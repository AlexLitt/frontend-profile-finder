/**
 * COPILOT FIX TABLE-GAP: Script to inject critical CSS to remove table gap
 * This injects CSS directly into the head to ensure it has maximum specificity
 */

// Function to inject our critical CSS
export function injectTableGapFix(): void {
  // Create a style element
  const style = document.createElement('style');
  style.id = 'table-gap-fix';
  
  // Define critical CSS with high specificity selectors
  style.innerHTML = `
    /* Hide any spacer rows */
    tr[tabindex="-1"][aria-hidden="true"] {
      display: none !important;
      height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      visibility: hidden !important;
      opacity: 0 !important;
      position: absolute !important;
      pointer-events: none !important;
      overflow: hidden !important;
    }
    
    /* Ensure no gap between header and body */
    thead + * {
      margin-top: -1px !important;
    }
    
    /* Force border-collapse on all tables */
    table {
      border-collapse: collapse !important;
      border-spacing: 0 !important;
    }
    
    /* Target the specific element causing the gap */
    tr[style*="margin-left: 0.25rem; margin-top: 0.25rem;"] {
      display: none !important;
    }
  `;
  
  // Append to head if it doesn't exist already
  if (!document.getElementById('table-gap-fix')) {
    document.head.appendChild(style);
  }
}

// Auto-execute on import
injectTableGapFix();
