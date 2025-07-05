import React from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  Input,
  Button,
  Chip,
  Switch,
  addToast
} from "@heroui/react";
import { SearchResult } from "../api/profileSearch";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import ModernResultsTable from "../components/ModernResultsTable";
import { useSearchCache } from "../hooks/useSearchCache";
import { setGlobalClearFlag } from "../hooks/useSearchCache";
import { useResultsUrlPersistence } from "../hooks/useResultsUrlPersistence";
import { debugLocalStorageCache } from "../utils/debugCache";
import SaveToListModal from "../components/SaveToListModal";
import ProspectDetailsCard from "../components/ProspectDetailsCard"; // COPILOT FIX CARD-GRID: Import new component
import { buttonStyles, layoutStyles } from "../utils/styleTokens";
import { INTEGRATIONS_ENABLED } from "../utils/featureFlags"; // COPILOT FIX INT-HIDE: Import feature flag
import "../utils/buttonStateStyles.css"; // COPILOT FIX CLEAR-BTN: Import button state styles


export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { 
    useSearchResults, 
    debugCacheContents, 
    getLocalStorageKey, 
    useAccumulatedResults,
    useClearAccumulatedResults,
    clearSearchCache
  } = useSearchCache();
  const { restoreUrlIfNeeded, recoverParamsFromCache } = useResultsUrlPersistence();

  // Try to restore URL if needed on component mount
  React.useEffect(() => {
    const restored = restoreUrlIfNeeded();
    if (restored) {
      return; // Let the component re-render with the correct URL
    }
  }, [restoreUrlIfNeeded]);

  // Get search params from URL with fallback recovery
  const params = new URLSearchParams(location.search);
  const titles = params.get("titles") || "";
  const companies = params.get("companies") || "";

  // Create search params object for the cache hook - ensure these are clean
  const searchParams = React.useMemo(() => {
    const parsed = {
      jobTitles: titles ? titles.split(",").map(t => t.trim()).filter(Boolean) : [],
      companies: companies ? companies.split(",").map(c => c.trim()).filter(Boolean) : [],
      jobLevels: [],
      locations: [],
      keywords: []
    };
    
    // If URL params are empty but we're on the results page, try to recover from cache
    if (!parsed.jobTitles.length && !parsed.companies.length) {
      const recovered = recoverParamsFromCache();
      if (recovered) {
        return recovered;
      }
    }
    
    return parsed;
  }, [titles, companies, location.search, recoverParamsFromCache]);

  // Force refresh accumulated results on component mount
  React.useEffect(() => {
    // Try to manually load accumulated results if React Query cache is empty
    if ((!accumulatedResults || accumulatedResults.length === 0) && !accumulatedLoading) {
      refetchAccumulated();
    }
  }, []); // Only run on mount

  // State to store results from direct localStorage access if needed
  const [directCachedResults, setDirectCachedResults] = React.useState<SearchResult[]>([]);
  
  // Track when we've just cleared results to prevent cache recovery
  const justClearedRef = React.useRef(false);
  
  // State to toggle between showing all accumulated results vs only the last search results
  // Default to false (Current Search) for new queries - R-1
  const [showAccumulated, setShowAccumulated] = React.useState(false);

  // Use cached search results with retry and suspense
  const { 
    data: results = [], 
    isLoading, 
    error, 
    isFetching, 
    isSuccess,
    refetch
  } = useSearchResults(searchParams);

  // Get accumulated results from all searches
  const { 
    data: accumulatedResults = [], 
    isLoading: accumulatedLoading,
    refetch: refetchAccumulated
  } = useAccumulatedResults();

  // Mutation to clear accumulated results
  const clearAccumulatedMutation = useClearAccumulatedResults();

  // Show notification when new results are accumulated
  React.useEffect(() => {
    const lastAddedCount = sessionStorage.getItem('lastAddedCount');
    if (lastAddedCount && parseInt(lastAddedCount) > 0) {
      const count = parseInt(lastAddedCount);
      addToast({
        title: "New results added",
        description: `${count} new unique prospect${count > 1 ? 's' : ''} added to your accumulated results`,
        color: "success"
      });
      sessionStorage.removeItem('lastAddedCount'); // Clear after showing
    }
  }, [results]); // Trigger when results change

  // Auto-accumulate results whenever we have new search results
  React.useEffect(() => {
    if (results && results.length > 0 && searchParams && (searchParams.jobTitles.length > 0 || searchParams.companies.length > 0)) {
      
      // Get existing accumulated results
      const accumulatedKey = 'df_accumulated_results';
      const existing = localStorage.getItem(accumulatedKey);
      let existingResults: SearchResult[] = [];
      
      if (existing) {
        try {
          const parsed = JSON.parse(existing);
          if (parsed && parsed.results && Array.isArray(parsed.results)) {
            existingResults = parsed.results;
          }
        } catch (e) {
          console.warn('⚠️ Error parsing existing accumulated results:', e);
        }
      }
      
      // Deduplicate and add new results
      const existingIds = new Set(existingResults.map(r => r.id || `${r.name}_${r.email}`));
      const newResultsToAdd: SearchResult[] = [];
      
      results.forEach(result => {
        const resultId = result.id || `${result.name}_${result.email}`;
        if (!existingIds.has(resultId)) {
          newResultsToAdd.push({
            ...result,
            __searchSource: {
              jobTitles: searchParams.jobTitles,
              companies: searchParams.companies,
              timestamp: Date.now()
            }
          });
        }
      });
      
      if (newResultsToAdd.length > 0) {
        const combined = [...existingResults, ...newResultsToAdd];
        const dataToStore = {
          __timestamp: Date.now(),
          __version: '1.0',
          results: combined
        };
        
        localStorage.setItem(accumulatedKey, JSON.stringify(dataToStore));
        
        // Trigger a refetch of accumulated results
        setTimeout(() => {
          refetchAccumulated();
        }, 100);
        
        // Store count for notification
        sessionStorage.setItem('lastAddedCount', newResultsToAdd.length.toString());
      }
    }
  }, [results, searchParams.jobTitles.length, searchParams.companies.length]); // More stable dependencies

  // Try to recover results from localStorage if React Query cache fails OR if URL params are missing
  React.useEffect(() => {
    // Skip cache recovery if we just cleared results
    if (justClearedRef.current) {
      return;
    }
    
    const hasSearchParams = searchParams.jobTitles.length > 0 || searchParams.companies.length > 0;
    const hasEmptyResults = results?.length === 0;
    const isNotFetching = !isFetching && !isLoading && !error;
    
    // Check if we have empty URL params but might have cached results from previous searches
    const hasEmptyUrlParams = !titles && !companies;
    
    // Only run cache recovery once per search params change, not on every render
    if (isNotFetching && (hasEmptyResults || hasEmptyUrlParams)) {
      
      // Try all possible cache key formats, including scanning for recent searches
      const attemptCacheRecovery = () => {
        try {
          // If we have specific search params, try those first
          if (hasSearchParams) {
            const localCacheKey = getLocalStorageKey(searchParams);
            
            const storedData = localStorage.getItem(localCacheKey);
            if (storedData) {
              const parsedData = JSON.parse(storedData);
              
              if (parsedData && parsedData.__timestamp && Array.isArray(parsedData.results)) {
                setDirectCachedResults(parsedData.results);
                return true;
              } 
              else if (Array.isArray(parsedData) && parsedData.length > 0) {
                setDirectCachedResults(parsedData);
                return true;
              }
            }
          }
          
          // If URL params are missing, try to find the most recent cache entry
          if (hasEmptyUrlParams) {
            // Look for any cache entries that match our prefix
            const cacheEntries: Array<{key: string, data: any, timestamp: number}> = [];
            
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i);
              if (key && key.startsWith('df_results_cache_')) {
                try {
                  const storedItem = localStorage.getItem(key);
                  if (storedItem) {
                    const parsedItem = JSON.parse(storedItem);
                    
                    // Handle new format with metadata
                    if (parsedItem && parsedItem.__timestamp && Array.isArray(parsedItem.results)) {
                      if (parsedItem.results.length > 0) {
                        cacheEntries.push({
                          key,
                          data: parsedItem,
                          timestamp: parsedItem.__timestamp
                        });
                      }
                    }
                    // Handle legacy format
                    else if (Array.isArray(parsedItem) && parsedItem.length > 0) {
                      cacheEntries.push({
                        key,
                        data: { results: parsedItem },
                        timestamp: Date.now() - 1000000 // Give legacy entries lower priority
                      });
                    }
                  }
                } catch (e) {
                  console.warn('⚠️ Error parsing cache entry:', key, e);
                }
              }
            }
            
            // Sort by timestamp (most recent first) and use the most recent one
            if (cacheEntries.length > 0) {
              const mostRecent = cacheEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
              setDirectCachedResults(mostRecent.data.results);
              
              // Update the URL with the recovered search parameters if available
              if (mostRecent.data.__queryParams) {
                const params = mostRecent.data.__queryParams;
                const newTitles = params.jobTitles.join(',');
                const newCompanies = params.companies.join(',');
                if (newTitles || newCompanies) {
                  const newUrl = `/results?titles=${encodeURIComponent(newTitles)}&companies=${encodeURIComponent(newCompanies)}`;
                  window.history.replaceState(null, '', newUrl);
                }
              }
              
              return true;
            }
          }
          
          return false;
        } catch (e) {
          console.warn('⚠️ Error during cache recovery:', e);
          return false;
        }
      };
      
      const foundInCache = attemptCacheRecovery();
      
      // If not found in any cache and we have search params, try to refetch
      if (!foundInCache && hasSearchParams) {
        const timer = setTimeout(() => {
          refetch();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [titles, companies, isLoading, isFetching, error]); // More specific dependencies to avoid infinite loops
  
  // Reset the justCleared flag after a delay to allow cache recovery to work again
  React.useEffect(() => {
    if (justClearedRef.current) {
      const timer = setTimeout(() => {
        justClearedRef.current = false;
        setGlobalClearFlag(false); // Also reset the global clear flag
      }, 2000); // Wait 2 seconds before allowing cache recovery again
      
      return () => clearTimeout(timer);
    }
  }, [justClearedRef.current]);
  
  // Use React Query results, accumulated results, or direct localStorage results
  const finalResults = React.useMemo(() => {
    // If we just cleared, return empty array immediately
    if (justClearedRef.current) {
      return [];
    }
    
    // DIRECT BYPASS: Check localStorage directly since React Query seems to be failing
    let directAccumulatedResults: SearchResult[] = [];
    try {
      const stored = localStorage.getItem('df_accumulated_results');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.__timestamp && Array.isArray(parsed.results)) {
          directAccumulatedResults = parsed.results;
        } else if (Array.isArray(parsed)) {
          directAccumulatedResults = parsed;
        }
      }
    } catch (e) {
      console.warn('Error parsing accumulated results from localStorage:', e);
    }
    
    // Always prioritize accumulated results if they exist and we're in accumulated mode
    if (showAccumulated) {
      // First try React Query accumulated results
      if (accumulatedResults && accumulatedResults.length > 0) {
        return accumulatedResults;
      }
      // Fallback to direct localStorage accumulated results
      else if (directAccumulatedResults.length > 0) {
        return directAccumulatedResults;
      }
    }
    
    // If not showing accumulated, or no accumulated results, try current search results
    if (results && results.length > 0) {
      return results;
    }
    
    // Fallback to direct cached results
    if (directCachedResults && directCachedResults.length > 0) {
      return directCachedResults;
    }
    
    return [];
  }, [showAccumulated, accumulatedResults, results, directCachedResults, justClearedRef.current]);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set<string>());

  // COPILOT FIX BULK-ACTIONS: Helper to check if all results are selected
  const areAllResultsSelected = React.useCallback((keys: Set<string>, visibleResults: any[]) => {
    if (!visibleResults || visibleResults.length === 0) return false;
    if (keys.size !== visibleResults.length) return false;
    
    // Check if every result ID is in the selectedKeys
    return visibleResults.every(result => keys.has(result.id));
  }, []);

  // COPILOT FIX SORT: Replace sortDescriptor with our new sorting state
  type SortState = { key: keyof SearchResult | '__searchSource' | null; dir: 'asc' | 'desc' | null };
  // Default to newest first - use timestamp from __searchSource for chronological ordering
  const [sort, setSort] = React.useState<SortState>({ key: '__searchSource', dir: 'desc' });
  
  // COPILOT FIX SORT: Toggle sort function for column headers
  const toggleSort = (key: keyof SearchResult | '__searchSource') => {
    setSort(prev => {
      // If same column, cycle through: asc -> desc -> null
      if (prev.key === key) {
        if (prev.dir === 'asc') {
          return { key, dir: 'desc' };
        } else if (prev.dir === 'desc') {
          // For timestamp, we always keep sorting - just toggle direction
          if (key === '__searchSource') {
            return { key, dir: 'asc' };
          }
          // For other columns, we reset to default timestamp sort (newest first)
          return { key: '__searchSource', dir: 'desc' };
        }
      }
      // Different column or no previous sort, start with ascending
      return { key, dir: 'asc' };
    });
  };
  
  // State for the Save to List modal
  const [isSaveToListModalOpen, setIsSaveToListModalOpen] = React.useState(false);
  
  const rowsPerPage = 10;
   // Filter and sort the results
  const displayResults = React.useMemo(() => {
    // Start with a copy of the results array
    let filtered = [...finalResults];
    
    // Filter based on search query if needed
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(result => 
        (result.name || '').toLowerCase().includes(lowerQuery) ||
        (result.jobTitle || '').toLowerCase().includes(lowerQuery) ||
        (result.company || '').toLowerCase().includes(lowerQuery)
      );
    }
    
    // COPILOT FIX SORT: Improved sorting logic with type-specific comparisons
    const sorted = (() => {
      if (!sort.key) {
        // Default: newest first by timestamp
        return [...filtered].sort((a, b) => {
          const aTime = a.__searchSource?.timestamp ?? 0;
          const bTime = b.__searchSource?.timestamp ?? 0;
          return bTime - aTime; // newest first (COPILOT FIX SORT-DEFAULT)
        });
      }
      
      return [...filtered].sort((a, b) => {
        const { key, dir } = sort;
        
        // Special handling for __searchSource (use timestamp for sorting)
        if (key === '__searchSource') {
          const aTime = a.__searchSource?.timestamp ?? 0;
          const bTime = b.__searchSource?.timestamp ?? 0;
          return dir === 'asc' ? aTime - bTime : bTime - aTime;
        }
        
        const valA = a[key as keyof typeof a];
        const valB = b[key as keyof typeof b];
        
        // Numeric comparison (like confidence)
        if (typeof valA === 'number' && typeof valB === 'number') {
          return dir === 'asc' ? valA - valB : valB - valA;
        }
        
        // String fallback with null/undefined handling
        const strA = valA === null || valA === undefined ? '' : String(valA);
        const strB = valB === null || valB === undefined ? '' : String(valB);
        return dir === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    })();
    
    return sorted;
  }, [finalResults, searchQuery, sort]);

  // Handle pagination
  const totalPages = Math.max(1, Math.ceil(displayResults.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  // Get the current page of results
  const paginatedResults = React.useMemo(() => {
    const start = (safeCurrentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return displayResults.slice(start, end);
  }, [displayResults, safeCurrentPage, rowsPerPage]);
  
  // Handle export
  const handleExport = async (format: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "Export successful",
        description: `Your data has been exported as ${format.toUpperCase()}`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Export failed",
        description: "There was an error exporting your data. Please try again.",
        color: "danger"
      });
    }
  };
  
  // Handle CRM integration
  const handleCRMIntegration = async (crm: string) => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "Integration successful",
        description: `Your data has been sent to ${crm}`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Integration failed",
        description: `There was an error connecting to ${crm}. Please check your API settings.`,
        color: "danger"
      });
    }
  };
  
  // Handle opening the Save to List modal
  const handleOpenSaveToListModal = () => {
    setIsSaveToListModalOpen(true);
  };
  
  // Get selected prospects for saving to list
  const getSelectedProspects = (): SearchResult[] => {
    const selectedIds = Array.from(selectedKeys);
    return finalResults.filter(result => 
      selectedIds.includes(result.id || '')
    );
  };
  
  // COPILOT FIX BULK-ACTIONS: Handle bulk export of all selected results
  const handleExportSelected = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "Bulk export successful",
        description: `All selected items have been exported`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Bulk export failed",
        description: "There was an error exporting your data. Please try again.",
        color: "danger"
      });
    }
  };
  
  // COPILOT FIX EXP-XLSX: Handle bulk export of all selected results to Excel
  const handleExportSelectedExcel = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      addToast({
        title: "Excel export successful",
        description: `All selected items have been exported to Excel`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Excel export failed",
        description: "There was an error exporting your data to Excel. Please try again.",
        color: "danger"
      });
    }
  };
  
  // COPILOT FIX BULK-ACTIONS: Handle bulk save to list of all selected results
  const handleSaveSelectedToList = () => {
    // Just open the same modal, we already have the logic to get all selected prospects
    setIsSaveToListModalOpen(true);
    
    addToast({
      title: "Ready to save all prospects",
      description: `Select a list to save all ${selectedKeys.size} selected prospects`,
      color: "primary"
    });
  };
  // Handle chat start with selected prospect
  const handleChatStart = (prospect: SearchResult) => {
    // Store selected prospect data in sessionStorage for the chat page
    sessionStorage.setItem('selectedProspect', JSON.stringify(prospect));
    
    // Navigate to search page with chat mode enabled
    navigate('/search?mode=chat&prospect=' + encodeURIComponent(prospect.id || prospect.name));
    
    addToast({
      title: "Starting chat",
      description: `Opening chat with ${prospect.name}`,
      color: "success"
    });
  };

  // R-1: Reset to "Current Search" view whenever new search params are detected
  React.useEffect(() => {
    // When URL params change (new search), reset to Current Search view
    const hasSearchParams = searchParams.jobTitles.length > 0 || searchParams.companies.length > 0;
    if (hasSearchParams) {
      setShowAccumulated(false);
    } else {
      // If no search params (direct navigation to /results), show accumulated results
      setShowAccumulated(true);
    }
  }, [searchParams.jobTitles.join(','), searchParams.companies.join(',')]); // Stable dependency on search content

  // One-time cleanup of any existing mock data from localStorage
  React.useEffect(() => {
    const cleanupMockData = () => {
      try {
        // Check all localStorage keys for potential mock data
        const keysToCheck: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('df_') || key.includes('result') || key.includes('search'))) {
            keysToCheck.push(key);
          }
        }
        
        // Check each key for mock data patterns and remove if found
        keysToCheck.forEach(key => {
          try {
            const value = localStorage.getItem(key);
            if (value) {
              const parsed = JSON.parse(value);
              
              // Check if this looks like mock data (contains typical mock names/companies)
              const mockIndicators = ['Sarah Johnson', 'Michael Chen', 'Emily Rodriguez', 'David Kim', 'Jessica Taylor', 'Alex Wilson', 'Maria Garcia'];
              const isMockData = JSON.stringify(parsed).includes('Sarah Johnson') || 
                                JSON.stringify(parsed).includes('Michael Chen') ||
                                mockIndicators.some(indicator => JSON.stringify(parsed).includes(indicator));
              
              if (isMockData) {
                console.log(`🧹 Removing mock data from localStorage key: ${key}`);
                localStorage.removeItem(key);
              }
            }
          } catch (e) {
            // If parsing fails, just continue
          }
        });
      } catch (e) {
        console.warn('Error during mock data cleanup:', e);
      }
    };
    
    cleanupMockData();
  }, []); // Run only once on mount

  return (
    <div className={layoutStyles.sectionGap}>
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="z-10 w-full justify-start items-center shrink-0 overflow-inherit color-inherit subpixel-antialiased rounded-t-large p-6 flex flex-row items-center gap-4 flex-wrap">
          <div className="flex-1">
            <h2 className="text-xl font-bold">Search Results</h2>
            <p className="text-gray-500 text-sm">
              {showAccumulated 
                ? `Showing ${displayResults.length} total prospects from all searches`
                : `Showing ${displayResults.length} prospects from current search`
              }
            </p>
          </div>
          
          {/* COPILOT FIX CLEAR-BTN: Updated container with consistent gap and alignment */}
          <div className="action-buttons-container mr-2"> {/* COPILOT FIX CLEAR-BTN: Using our custom CSS class */}
            <div className="flex items-center gap-3">
              <span className={`text-sm inline-flex items-center transition-colors ${!showAccumulated ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                Current Search
              </span>
              <Switch
                isSelected={showAccumulated}
                onValueChange={(checked) => {
                  setShowAccumulated(checked);
                  if (checked) {
                    refetchAccumulated();
                  }
                }}
                size="sm"
                color="primary"
                className="my-0"
              />
              <span className={`text-sm inline-flex items-center transition-colors ${showAccumulated ? 'text-primary-600 font-medium' : 'text-gray-500'}`}>
                All Results
              </span>
            </div>
            
            <Button
              variant="flat"
              color="primary"
              size="sm"
              onPress={() => navigate("/search")}
              className={buttonStyles.actionButton}
              startContent={<Icon icon="lucide:search" />}
            >
              New Search
            </Button>
          </div>
          
          <Input
            placeholder="Search by name, job title, or company..."
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Icon icon="lucide:search" className="text-default-400" />}
            className="w-full sm:max-w-xs rounded-full my-0"
            size="sm"
          />
          
          {/* LOGOUT-FIX 5 - Enhanced Clear All Results button */}
          <Button
            variant="flat"
            size="sm"
            disabled={finalResults.length === 0}
            aria-disabled={finalResults.length === 0 ? "true" : "false"}
            className={`${buttonStyles.actionButton} ${finalResults.length === 0 ? 'is-disabled' : ''}`}
            onPress={async () => {
              if (finalResults.length === 0) return; // Safety check
              
              console.log('🧹 Clear All Results: Starting comprehensive cleanup...');
              
              // Set flag to prevent cache recovery immediately after clearing
              justClearedRef.current = true;
              
              // Set global flag to prevent mock data injection
              setGlobalClearFlag(true);
              
              // Clear direct cached results immediately
              setDirectCachedResults([]);
              
              // Clear React Query cache for current search results and accumulated results
              console.log('🧹 Clearing React Query cache...');
              queryClient.removeQueries({ queryKey: ['searchResults'] });
              queryClient.removeQueries({ queryKey: ['accumulatedResults'] });
              queryClient.clear(); // Clear all queries for good measure
              
              // Clear search cache function
              clearSearchCache();
              
              // Clear ALL possible localStorage keys related to results/searches
              console.log('🧹 Clearing localStorage...');
              const keysToRemove: string[] = [];
              for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && (
                  key.startsWith('df_results_cache_') || 
                  key.startsWith('df_') || 
                  key.includes('search') || 
                  key.includes('result') ||
                  key.includes('accumulated') ||
                  key.includes('cache')
                )) {
                  keysToRemove.push(key);
                }
              }
              keysToRemove.forEach(key => {
                console.log(`🧹 Removing localStorage key: ${key}`);
                localStorage.removeItem(key);
              });
              
              // Clear session storage items related to search results
              console.log('🧹 Clearing sessionStorage...');
              sessionStorage.removeItem('lastAddedCount');
              sessionStorage.removeItem('lastResultsUrl');
              sessionStorage.removeItem('selectedProspect');
              
              // Execute the mutation as well for consistency
              try {
                await clearAccumulatedMutation.mutateAsync();
                console.log('✅ Clear mutation completed');
              } catch (err) {
                console.warn('⚠️ Clear mutation failed (continuing):', err);
              }
              
              // Force refetch accumulated results to reflect empty state
              await refetchAccumulated();
              
              // Clear the selection
              setSelectedKeys(new Set());
              
              // Reset view to Current Search
              setShowAccumulated(false);
              
              console.log('✅ Clear All Results: Cleanup completed');
              
              addToast({
                title: "Cleared all results",
                description: "All saved results have been removed",
                color: "success"
              });
              
              // Clear URL params to prevent restoration
              navigate('/results', { replace: true });
            }}
            startContent={<Icon icon="lucide:trash-2" />}
          >
            Clear All Results
          </Button>
        </CardHeader>
      </Card>
      
      {/* COPILOT FIX #5: Added 16-24px vertical spacing between toolbar and table */}
      <div className={layoutStyles.searchToolbar.tableSpacer}></div>
      
      {displayResults.length > 0 ? (
        <ModernResultsTable 
          results={paginatedResults}
          selectedKeys={selectedKeys}
          onSelectionChange={(newSelectedKeys: any) => {
            // Handle different selection models with type assertion
            if (newSelectedKeys === "all") {
              // @heroui/react may use "all" string
              const allVisibleIds = new Set(paginatedResults.map(item => item.id));
              setSelectedKeys(allVisibleIds);
              return;
            } 
            
            // Handle Set object
            if (newSelectedKeys instanceof Set) {
              setSelectedKeys(newSelectedKeys);
              return;
            }
            
            // Handle Set-like object
            if (typeof newSelectedKeys === "object" && newSelectedKeys !== null) {
              if ("size" in newSelectedKeys && typeof newSelectedKeys.forEach === "function") {
                // It's a Set-like object
                const newSet = new Set<string>();
                try {
                  newSelectedKeys.forEach((key: string) => {
                    if (typeof key === "string") newSet.add(key);
                  });
                  setSelectedKeys(newSet);
                } catch (e) {
                  console.error("Error iterating over selection:", e);
                }
                return;
              }
              
              // Try to convert from object to Set
              try {
                const newSet = new Set<string>();
                if (Array.isArray(newSelectedKeys)) {
                  newSelectedKeys.forEach(key => {
                    if (typeof key === "string") newSet.add(key);
                  });
                } else {
                  Object.values(newSelectedKeys).forEach(key => {
                    if (typeof key === "string") newSet.add(key);
                  });
                }
                setSelectedKeys(newSet);
              } catch (e) {
                console.error("Failed to convert selection to Set:", e);
                setSelectedKeys(new Set());
              }
              return;
            }
            
            // Default: just use an empty set
            console.warn("Unhandled selection format:", newSelectedKeys);
            setSelectedKeys(new Set());
          }}
          currentPage={safeCurrentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          onExport={handleExport}
          onCrmIntegration={handleCRMIntegration}
          onChatStart={handleChatStart}
          onSaveToList={handleOpenSaveToListModal}
          // COPILOT REMOVE SEARCH-SOURCE-TAG: Removed showSearchSource prop
          onExportSelected={handleExportSelected} // COPILOT FIX BULK-ACTIONS: Added bulk export handler
          onSaveSelectedToList={handleSaveSelectedToList} // COPILOT FIX BULK-ACTIONS: Added bulk save handler
          // COPILOT FIX SORT: Add sort props to pass to the table
          sortState={sort}
          toggleSort={toggleSort}
          // COPILOT FIX XLSX-BTN: Removed onExportSelectedExcel since we're using direct utility function now
        />
      ) : (isLoading || isFetching) && !showAccumulated ? (
        // R-2 & R-3: Show loader only for Current Search mode, not accumulated results
        <Card className="shadow-sm">
          <CardBody className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-gray-500">Loading search results...</p>
            </div>
          </CardBody>
        </Card>
      ) : displayResults.length === 0 && showAccumulated && accumulatedLoading ? (
        // Loading state for accumulated results only when in All Results mode
        <Card className="shadow-sm">
          <CardBody className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-gray-500">Loading accumulated results...</p>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Card className="shadow-sm">
          <CardBody className="p-6 text-center text-gray-500">
            {error ? (
              <div className="flex flex-col items-center gap-2">
                <Icon icon="lucide:alert-circle" className="text-2xl text-danger" />
                <p>Failed to load search results</p>
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat"
                  onPress={() => window.location.reload()}
                >
                  Try Again
                </Button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <Icon icon="lucide:search-x" className="text-2xl text-gray-400" />
                <p>No search results found</p>
                <p className="text-sm text-gray-400">Try adjusting your search criteria or perform a new search</p>
                <Button 
                  size="sm" 
                  color="primary" 
                  variant="flat"
                  onPress={() => navigate("/search")}
                  startContent={<Icon icon="lucide:search" />}
                >
                  New Search
                </Button>
              </div>
            )}
          </CardBody>
        </Card>
      )}
      
      {/* Floating refine search button */}
      <motion.div 
        className="fixed bottom-6 right-6 z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
      >
        <Button
          isIconOnly
          color="primary"
          size="lg"
          className="rounded-full shadow-lg"
          onPress={() => navigate("/search")}
          aria-label="Refine search"
        >
          <Icon icon="lucide:filter" className="text-xl" />
        </Button>
      </motion.div>
      
      {/* COPILOT FIX CARD-GRID: Replace with new ProspectDetailsCard component */}
      {selectedKeys.size === 1 && (() => {
        const selectedId = Array.from(selectedKeys)[0];
        const selectedProspect = finalResults.find(r => r.id === selectedId);
        
        if (!selectedProspect) return null;
        
        return (
          <div className={layoutStyles.searchToolbar.detailsSpacer}>
            <ProspectDetailsCard prospect={selectedProspect} />
          </div>
        );
      })()}
      
      {/* Save to List Modal */}
      <SaveToListModal
        isOpen={isSaveToListModalOpen}
        onClose={() => setIsSaveToListModalOpen(false)}
        selectedProspects={getSelectedProspects()}
      />
    </div>
  );
}

