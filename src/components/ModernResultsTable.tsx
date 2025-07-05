import React from "react";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Tooltip,
  Pagination
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { buttonStyles, tableStyles } from "../utils/styleTokens";
import { INTEGRATIONS_ENABLED } from "../utils/featureFlags"; // COPILOT FIX INT-HIDE: Import feature flag
import "../utils/selectionBarStyles.css"; // COPILOT FIX SEL-BAR: Import custom visibility classes
import "../utils/tableHeaderStyles.css"; // COPILOT FIX HDR-WHITE: Import table header styles directly
import "../utils/tableHeaderOverride.css"; // COPILOT FIX HDR-WHITE: Import header override styles directly
import "../utils/tableSpacingFix.css"; // COPILOT FIX TABLE-GAP: Import spacing fix directly
import "../utils/tableRowFix.css"; // COPILOT FIX TABLE-GAP: Import row fix directly
import "../utils/tableBorderCollapse.css"; // COPILOT FIX TABLE-GAP: Import border collapse styles directly
import "../utils/tableScrollFix.css"; // COPILOT FIX SCROLL: Import fixed-height wrapper styles
// COPILOT REMOVE SEARCH-SOURCE-TAG: Removed searchSourceTagFix.css import
import "../utils/tableSortStyles.css"; // COPILOT FIX SORT: Import sorting styles
import { useRemoveTableGap } from "../hooks/useRemoveTableGap"; // COPILOT FIX TABLE-GAP: Import custom hook
import "../utils/injectTableGapFix"; // COPILOT FIX TABLE-GAP: Import script that injects critical CSS
import SelectionToolbar from "./SelectionToolbar"; // Import the new SelectionToolbar component
import SortIcon from "./SortIcon"; // COPILOT FIX SORT: Import sort icon component
import { exportRowsToExcel } from "../utils/exportRowsToExcel"; // COPILOT FIX XLSX-BTN: Import Excel export utility
import { exportRowsToCsv } from "../utils/exportRowsToCsv"; // COPILOT FIX CSV-BTN: Import CSV export utility
import { SearchResult } from "../api/profileSearch"; // COPILOT FIX SORT: Import SearchResult type

// COPILOT FIX SORT: Define SortState type for table sorting
type SortState = { key: keyof SearchResult | '__searchSource' | null; dir: 'asc' | 'desc' | null };

interface ModernResultsTableProps {
  results: SearchResult[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  onExport: (format: string) => void;
  onCrmIntegration: (crm: string) => void;
  onSaveToList?: () => void; // New callback for saving to list
  onChatStart?: (prospect: SearchResult) => void;
  // COPILOT REMOVE SEARCH-SOURCE-TAG: Removed showSearchSource prop
  onExportSelected?: () => void; // COPILOT FIX BULK-ACTIONS: Callback for exporting all selected
  // COPILOT FIX SORT: Add sort props - using direct toggle function instead of state setter
  sortState?: SortState;
  toggleSort?: (key: keyof SearchResult) => void;
  onSaveSelectedToList?: () => void; // COPILOT FIX BULK-ACTIONS: Callback for saving all selected to list
  // COPILOT FIX XLSX-BTN: Removed onExportSelectedExcel prop since we're using direct utility function
}

const ModernResultsTable: React.FC<ModernResultsTableProps> = ({
  results,
  selectedKeys,
  onSelectionChange,
  currentPage,
  onPageChange,
  totalPages,
  onExport,
  onCrmIntegration,
  onSaveToList,
  onChatStart,
  // COPILOT REMOVE SEARCH-SOURCE-TAG: Removed showSearchSource parameter
  onExportSelected, // COPILOT FIX BULK-ACTIONS: Added callback for bulk export
  onSaveSelectedToList, // COPILOT FIX BULK-ACTIONS: Added callback for bulk save to list
  // COPILOT FIX SORT: Add sort props with default values
  sortState = { key: null, dir: null },
  toggleSort = (key: keyof SearchResult) => {}
  // COPILOT FIX XLSX-BTN: Removed onExportSelectedExcel since we're using direct utility function
}) => {
  // COPILOT FIX TABLE-GAP: Use custom hook to remove gap between table header and first row
  useRemoveTableGap();
  
  // COPILOT FIX TABLE-GAP: Create a ref for the table container
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  
  // COPILOT FIX TABLE-GAP: Direct DOM manipulation to remove spacer rows
  React.useEffect(() => {
    if (tableContainerRef.current) {
      // Find any spacer rows and remove them
      const spacerRows = tableContainerRef.current.querySelectorAll('tr[aria-hidden="true"]');
      spacerRows.forEach(row => {
        if (row instanceof HTMLElement) {
          row.style.display = 'none';
          row.style.height = '0';
          row.style.margin = '0';
          row.style.padding = '0';
        }
      });
    }
  }, [results, currentPage]); // Re-run when results or page changes
  
  // Get confidence color based on score
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "primary";
    if (score >= 50) return "warning";
    return "danger";
  };
  
