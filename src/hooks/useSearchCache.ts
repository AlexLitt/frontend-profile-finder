import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchTemplate } from '../components/ChatSearchPanel';
import { fetchProfiles, SearchResult } from '../api/profileSearch';
import { useEffect } from 'react';

// Global flag to prevent mock data injection after clearing
let globalClearFlag = false;

// Export function to set the clear flag
export const setGlobalClearFlag = (value: boolean) => {
  globalClearFlag = value;
};

// Define SearchParams interface here since it's not exported from ChatSearchPanel
export interface SearchParams {
  jobTitles: string[];
  companies: string[];
  jobLevels: string[];
  locations: string[];
  keywords: string[];
}

// Keys for different types of cached data
const queryKeys = {
  searchResults: 'searchResults',
  searchHistory: 'searchHistory',
  templates: 'templates',
  recentSearches: 'recentSearches'
} as const;

// Local storage keys
const storageKeys = {
  templates: 'df_search_templates',
  history: 'df_search_history',
  recentSearches: 'df_recent_searches',
  resultsCache: 'df_results_cache', // Consistent key for the results cache
  accumulatedResults: 'df_accumulated_results' // Key for accumulated results across searches
} as const;

export interface StoredSearch {
  id: string;
  params: SearchParams;
  timestamp: number;
  resultCount: number;
}

// Cleanup old cache entries
const cleanupOldCacheEntries = () => {
  try {
    // Find and clean up all keys with our cache prefix
    const keysToRemove: string[] = [];
    const now = Date.now();
    const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(storageKeys.resultsCache)) {
        try {
          const storedItem = localStorage.getItem(key);
          if (storedItem) {
            const metadata = JSON.parse(storedItem);
            if (metadata.__timestamp && (now - metadata.__timestamp > MAX_AGE)) {
              keysToRemove.push(key);
            }
          }
        } catch (e) {
          console.warn('⚠️ Error parsing cache item:', e);
          // If we can't parse it, it's probably corrupted, so remove it
          keysToRemove.push(key);
        }
      }
    }
    
    // Remove the old keys
    if (keysToRemove.length > 0) {
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  } catch (e) {
    console.warn('⚠️ Error during cache cleanup:', e);
  }
};

// Initialize local storage with empty arrays if not exists
const initializeStorage = () => {
  if (!localStorage.getItem(storageKeys.templates)) {
    localStorage.setItem(storageKeys.templates, JSON.stringify([]));
  }
  if (!localStorage.getItem(storageKeys.history)) {
    localStorage.setItem(storageKeys.history, JSON.stringify([]));
  }
  if (!localStorage.getItem(storageKeys.recentSearches)) {
    localStorage.setItem(storageKeys.recentSearches, JSON.stringify([]));
  }
  
  // Run cleanup once per session
  cleanupOldCacheEntries();
};

// Cache management functions
const getCacheKey = (params: SearchParams) => {
  // Create a stable cache key by sorting and serializing the params
  const sortedParams = {
    jobTitles: [...params.jobTitles].sort(),
    companies: [...params.companies].sort(),
    jobLevels: [...params.jobLevels].sort(),
    locations: [...params.locations].sort(),
    keywords: [...params.keywords].sort()
  };
  return [queryKeys.searchResults, JSON.stringify(sortedParams)];
};

// Get a consistent localStorage key for the same params
const getLocalStorageKey = (params: SearchParams): string => {
  // We use a simplified key for localStorage to avoid length issues
  const key = `${storageKeys.resultsCache}_${params.jobTitles.sort().join('_')}_${params.companies.sort().join('_')}`.toLowerCase();
  return key;
};

const isCacheStale = (lastFetch: number, staleTimeMs: number = 1000 * 60 * 10) => {
  return Date.now() - lastFetch > staleTimeMs;
};

// Enhanced cache validation
const validateCacheData = (data: any) => {
  // First check if it's an array
  if (!Array.isArray(data)) {
    console.warn('⚠️ Cache data is not an array:', data);
    return false;
  }
  
  // Empty arrays are valid (just no results)
  if (data.length === 0) {
    return true;
  }
  
  // Check that items have required properties
  const isValid = data.every(item => 
    item && 
    typeof item === 'object' && 
    typeof item.name === 'string' && 
    item.name.trim() !== ''
  );
  
  if (!isValid) {
    console.warn('⚠️ Cache data contains invalid items:', data);
  }
  
  return isValid;
};

// Functions to manage accumulated results
const getAccumulatedResults = (): SearchResult[] => {
  try {
    const stored = localStorage.getItem(storageKeys.accumulatedResults);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.__timestamp && Array.isArray(parsed.results)) {
        return parsed.results;
      }
      // Handle legacy format
      else if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('⚠️ Error reading accumulated results:', e);
  }
  return [];
};

