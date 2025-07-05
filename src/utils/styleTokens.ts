/**
 * Shared style tokens for consistent UI appearance across the application
 */

export const buttonStyles = {
  // Standard action button styling
  actionButton: "h-10 px-4 rounded-lg flex items-center justify-center my-0", // COPILOT FIX SB-ALIGN: Added my-0 to prevent margin drift
  // Icon-only button styling
  iconButton: "rounded-full h-10 w-10 flex items-center justify-center my-0", // COPILOT FIX SB-ALIGN: Added my-0 to prevent margin drift
  // Selection toolbar icon button with consistent sizing
  selectionIconButton: "rounded-full h-10 w-10 flex items-center justify-center my-0 transition-opacity", // For consistent toolbar icons
};

export const layoutStyles = {
  // Standard spacing between form elements
  formGap: "gap-4",
  // Standard spacing between sections
  sectionGap: "gap-6",
  // Toolbar specific styles for search results page
  searchToolbar: {
    container: "flex flex-col sm:flex-row sm:items-center justify-between gap-4", // COPILOT FIX SB-ALIGN: Ensure sm:items-center for consistent baseline
    actionsRow: "flex items-center gap-4", // COPILOT FIX SB-ALIGN: items-center ensures vertical alignment
    toggleWrapper: "flex items-center gap-3", // COPILOT FIX SB-ALIGN: items-center aligns toggle with label
    inputsRow: "flex flex-col sm:flex-row sm:items-center items-start gap-4 mt-4", // COPILOT FIX SB-ALIGN: Changed items-center scope for better mobile alignment
    tableSpacer: "mt-6", // Adds vertical space between toolbar and table
    detailsSpacer: "mt-8", // COPILOT FIX DETAILS-GAP: Adds 32px vertical space between table and details card
  },
};

export const tableStyles = {
  // Fixed column widths for results table
  columns: {
    name: "w-[30%]", // Width for name column - no padding here, will be applied to the cell content
    jobTitle: "w-[20%]",
    company: "w-[20%]",
    match: "w-[10%]",
    actions: "w-[20%]",
    checkbox: "w-10 min-w-10", // Fixed width for checkbox column
  },
  container: "overflow-x-auto", // Overflow handling for responsive tables
  wrapper: "min-w-full table-fixed", // Ensure table maintains fixed column widths
  row: "hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 h-16 my-0", // COPILOT FIX TABLE-GAP: Removed any vertical margin
  cell: "py-3", // Consistent cell padding
  nameCellContent: "pl-2", // Left padding for name cell content to prevent overlap with checkbox
  // COPILOT FIX HDR-WHITE: Table header with pure white background in all modes, no gray in any mode
  header: "bg-white border-b border-gray-100",
  // COPILOT FIX SEL-BAR: Selection toolbar styling
  selectionToolbar: {
    // COPILOT FIX SCROLL: Updated container to have fixed height padding to prevent layout shift
    container: "relative pt-12", // Container with padding-top to accommodate the selection bar
    // COPILOT FIX SCROLL: Using absolute positioning with fixed height and opacity transition only
    bar: "absolute top-0 left-0 right-0 w-full h-12 bg-white border-b border-gray-100 opacity-0 pointer-events-none transition-opacity duration-150 ease flex items-center justify-between p-4", // Hidden by default with smooth transition
    // COPILOT FIX SCROLL: Only change opacity and pointer-events, not visibility
    active: "opacity-100 pointer-events-auto", // Applied when selection is active
    actionGroup: "flex items-center gap-3", // COPILOT FIX EXP-XLSX: Increased gap to 3 (12px) for consistent spacing with four buttons
    disabledButton: "opacity-50" // Applied to disabled buttons to maintain visual consistency
  }
};