  // Add state to track if all rows are selected (for Select All checkbox workaround)
  const [isSelectAllActive, setIsSelectAllActive] = React.useState(false);
  
  // Effect to detect when all rows are selected
  React.useEffect(() => {
    // Check if all rows are selected by comparing IDs
    const allSelected = results.length > 0 && 
      selectedKeys.size === results.length && 
      results.every(result => selectedKeys.has(result.id));
    
    setIsSelectAllActive(allSelected);
  }, [results, selectedKeys]);
  
  // COPILOT FIX BULK-ACTIONS: Check if all visible rows are selected
  const areAllRowsSelected = React.useMemo(() => {
    // Direct check - are we in select all mode?
    if (isSelectAllActive) {
      return true;
    }
    
    // Case 1: Check if the number of selected items matches the number of results
    // AND each result ID is in the selectedKeys
    if (results.length > 0 && 
        selectedKeys.size === results.length && 
        results.every(result => selectedKeys.has(result.id))) {
      return true;
    }
    
    return false;
  }, [results, selectedKeys, isSelectAllActive]);

  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      {/* Container with rounded corners and shadow */}
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        {/* COPILOT FIX SCROLL: Added tableWrapper div with consistent height to prevent layout shift */}
        {/* COPILOT FIX SCROLL: Added tableWrapper class for fixed-height selection toolbar area */}
        <div className="tableWrapper">
        {/* COPILOT FIX SEL-BAR: Replaced conditional rendering with always-present toolbar that toggles visibility */}
        {/* COPILOT FIX SEL-BAR: Table container with relative positioning and top padding for selection bar */}
        <div>
          {/* Unified Selection Toolbar Component that maintains consistent layout */}
          {React.useMemo(() => {
            // Determine if many rows are selected (for enabling certain buttons)
            const manySelected = selectedKeys.size > 1;
            
            // Define action buttons configuration with consistent layout
            const actions = [
              {
                id: 'export-csv', // COPILOT FIX CSV-BTN: Updated ID for clarity
                icon: 'lucide:download',
                tooltip: 'Export selected to CSV',
                onClick: () => {
                  // COPILOT FIX CSV-BTN: Get selected rows and pass them to the CSV export utility
                  const selectedItems = results.filter(result => selectedKeys.has(result.id));
                  exportRowsToCsv(selectedItems);
                },
                enabled: selectedKeys.size > 0
              },
              {
                id: 'export-xlsx', // COPILOT FIX XLSX-BTN: Excel export button using direct utility function
                icon: 'lucide:file-spreadsheet', // COPILOT FIX XLSX-BTN: Using Lucide spreadsheet icon
                tooltip: 'Export selected to Excel', // COPILOT FIX XLSX-BTN: Tooltip text
                onClick: () => {
                  // COPILOT FIX XLSX-BTN: Get selected rows and pass them to the export utility
                  const selectedItems = results.filter(result => selectedKeys.has(result.id));
                  exportRowsToExcel(selectedItems);
                }, 
                enabled: selectedKeys.size > 0 // COPILOT FIX XLSX-BTN: Enabled when at least one row is selected
              },
              {
                id: 'copy',
                icon: 'lucide:clipboard',
                tooltip: 'Copy to clipboard',
                onClick: () => {
                  // Get selected items
                  const selectedItems = results.filter(result => selectedKeys.has(result.id));
                  
                  // Format data for clipboard
                  const text = selectedItems.map(item => 
                    `${item.name}, ${item.jobTitle}, ${item.company}, ${item.email || 'No email'}`
                  ).join('\n');
                  
                  // Copy to clipboard
                  navigator.clipboard.writeText(text).then(
                    () => alert('Copied to clipboard!'),
                    () => alert('Failed to copy to clipboard')
                  );
                },
                enabled: selectedKeys.size > 0
              },
              {
                id: 'addToList',
                icon: 'lucide:list-plus',
                tooltip: 'Add selected to list',
                onClick: () => selectedKeys.size > 1 ? onSaveSelectedToList?.() : onSaveToList?.(),
                enabled: selectedKeys.size > 0
              },
            ];
            
            // If integrations are enabled, add those buttons too
            if (INTEGRATIONS_ENABLED) {
              actions.push({
                id: 'hubspot',
                icon: 'logos:hubspot-icon',
                tooltip: 'Send to HubSpot',
                onClick: () => onCrmIntegration("HubSpot"),
                enabled: selectedKeys.size > 0
              });
              
              actions.push({
                id: 'salesforce',
                icon: 'logos:salesforce',
                tooltip: 'Send to Salesforce',
                onClick: () => onCrmIntegration("Salesforce"),
                enabled: selectedKeys.size > 0
              });
            }
            
            return (
              <SelectionToolbar
                selectedCount={selectedKeys.size}
                totalCount={results.length}
                onSelectAll={() => {
                  const allIds = new Set(results.map(item => item.id));
                  onSelectionChange(allIds);
                  setIsSelectAllActive(true);
                }}
                onClear={() => onSelectionChange(new Set())}
                isAllSelected={areAllRowsSelected}
                isAnySelected={selectedKeys.size > 0}
                actions={actions}
              />
            );
          }, [selectedKeys, results, areAllRowsSelected, onExport, onExportSelected, onSaveToList, onSaveSelectedToList, onCrmIntegration]) // COPILOT FIX XLSX-BTN: Removed onExportSelectedExcel from dependencies
        }
        