const saveAccumulatedResults = (results: SearchResult[]) => {
  try {
    const dataToStore = {
      __timestamp: Date.now(),
      __version: '1.0',
      results: results
    };
    localStorage.setItem(storageKeys.accumulatedResults, JSON.stringify(dataToStore));
  } catch (e) {
    console.warn('⚠️ Error saving accumulated results:', e);
  }
};

const addToAccumulatedResults = (newResults: SearchResult[], searchParams: SearchParams) => {
  const existing = getAccumulatedResults();
  
  // Deduplicate by ID, name, or email
  const combined = [...existing];
  const existingIds = new Set(existing.map(r => r.id || `${r.name}_${r.email}`));
  
  let addedCount = 0;
  newResults.forEach(result => {
    const resultId = result.id || `${result.name}_${result.email}`;
    if (!existingIds.has(resultId)) {
      combined.push({
        ...result,
        // Add metadata about which search this came from
        __searchSource: {
          jobTitles: searchParams.jobTitles,
          companies: searchParams.companies,
          timestamp: Date.now()
        }
      });
      existingIds.add(resultId);
      addedCount++;
    }
  });
  
  
  if (addedCount > 0) {
    saveAccumulatedResults(combined);
  }
  
  return { combined, addedCount };
};

const clearAccumulatedResults = () => {
  localStorage.removeItem(storageKeys.accumulatedResults);
};

