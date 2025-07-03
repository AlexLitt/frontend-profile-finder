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
import ModernResultsTable from "../components/ModernResultsTable";
import { useSearchCache } from "../hooks/useSearchCache";
import { useResultsUrlPersistence } from "../hooks/useResultsUrlPersistence";
import { debugLocalStorageCache } from "../utils/debugCache";
import SaveToListModal from "../components/SaveToListModal";


export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    useSearchResults, 
    debugCacheContents, 
    getLocalStorageKey, 
    useAccumulatedResults,
    useClearAccumulatedResults 
  } = useSearchCache();
  const { restoreUrlIfNeeded, recoverParamsFromCache } = useResultsUrlPersistence();

  // Try to restore URL if needed on component mount
  React.useEffect(() => {
    const restored = restoreUrlIfNeeded();
    if (restored) {
      console.log('🔄 URL restoration triggered, component will re-render');
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
        console.log('⚠️ Empty URL params detected, recovered from cache:', recovered);
        return recovered;
      }
    }
    
    return parsed;
  }, [titles, companies, location.search, recoverParamsFromCache]);

  // Fallback data for development
  const mockResults = React.useMemo(() => {
    if ((searchParams.jobTitles.length > 0 || searchParams.companies.length > 0) && 
        process.env.NODE_ENV === 'development') {
      // Create some basic mock data if needed
      return Array(5).fill(0).map((_, i) => ({
        id: `mock-${i}`,
        name: `Mock Person ${i+1}`,
        jobTitle: searchParams.jobTitles[0] || 'Developer',
        company: searchParams.companies[0] || 'Tech Company',
        email: `mock${i+1}@example.com`,
        phone: `555-000-${1000+i}`,
        linkedInUrl: `https://linkedin.com/in/mock-${i+1}`,
        confidence: 90 - (i * 5),
        snippet: `This is a mock result for ${searchParams.jobTitles[0] || 'Developer'} at ${searchParams.companies[0] || 'Tech Company'}.`
      }));
    }
    return [];
  }, [searchParams]);

  // State to store results from direct localStorage access if needed
  const [directCachedResults, setDirectCachedResults] = React.useState<SearchResult[]>([]);
  
  // State to toggle between showing all accumulated results vs only the last search results
  const [showAccumulated, setShowAccumulated] = React.useState(true);

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
      console.log('🔄 Auto-accumulating results:', results.length, 'items');
      
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
        console.log(`🔄 Auto-accumulated ${newResultsToAdd.length} new results (total: ${combined.length})`);
        
        // Trigger a refetch of accumulated results
        setTimeout(() => {
          refetchAccumulated();
        }, 100);
        
        // Store count for notification
        sessionStorage.setItem('lastAddedCount', newResultsToAdd.length.toString());
      }
    }
  }, [results, searchParams, refetchAccumulated]);

  // Debug logging to understand cache behavior
  React.useEffect(() => {
    console.log('=== RESULTS PAGE DEBUG ===');
    console.log('Raw URL:', window.location.href);
    console.log('Location search:', location.search);
    console.log('URL search params from URLSearchParams:', { 
      titles: new URLSearchParams(location.search).get("titles"),
      companies: new URLSearchParams(location.search).get("companies")
    });
    console.log('Extracted titles variable:', titles);
    console.log('Extracted companies variable:', companies);
    console.log('Parsed search params:', searchParams);
    console.log('Results from cache:', results);
    console.log('Accumulated results:', accumulatedResults);
    console.log('Direct localStorage results:', directCachedResults);
    console.log('Is loading:', isLoading);
    console.log('Is fetching:', isFetching);
    console.log('Is success:', isSuccess);
    console.log('Error:', error);
    
    // Debug accumulated results localStorage key
    const accumulatedKey = 'df_accumulated_results';
    const accumulatedStored = localStorage.getItem(accumulatedKey);
    console.log('🔍 Accumulated results localStorage key:', accumulatedKey);
    console.log('🔍 Accumulated results raw localStorage data:', accumulatedStored);
    if (accumulatedStored) {
      try {
        const parsed = JSON.parse(accumulatedStored);
        console.log('🔍 Accumulated results parsed data:', parsed);
      } catch (e) {
        console.log('🔍 Error parsing accumulated results:', e);
      }
    } else {
      console.log('🔍 No accumulated results found in localStorage, manually populating...');
      
      // Manually populate accumulated results from individual caches
      const allResults: SearchResult[] = [];
      const seenIds = new Set<string>();
      
      // Scan all localStorage keys for result caches
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
                  console.log(`🔍 Found ${parsedItem.results.length} results in cache key: ${key}`);
                  parsedItem.results.forEach((result: any) => {
                    const resultId = result.id || `${result.name}_${result.email}`;
                    if (!seenIds.has(resultId)) {
                      allResults.push({
                        ...result,
                        __searchSource: {
                          jobTitles: parsedItem.__queryParams?.jobTitles || [],
                          companies: parsedItem.__queryParams?.companies || [],
                          timestamp: parsedItem.__timestamp
                        }
                      });
                      seenIds.add(resultId);
                    }
                  });
                }
              }
            }
          } catch (e) {
            console.warn('⚠️ Error parsing cache entry:', key, e);
          }
        }
      }
      
      if (allResults.length > 0) {
        console.log(`🔄 Manually created accumulated results with ${allResults.length} items`);
        // Save to localStorage
        const dataToStore = {
          __timestamp: Date.now(),
          __version: '1.0',
          results: allResults
        };
        localStorage.setItem(accumulatedKey, JSON.stringify(dataToStore));
        
        // Trigger a refetch of accumulated results
        setTimeout(() => {
          refetchAccumulated();
        }, 100);
      }
    }
    
    // Determine if this was a cache hit or miss
    if (isSuccess && !isFetching && results?.length > 0) {
      console.log('🎯 Likely cache hit - data loaded without fetching');
    } else if (directCachedResults?.length > 0) {
      console.log('🎯 Direct localStorage cache hit - React Query cache failed but localStorage backup worked');
    } else if (isFetching) {
      console.log('🔄 Currently fetching - either cache miss or first load');
    } else if (isSuccess && results?.length === 0) {
      console.log('⚠️ Cache hit but empty results');
    } else if (error) {
      console.error('❌ Error fetching results:', error);
    }
    
    // Check if we have the right cache key
    const expectedCacheKey = JSON.stringify({
      jobTitles: searchParams.jobTitles.sort(),
      companies: searchParams.companies.sort(),
      jobLevels: searchParams.jobLevels.sort(),
      locations: searchParams.locations.sort(),
      keywords: searchParams.keywords.sort()
    });
    console.log('Expected cache key:', expectedCacheKey);
    
    // Debug cache contents
    debugCacheContents();
    
    // Debug localStorage cache
    debugLocalStorageCache();
    
    console.log('========================');
  }, [searchParams, results, directCachedResults, isLoading, isFetching, isSuccess, error, titles, companies, debugCacheContents, location.search]);
  
  // Try to recover results from localStorage if React Query cache fails OR if URL params are missing
  React.useEffect(() => {
    const hasSearchParams = searchParams.jobTitles.length > 0 || searchParams.companies.length > 0;
    const hasEmptyResults = results?.length === 0;
    const isNotFetching = !isFetching && !isLoading && !error;
    
    // Check if we have empty URL params but might have cached results from previous searches
    const hasEmptyUrlParams = !titles && !companies;
    
    if (isNotFetching && (hasEmptyResults || hasEmptyUrlParams)) {
      console.log('⚠️ Cache recovery triggered:', { 
        hasSearchParams, 
        hasEmptyResults, 
        hasEmptyUrlParams,
        titles,
        companies 
      });
      
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
                console.log('🎯 Retrieved results from localStorage metadata cache:', parsedData.results.length, 'items');
                setDirectCachedResults(parsedData.results);
                return true;
              } 
              else if (Array.isArray(parsedData) && parsedData.length > 0) {
                console.log('🎯 Retrieved results from localStorage legacy cache:', parsedData.length, 'items');
                setDirectCachedResults(parsedData);
                return true;
              }
            }
          }
          
          // If URL params are missing, try to find the most recent cache entry
          if (hasEmptyUrlParams) {
            console.log('🔍 URL params missing, scanning localStorage for recent cache entries...');
            
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
              console.log('🎯 Found most recent cache entry:', mostRecent.key, 'with', mostRecent.data.results.length, 'items');
              setDirectCachedResults(mostRecent.data.results);
              
              // Update the URL with the recovered search parameters if available
              if (mostRecent.data.__queryParams) {
                const params = mostRecent.data.__queryParams;
                const newTitles = params.jobTitles.join(',');
                const newCompanies = params.companies.join(',');
                if (newTitles || newCompanies) {
                  console.log('🔄 Restoring URL params from cache:', { titles: newTitles, companies: newCompanies });
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
        console.log('⚠️ No results found in any cache. Attempting to refetch from API...');
        const timer = setTimeout(() => {
          refetch();
        }, 1000);
        
        return () => clearTimeout(timer);
      }
    }
  }, [searchParams, results, isLoading, isFetching, error, refetch, titles, companies]);
  
  // Use React Query results, accumulated results, direct localStorage results, or mock data as fallbacks
  const finalResults = React.useMemo(() => {
    // Toggle controls whether to show all accumulated results or just the current search
    if (showAccumulated) {
      // Show all accumulated results from all searches
      if (accumulatedResults && accumulatedResults.length > 0) {
        console.log('✅ Using accumulated results from all searches:', accumulatedResults.length, 'items');
        return accumulatedResults;
      }
    } else {
      // Show only the current search results
      if (results && results.length > 0) {
        console.log('✅ Using results from current search only:', results.length, 'items');
        return results;
      }
      else if (directCachedResults && directCachedResults.length > 0) {
        console.log('✅ Using direct cached results from current search:', directCachedResults.length, 'items');
        return directCachedResults;
      }
    }
    
    // Fallback hierarchy
    // First priority: React Query cache results
    if (results && results.length > 0) {
      console.log('✅ Using results from React Query cache:', results.length, 'items');
      return results;
    } 
    // Second priority: Direct localStorage cache results
    else if (directCachedResults && directCachedResults.length > 0) {
      console.log('✅ Using results from direct localStorage cache:', directCachedResults.length, 'items');
      return directCachedResults;
    } 
    // Third priority: Mock data in development
    else if (mockResults.length > 0 && process.env.NODE_ENV === 'development') {
      console.log('⚠️ Using mock data as fallback');
      return mockResults;
    }
    // Fallback: empty array
    return [];
  }, [showAccumulated, accumulatedResults, results, directCachedResults, mockResults]);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set<string>());
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "confidence",
    direction: "descending"
  });
  
  // State for the Save to List modal
  const [isSaveToListModalOpen, setIsSaveToListModalOpen] = React.useState(false);
  
  const rowsPerPage = 10;
   // Filter and sort the results
  const displayResults = React.useMemo(() => {
    console.log("Starting display results calculation with", finalResults.length, "results");
    
    // Start with a copy of the results array
    let filtered = [...finalResults];
    console.log("Working with results array:", filtered);
    
    // Filter based on search query if needed
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(result => 
        (result.name || '').toLowerCase().includes(lowerQuery) ||
        (result.jobTitle || '').toLowerCase().includes(lowerQuery) ||
        (result.company || '').toLowerCase().includes(lowerQuery)
      );
      console.log("After search query filtering:", filtered.length, "results");
    }
    
    // Sort the filtered results
    const sorted = [...filtered].sort((a, b) => {
      const first = String(a[sortDescriptor.column as keyof typeof a] || '');
      const second = String(b[sortDescriptor.column as keyof typeof b] || '');
      const multiplier = sortDescriptor.direction === "ascending" ? 1 : -1;
      return first.localeCompare(second) * multiplier;
    });
    
    console.log("Final sorted results:", sorted.length, "results");
    return sorted;
  }, [results, searchQuery, sortDescriptor]);

  // Handle pagination
  const totalPages = Math.max(1, Math.ceil(displayResults.length / rowsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  // Get the current page of results
  const paginatedResults = React.useMemo(() => {
    console.log("Calculating pagination from", displayResults.length, "items");
    const start = (safeCurrentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const paginated = displayResults.slice(start, end);
    console.log("Paginated results:", paginated);
    return paginated;
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

  return (
    <div className="space-y-6">
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Search Results</h2>
              <p className="text-gray-500 text-sm">
                {showAccumulated 
                  ? `Showing ${displayResults.length} total prospects from all searches`
                  : `Showing ${displayResults.length} prospects from current search`
                }
              </p>
            </div>
            <div className="flex items-center gap-4">
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
                className="flex-row-reverse"
              >
                <span className="text-sm text-gray-600">All Results</span>
              </Switch>
              
              <Button
                variant="flat"
                color="primary"
                size="sm"
                onPress={() => navigate("/search")}
                className="px-4 py-2 rounded-lg h-10"
                startContent={<Icon icon="lucide:search" />}
              >
                New Search
              </Button>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4 items-start sm:items-center">
            <Input
              placeholder="Search by name, job title, or company..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="w-full sm:max-w-xs rounded-full"
              size="sm"
            />
            {accumulatedResults.length > 0 && (
              <Button
                variant="flat"
                color="warning"
                size="sm"
                isLoading={clearAccumulatedMutation.isPending}
                onPress={() => {
                  clearAccumulatedMutation.mutate(undefined, {
                    onSuccess: () => {
                      // Clear the accumulated results cache key
                      localStorage.removeItem('df_accumulated_results');
                      
                      // Also clear all individual result caches to ensure complete reset
                      const keysToRemove: string[] = [];
                      for (let i = 0; i < localStorage.length; i++) {
                        const key = localStorage.key(i);
                        if (key && key.startsWith('df_results_cache_')) {
                          keysToRemove.push(key);
                        }
                      }
                      keysToRemove.forEach(key => localStorage.removeItem(key));
                      
                      // Force refetch of accumulated results
                      refetchAccumulated();
                      
                      // Clear the current page results as well
                      setDirectCachedResults([]);
                      
                      addToast({
                        title: "Cleared all results",
                        description: "All saved results have been removed",
                        color: "success"
                      });
                      
                      // Navigate back to search page after clearing
                      setTimeout(() => {
                        navigate("/search");
                      }, 1000);
                    },
                    onError: () => {
                      addToast({
                        title: "Error",
                        description: "Failed to clear accumulated results",
                        color: "danger"
                      });
                    }
                  });
                }}
                startContent={<Icon icon="lucide:trash-2" />}
                className="rounded-full h-10 px-4"
              >
                Clear All Results
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>
      
      {displayResults.length > 0 ? (
        <ModernResultsTable 
          results={paginatedResults}
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
          currentPage={safeCurrentPage}
          onPageChange={setCurrentPage}
          totalPages={totalPages}
          onExport={handleExport}
          onCrmIntegration={handleCRMIntegration}
          onChatStart={handleChatStart}
          onSaveToList={handleOpenSaveToListModal}
          showSearchSource={showAccumulated}
        />
      ) : isLoading || accumulatedLoading ? (
        <Card className="shadow-sm">
          <CardBody className="p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
              <p className="text-gray-500">Loading search results...</p>
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
              "No results found"
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
      
      {/* Preview Card */}
      {selectedKeys.size === 1 && (
        <Card className="shadow-soft">
          <CardHeader>
            <h3 className="text-lg font-semibold">Prospect Details</h3>
          </CardHeader>
          <CardBody>
            {(() => {
              const selectedId = Array.from(selectedKeys)[0];
              const selectedProspect = results.find(r => r.id === selectedId);
              
              if (!selectedProspect) return null;
              
              return (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex-1">
                      <h4 className="text-xl font-bold">{selectedProspect.name}</h4>
                      <p className="text-gray-600">{selectedProspect.jobTitle} at {selectedProspect.company}</p>
                    </div>
                    <Chip 
                      color={selectedProspect.confidence > 90 ? "success" : selectedProspect.confidence > 80 ? "primary" : "warning"} 
                      variant="flat"
                      size="lg"
                      className="font-medium"
                    >
                      {selectedProspect.confidence}% Match
                    </Chip>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="text-sm font-semibold text-gray-500 mb-1">Contact Information</h5>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:mail" className="text-gray-400" />
                          <span>{selectedProspect.email}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:phone" className="text-gray-400" />
                          <span>{selectedProspect.phone}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Icon icon="logos:linkedin-icon" className="text-gray-400" />
                          <a 
                            href={selectedProspect.linkedInUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline"
                          >
                            LinkedIn Profile
                          </a>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="text-sm font-semibold text-gray-500 mb-1">AI-Generated Insights</h5>
                      <p className="text-gray-700">{selectedProspect.snippet}</p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </CardBody>
          <CardFooter>
            <div className="flex gap-2 ml-auto">
              <Button 
                variant="flat" 
                startContent={<Icon icon="lucide:download" />}
                onPress={() => handleExport("csv")}
                className="rounded-full"
              >
                Export
              </Button>
              <Button 
                color="primary" 
                startContent={<Icon icon="lucide:share-2" />}
                onPress={() => handleCRMIntegration("HubSpot")}
                className="rounded-full"
              >
                Send to CRM
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
      
      {/* Save to List Modal */}
      <SaveToListModal
        isOpen={isSaveToListModalOpen}
        onClose={() => setIsSaveToListModalOpen(false)}
        selectedProspects={getSelectedProspects()}
      />
    </div>
  );
}