        {/* COPILOT FIX #4: Added container div with overflow handling for table */}
        <div ref={tableContainerRef} className={tableStyles.container}>
          <Table
            removeWrapper
            aria-label="Search results"
            selectionMode="multiple"
            selectedKeys={selectedKeys}
            onSelectionChange={(keys) => {
              // Make sure we handle both "all" and specific keys
              onSelectionChange(keys as any);
            }}
            style={{
              borderCollapse: 'collapse',
              borderSpacing: '0'
            }}
            classNames={{
              base: "rounded-none no-table-gap", // COPILOT FIX TABLE-GAP: Added class for removing gaps
              table: `${tableStyles.wrapper} border-collapse`,
              thead: `${tableStyles.header} table-header-white no-margin-bottom`, // COPILOT FIX HDR-WHITE & TABLE-GAP: Force white header with no bottom margin
              tr: `${tableStyles.row} border-collapse-row`,
              td: tableStyles.cell,
              th: `${tableStyles.cell} table-header-white`,
              tbody: "no-margin-top border-collapse-body" // COPILOT FIX TABLE-GAP: Remove top margin from tbody
            }}
        >
          {/* COPILOT FIX HDR-WHITE: Added inline style and table-header-white class to ensure white background */}
          {/* COPILOT FIX HDR-WHITE & TABLE-GAP: White background header with no gap to first row */}
          {/* COPILOT FIX TABLE-GAP: Added important styles to ensure no gap */}
          <TableHeader className="table-header-white" style={{ 
            background: 'white !important', 
            marginBottom: '0 !important',
            paddingBottom: '0 !important',
            borderBottom: '1px solid #f3f4f6'
          }}>
            {/* Added dedicated column for checkbox with fixed width */}
            <TableColumn className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.checkbox} table-header-white`} style={{ background: 'white' }}>&nbsp;</TableColumn>
            
            {/* COPILOT FIX SORT: Added sortable headers with click handlers and sort icons */}
            <TableColumn 
              className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.name} table-header-white sortableHeader`} 
              style={{ background: 'white' }}
              onClick={() => toggleSort('name')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSort('name')}
            >
              NAME {sortState.key === 'name' && <SortIcon dir={sortState.dir} />}
            </TableColumn>
            
            <TableColumn 
              className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.jobTitle} table-header-white sortableHeader`} 
              style={{ background: 'white' }}
              onClick={() => toggleSort('jobTitle')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSort('jobTitle')}
            >
              JOB TITLE {sortState.key === 'jobTitle' && <SortIcon dir={sortState.dir} />}
            </TableColumn>
            
            <TableColumn 
              className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.company} table-header-white sortableHeader`} 
              style={{ background: 'white' }}
              onClick={() => toggleSort('company')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSort('company')}
            >
              COMPANY {sortState.key === 'company' && <SortIcon dir={sortState.dir} />}
            </TableColumn>
            
            <TableColumn 
              className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.match} table-header-white sortableHeader`} 
              style={{ background: 'white' }}
              onClick={() => toggleSort('confidence')}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && toggleSort('confidence')}
            >
              MATCH {sortState.key === 'confidence' && <SortIcon dir={sortState.dir} />}
            </TableColumn>
            
            <TableColumn className={`text-xs font-semibold text-gray-500 ${tableStyles.columns.actions} table-header-white`} style={{ background: 'white' }}>ACTIONS</TableColumn>
          </TableHeader>
          <TableBody style={{ 
            marginTop: '-1px !important', 
            paddingTop: '0 !important',
            position: 'relative',
            top: '-1px'
          }}>
            {(results || []).map((item) => (
              <TableRow key={item.id || Math.random()}>
                {/* Empty cell for the checkbox column - the Table component will add the checkbox here */}
                <TableCell>&nbsp;</TableCell>
                <TableCell>
                  <div className={`font-medium ${tableStyles.nameCellContent} mb-0`}>{item.name || 'N/A'}</div>
                  {item.email && <div className={`text-sm text-gray-500 ${tableStyles.nameCellContent}`}>{item.email}</div>}
                  {item.phone && <div className={`text-sm text-gray-500 ${tableStyles.nameCellContent}`}>{item.phone}</div>}
                  {/* COPILOT REMOVE SEARCH-SOURCE-TAG */}
                </TableCell>
                <TableCell>{item.jobTitle || 'N/A'}</TableCell>
                <TableCell>{item.company || 'N/A'}</TableCell>
                <TableCell>
                  <Chip 
                    color={getConfidenceColor(item.confidence || 0)} 
                    variant="flat"
                    size="sm"
                    className="font-medium"
                  >
                    {(item.confidence || 0)}%
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="View LinkedIn Profile">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        as="a" 
                        href={item.linkedInUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View LinkedIn profile"
                        className={buttonStyles.iconButton}
                      >
                        <Icon icon="logos:linkedin-icon" className="text-lg" />
                      </Button>
                    </Tooltip>
                    {item.email && (
                      <Tooltip content="Send Email">
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          as="a" 
                          href={`mailto:${item.email}`} 
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label="Send email"
                          className={buttonStyles.iconButton}
                        >
                          <Icon icon="ic:baseline-email" className="text-lg" />
                        </Button>
                      </Tooltip>
                    )}
                    {onChatStart && (
                      <Tooltip content="Start Chat">
                        <Button 
                          isIconOnly 
                          variant="light" 
                          size="sm"
                          onPress={() => onChatStart(item)}
                          aria-label="Start chat with prospect"
                          className={buttonStyles.iconButton}
                        >
                          <Icon icon="lucide:message-circle" className="text-lg" />
                        </Button>
                      </Tooltip>
                    )}
                    <Tooltip content="More Actions">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        aria-label="More actions"
                        className={buttonStyles.iconButton}
                      >
                        <Icon icon="lucide:more-vertical" className="text-lg" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        </div>
        </div>
        {/* COPILOT FIX SCROLL: Close the tableWrapper div */}
        </div>
        
        <div className="p-4 border-t border-gray-100 flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            classNames={{
              cursor: "bg-primary-500"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ModernResultsTable;