// Hook for managing search-related data
export function useSearchCache() {
  const queryClient = useQueryClient();

  // Initialize storage
  useEffect(() => {
    initializeStorage();
  }, []);

  // Fetch search results with caching
  const useSearchResults = (params: SearchParams) => {
    // Filter empty values from search params to ensure clean cache key
    const filteredParams: SearchParams = {
      jobTitles: params.jobTitles.filter(Boolean),
      companies: params.companies.filter(Boolean),
      jobLevels: params.jobLevels.filter(Boolean),
      locations: params.locations.filter(Boolean),
      keywords: params.keywords.filter(Boolean)
    };
    
    const cacheKey = getCacheKey(filteredParams);
    const cacheKeyString = JSON.stringify(cacheKey);
    
    // Create consistent localStorage cache key
    const localCacheKey = getLocalStorageKey(filteredParams);
    
    return useQuery({
      queryKey: cacheKey,
      queryFn: async () => {
        // If we just cleared, return empty results immediately
        if (globalClearFlag) {
          return [];
        }
        
        // Check if we have a direct localStorage cache hit first
        try {
          const storedData = localStorage.getItem(localCacheKey);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            
            // Check if this is the new format with metadata
            if (parsedData && parsedData.__timestamp && Array.isArray(parsedData.results)) {            // Check if the cache is too old (older than 24 hours)
            const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
            if (Date.now() - parsedData.__timestamp < MAX_AGE) {
              return parsedData.results;
            }
            } 
            // Fallback for old format without metadata
            else if (Array.isArray(parsedData) && validateCacheData(parsedData)) {
              return parsedData;
            }
          }
        } catch (e) {
          console.warn('⚠️ Error reading from localStorage:', e);
        }
        
        const titles = filteredParams.jobTitles.join(',');
        const companies = filteredParams.companies.join(',');
        
        // Check if we have any real search parameters
        if (!titles && !companies) {
          return [];
        }
        
        // Fetch results, with fallback to mock data if needed
        let results = [];
        
        try {
          results = await fetchProfiles({ titles, companies });
          
          // Ensure we got valid results
          if (!results || !Array.isArray(results)) {
            console.error('❌ Invalid results format:', results);
            results = []; // Ensure we have an array
          }
        } catch (fetchError) {
          console.error('❌ Error fetching profiles:', fetchError);
          
          // Mock data generation disabled - return empty results instead
          results = [];
        }
        
        // Validate cache data
        if (!validateCacheData(results)) {
          return [];
        }
        
        // Store in search history
        const search: StoredSearch = {
          id: Date.now().toString(),
          params: filteredParams,
          timestamp: Date.now(),
          resultCount: results.length
        };
        
        const history = JSON.parse(localStorage.getItem(storageKeys.history) || '[]');
        history.unshift(search);
        localStorage.setItem(storageKeys.history, JSON.stringify(history.slice(0, 50))); // Keep last 50 searches
        
        // Store results directly in localStorage as additional backup AND add to accumulated results
        try {
          // Add metadata to the stored results
          const dataToStore = {
            __timestamp: Date.now(),
            __version: '1.0',
            __queryParams: filteredParams,
            results: results
          };
          
          localStorage.setItem(localCacheKey, JSON.stringify(dataToStore));
          
          // Also add to accumulated results and invalidate the cache
          const { combined, addedCount } = addToAccumulatedResults(results, filteredParams);
          
          if (addedCount > 0) {
            // Invalidate the accumulated results query to trigger a refetch
            queryClient.invalidateQueries({ queryKey: ['accumulatedResults'] });
            
            // Store the count for potential notification
            sessionStorage.setItem('lastAddedCount', addedCount.toString());
          }
        } catch (e) {
          console.warn('⚠️ Error saving to localStorage:', e);
        }
        
        return results;
      },
      staleTime: 1000 * 60 * 10, // Results considered fresh for 10 minutes (increased from 5)
      gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour (increased from 30 minutes)
      enabled: true, // Always enabled - let the queryFn decide what to return
      refetchOnWindowFocus: false, // Don't refetch when window gains focus
      refetchOnMount: false, // Don't refetch on component mount if data exists
      retry: (failureCount, error) => {
        // Only retry on network errors, not on 400/500 errors
        if (error instanceof Error && error.message.includes('fetch')) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
    });
  };

  // Get search history
  const useSearchHistory = () => {
    return useQuery<StoredSearch[]>({
      queryKey: [queryKeys.searchHistory],
      queryFn: () => JSON.parse(localStorage.getItem(storageKeys.history) || '[]'),
      staleTime: Infinity, // History doesn't become stale
    });
  };

  // Save search template
  const useSaveTemplate = () => {
    return useMutation({
      mutationFn: async (template: SearchTemplate) => {
        const templates = JSON.parse(localStorage.getItem(storageKeys.templates) || '[]');
        templates.unshift(template);
        localStorage.setItem(storageKeys.templates, JSON.stringify(templates));
        return template;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.templates] });
      },
    });
  };

  // Get saved templates
  const useTemplates = () => {
    return useQuery<SearchTemplate[]>({
      queryKey: [queryKeys.templates],
      queryFn: () => JSON.parse(localStorage.getItem(storageKeys.templates) || '[]'),
      staleTime: Infinity, // Templates don't become stale
    });
  };

  // Delete template
  const useDeleteTemplate = () => {
    return useMutation({
      mutationFn: async (templateId: string) => {
        const templates = JSON.parse(localStorage.getItem(storageKeys.templates) || '[]');
        const filtered = templates.filter((t: SearchTemplate) => t.id !== templateId);
        localStorage.setItem(storageKeys.templates, JSON.stringify(filtered));
        return templateId;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.templates] });
      },
    });
  };

  // Get recent searches for quick access
  const useRecentSearches = (limit = 5) => {
    return useQuery<StoredSearch[]>({
      queryKey: [queryKeys.recentSearches],
      queryFn: () => {
        const history = JSON.parse(localStorage.getItem(storageKeys.history) || '[]');
        return history.slice(0, limit);
      },
      staleTime: 1000 * 60, // Revalidate every minute
    });
  };

  // Hook to get accumulated results from all searches
  const useAccumulatedResults = () => {
    return useQuery<SearchResult[]>({
      queryKey: ['accumulatedResults'],
      queryFn: () => {
        // If we just cleared, return empty results immediately
        if (globalClearFlag) {
          return [];
        }
        return getAccumulatedResults();
      },
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    });
  };

  // Mutation to clear accumulated results
  const useClearAccumulatedResults = () => {
    return useMutation({
      mutationFn: async () => {
        clearAccumulatedResults();
        return true;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accumulatedResults'] });
      },
    });
  };

  // Clear cache when needed (e.g., when data becomes stale)
  const clearSearchCache = (params?: SearchParams) => {
    if (params) {
      // Clear specific cache entry
      const cacheKey = getCacheKey(params);
      queryClient.removeQueries({ queryKey: cacheKey });
      
      // Also clear localStorage for this specific search
      const localStorageKey = getLocalStorageKey(params);
      localStorage.removeItem(localStorageKey);
    } else {
      // Clear all search results from React Query
      queryClient.removeQueries({ queryKey: [queryKeys.searchResults] });
      
      // Clear all localStorage cache entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(storageKeys.resultsCache)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };

  // Prefetch search results for performance - returns mock data if fetch fails in development
  const prefetchSearchResults = async (params: SearchParams) => {
    // Filter empty values to match the main search function
    const filteredParams: SearchParams = {
      jobTitles: params.jobTitles.filter(Boolean),
      companies: params.companies.filter(Boolean),
      jobLevels: params.jobLevels.filter(Boolean),
      locations: params.locations.filter(Boolean),
      keywords: params.keywords.filter(Boolean)
    };
    
    // Check if we have any valid search parameters
    const titles = filteredParams.jobTitles.join(',');
    const companies = filteredParams.companies.join(',');
    
    if (!titles && !companies) {
      return Promise.resolve([]);
    }
    
    try {
      const cacheKey = getCacheKey(filteredParams);
      
      // Create consistent localStorage cache key
      const localCacheKey = getLocalStorageKey(filteredParams);
      
      // Check if we already have this data in the cache
      const cachedData = queryClient.getQueryData(cacheKey);
      if (cachedData) {
        return Promise.resolve(cachedData);
      }
      
      // Check if we have direct localStorage cache
      try {
        const storedData = localStorage.getItem(localCacheKey);
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          
          // Check if this is the new format with metadata
          if (parsedData && parsedData.__timestamp && Array.isArray(parsedData.results)) {
            // Check if the cache is too old (older than 24 hours)
            const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
            if (Date.now() - parsedData.__timestamp < MAX_AGE) {
              // Set this in the query cache too
              queryClient.setQueryData(cacheKey, parsedData.results);
              return Promise.resolve(parsedData.results);
            }
          }          // Fallback for old format without metadata
          else if (Array.isArray(parsedData) && validateCacheData(parsedData)) {
            // Set this in the query cache too
            queryClient.setQueryData(cacheKey, parsedData);
            return Promise.resolve(parsedData);
          }
        }
      } catch (e) {
        console.warn('⚠️ Error reading from localStorage during prefetch:', e);
      }
      
      // Otherwise, actually prefetch the data
      return queryClient.fetchQuery({
        queryKey: cacheKey,
        queryFn: async () => {
          let results = [];
          
          try {
            results = await fetchProfiles({ titles, companies });
            
            // Ensure we got valid results
            if (!results || !Array.isArray(results)) {
              console.error('❌ Invalid results format from prefetch:', results);
              results = []; // Ensure we have an array
            }
          } catch (fetchError) {
            console.error('❌ Error fetching profiles:', fetchError);
            
            // Mock data generation disabled - return empty results instead
            results = [];
          }
          
          // Validate cache data (same as main hook)
          if (!validateCacheData(results)) {
            return [];
          }
          
          // Store in search history (same as main hook)
          const search: StoredSearch = {
            id: Date.now().toString(),
            params: filteredParams,
            timestamp: Date.now(),
            resultCount: results.length
          };
          
          const history = JSON.parse(localStorage.getItem(storageKeys.history) || '[]');
          history.unshift(search);
          localStorage.setItem(storageKeys.history, JSON.stringify(history.slice(0, 50))); // Keep last 50 searches
          
          // Store results directly in localStorage as additional backup AND add to accumulated results
          try {
            // Add metadata to the stored results
            const dataToStore = {
              __timestamp: Date.now(),
              __version: '1.0',
              __queryParams: filteredParams,
              results: results
            };
            
            localStorage.setItem(localCacheKey, JSON.stringify(dataToStore));
            
            // Also add to accumulated results and invalidate the cache
            const { combined, addedCount } = addToAccumulatedResults(results, filteredParams);
            
            if (addedCount > 0) {
              // Invalidate the accumulated results query to trigger a refetch
              queryClient.invalidateQueries({ queryKey: ['accumulatedResults'] });
              
              // Store the count for potential notification
              sessionStorage.setItem('lastAddedCount', addedCount.toString());
            }
          } catch (e) {
            console.warn('⚠️ Error saving to localStorage during prefetch:', e);
          }
          
          return results;
        },
        staleTime: 1000 * 60 * 10,
      }).catch(err => {
        console.error('❌ Prefetch query failed:', err);
        
        // Return empty array instead of rejecting to avoid breaking the UI
        return [];
      });
    } catch (err) {
      console.error('❌ Prefetch outer try/catch failed:', err);
      // Return empty array instead of rejecting to avoid breaking the UI
      return Promise.resolve([]);
    }
  };

  // Debug helper to inspect cache contents
  const debugCacheContents = () => {
    const cache = queryClient.getQueryCache();
    console.log('=== CACHE DEBUG ===');
    console.log('Cache object:', cache);
    
    // Get all queries from cache
    const allQueries = cache.getAll();
    console.log('Total cache entries:', allQueries.length);
    
    allQueries.forEach((query, index) => {
      console.log(`Query ${index}:`, {
        queryKey: query.queryKey,
        state: query.state.status,
        dataUpdatedAt: query.state.dataUpdatedAt,
        hasData: !!query.state.data,
        dataLength: Array.isArray(query.state.data) ? query.state.data.length : 'N/A'
      });
    });
    console.log('===================');
  };

  return {
    useSearchResults,
    useSearchHistory,
    useSaveTemplate,
    useTemplates,
    useDeleteTemplate,
    useRecentSearches,
    clearSearchCache,
    prefetchSearchResults,
    debugCacheContents, // Add debug function
    getLocalStorageKey, // Export the key function for direct access
    // Accumulated results functions
    useAccumulatedResults,
    useClearAccumulatedResults,
    getAccumulatedResults,
    addToAccumulatedResults,
    clearAccumulatedResults,
  };
}
