import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchTemplate } from '../components/ChatSearchPanel';
import { fetchProfiles, SearchResult } from '../api/profileSearch';
import { useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Global flag to prevent mock data injection after clearing
let globalClearFlag = false;

// Export function to set the clear flag
export const setGlobalClearFlag = (value: boolean) => {
  globalClearFlag = value;
};

// Helper to get current user ID
const getCurrentUserId = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user?.id;
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

// Local storage keys with user scoping
const getStorageKeys = (userId: string) => ({
  templates: `df_search_templates_${userId}`,
  history: `df_search_history_${userId}`,
  recentSearches: `df_recent_searches_${userId}`,
  resultsCache: `df_results_cache_${userId}`,
  accumulatedResults: `df_accumulated_results_${userId}`
});

export interface StoredSearch {
  id: string;
  params: SearchParams;
  timestamp: number;
  resultCount: number;
}

// Get a consistent cache key for a specific search
const getCacheKey = (params: SearchParams) => {
  return [
    queryKeys.searchResults,
    params.jobTitles.sort().join(','),
    params.companies.sort().join(','),
    params.jobLevels.sort().join(','),
    params.locations.sort().join(','),
    params.keywords.sort().join(',')
  ];
};

// Get a consistent localStorage key for a specific search
const getLocalStorageKey = async (params: SearchParams) => {
  const userId = await getCurrentUserId();
  if (!userId) return '';
  
  const keys = getStorageKeys(userId);
  return `${keys.resultsCache}_${params.jobTitles.sort().join('_')}_${params.companies.sort().join('_')}`.toLowerCase();
};

// Migrate any existing data from non-scoped keys to user-scoped keys
const migrateToUserScopedKeys = async (userId: string) => {
  const keys = getStorageKeys(userId);
  
  // Legacy keys to migrate
  const legacyKeys = {
    templates: 'df_search_templates',
    history: 'df_search_history',
    recentSearches: 'df_recent_searches',
    resultsCache: 'df_results_cache',
    accumulatedResults: 'df_accumulated_results'
  };

  // Migrate each type of data
  Object.entries(legacyKeys).forEach(([key, legacyKey]) => {
    try {
      const data = localStorage.getItem(legacyKey);
      if (data) {
        // Save to new user-scoped key
        localStorage.setItem(keys[key as keyof typeof keys], data);
        // Remove old non-scoped key
        localStorage.removeItem(legacyKey);
      }
    } catch (e) {
      console.warn(`⚠️ Error migrating ${key}:`, e);
    }
  });

  // Migrate any result cache entries
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('df_results_cache_') && !key.includes(userId)) {
      try {
        const data = localStorage.getItem(key);
        if (data) {
          const newKey = key.replace('df_results_cache_', keys.resultsCache + '_');
          localStorage.setItem(newKey, data);
          localStorage.removeItem(key);
        }
      } catch (e) {
        console.warn('⚠️ Error migrating cache entry:', e);
      }
    }
  }
};

// Cleanup old cache entries
const cleanupOldCacheEntries = async () => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const keys = getStorageKeys(userId);
    const keysToRemove: string[] = [];
    const now = Date.now();
    const MAX_AGE = 1000 * 60 * 60 * 24; // 24 hours
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(keys.resultsCache)) {
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
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
  } catch (e) {
    console.warn('⚠️ Error cleaning up cache:', e);
  }
};

// Initialize storage with empty arrays and migrate any legacy data
const initializeStorage = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  const keys = getStorageKeys(userId);
  
  // First migrate any existing data
  await migrateToUserScopedKeys(userId);
  
  // Then ensure all storage is initialized
  if (!localStorage.getItem(keys.templates)) {
    localStorage.setItem(keys.templates, JSON.stringify([]));
  }
  if (!localStorage.getItem(keys.history)) {
    localStorage.setItem(keys.history, JSON.stringify([]));
  }
  if (!localStorage.getItem(keys.recentSearches)) {
    localStorage.setItem(keys.recentSearches, JSON.stringify([]));
  }
};

// Validate cache data structure
const validateCacheData = (data: any): data is SearchResult[] => {
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
const getAccumulatedResults = async (): Promise<SearchResult[]> => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return [];
    
    const keys = getStorageKeys(userId);
    const stored = localStorage.getItem(keys.accumulatedResults);
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

const saveAccumulatedResults = async (results: SearchResult[]) => {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const keys = getStorageKeys(userId);
    const dataToStore = {
      __timestamp: Date.now(),
      __version: '1.0',
      results: results
    };
    localStorage.setItem(keys.accumulatedResults, JSON.stringify(dataToStore));
  } catch (e) {
    console.warn('⚠️ Error saving accumulated results:', e);
  }
};

const addToAccumulatedResults = async (newResults: SearchResult[], searchParams: SearchParams) => {
  const existing = await getAccumulatedResults();
  
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
    await saveAccumulatedResults(combined);
  }
  
  return { combined, addedCount };
};

const clearAccumulatedResults = async () => {
  const userId = await getCurrentUserId();
  if (!userId) return;
  
  const keys = getStorageKeys(userId);
  localStorage.removeItem(keys.accumulatedResults);
};

// Hook for managing search-related data
export function useSearchCache() {
  const queryClient = useQueryClient();

  // Initialize storage and cleanup on mount
  useEffect(() => {
    const init = async () => {
      await initializeStorage();
      await cleanupOldCacheEntries();
    };
    init();
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
    
    return useQuery({
      queryKey: cacheKey,
      queryFn: async () => {
        // If we just cleared, return empty results immediately
        if (globalClearFlag) {
          return [];
        }
        
        const titles = filteredParams.jobTitles.join(',');
        const companies = filteredParams.companies.join(',');
        
        // Check if we have any real search parameters
        if (!titles && !companies) {
          return [];
        }
        
        // Get local storage key for this search
        const localStorageKey = await getLocalStorageKey(filteredParams);
        if (!localStorageKey) return [];
        
        // Get user ID for storage scoping
        const userId = await getCurrentUserId();
        if (!userId) return [];
        const keys = getStorageKeys(userId);
        
        // Check if we have a direct localStorage cache hit first
        try {
          const storedData = localStorage.getItem(localStorageKey);
          if (storedData) {
            const parsedData = JSON.parse(storedData);
            
            // Check if this is the new format with metadata
            if (parsedData && parsedData.__timestamp && Array.isArray(parsedData.results)) {
              // Check if the cache is too old (older than 24 hours)
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
        
        // Fetch results
        let results = [];
        
        try {
          results = await fetchProfiles({ titles, companies });
          
          // Ensure we got valid results
          if (!results || !Array.isArray(results)) {
            console.error('❌ Invalid results format:', results);
            results = [];
          }
        } catch (fetchError) {
          console.error('❌ Error fetching profiles:', fetchError);
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
        
        const history = JSON.parse(localStorage.getItem(keys.history) || '[]');
        history.unshift(search);
        localStorage.setItem(keys.history, JSON.stringify(history.slice(0, 50))); // Keep last 50 searches
        
        // Store results directly in localStorage as additional backup AND add to accumulated results
        try {
          // Add metadata to the stored results
          const dataToStore = {
            __timestamp: Date.now(),
            __version: '1.0',
            __queryParams: filteredParams,
            results: results
          };
          
          localStorage.setItem(localStorageKey, JSON.stringify(dataToStore));
          
          // Also add to accumulated results and invalidate the cache
          const { combined, addedCount } = await addToAccumulatedResults(results, filteredParams);
          
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
      staleTime: 1000 * 60 * 10, // Results considered fresh for 10 minutes
      gcTime: 1000 * 60 * 60, // Keep in cache for 1 hour
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      retry: (failureCount, error) => {
        if (error instanceof Error && error.message.includes('fetch')) {
          return failureCount < 2;
        }
        return false;
      },
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    });
  };

  // Get search history
  const useSearchHistory = () => {
    return useQuery<StoredSearch[]>({
      queryKey: [queryKeys.searchHistory],
      queryFn: async () => {
        const userId = await getCurrentUserId();
        if (!userId) return [];
        
        const keys = getStorageKeys(userId);
        return JSON.parse(localStorage.getItem(keys.history) || '[]');
      },
      staleTime: Infinity,
    });
  };

  // Save search template
  const useSaveTemplate = () => {
    return useMutation({
      mutationFn: async (template: SearchTemplate) => {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('No user ID available');
        
        const keys = getStorageKeys(userId);
        const templates = JSON.parse(localStorage.getItem(keys.templates) || '[]');
        templates.unshift(template);
        localStorage.setItem(keys.templates, JSON.stringify(templates));
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
      queryFn: async () => {
        const userId = await getCurrentUserId();
        if (!userId) return [];
        
        const keys = getStorageKeys(userId);
        return JSON.parse(localStorage.getItem(keys.templates) || '[]');
      },
      staleTime: Infinity,
    });
  };

  // Delete template
  const useDeleteTemplate = () => {
    return useMutation({
      mutationFn: async (templateId: string) => {
        const userId = await getCurrentUserId();
        if (!userId) throw new Error('No user ID available');
        
        const keys = getStorageKeys(userId);
        const templates = JSON.parse(localStorage.getItem(keys.templates) || '[]');
        const filtered = templates.filter((t: SearchTemplate) => t.id !== templateId);
        localStorage.setItem(keys.templates, JSON.stringify(filtered));
        return templateId;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [queryKeys.templates] });
      },
    });
  };

  // Get recent searches
  const useRecentSearches = (limit = 5) => {
    return useQuery<StoredSearch[]>({
      queryKey: [queryKeys.recentSearches],
      queryFn: async () => {
        const userId = await getCurrentUserId();
        if (!userId) return [];
        
        const keys = getStorageKeys(userId);
        const history = JSON.parse(localStorage.getItem(keys.history) || '[]');
        return history.slice(0, limit);
      },
      staleTime: 1000 * 60,
    });
  };

  // Get accumulated results
  const useAccumulatedResults = () => {
    return useQuery<SearchResult[]>({
      queryKey: ['accumulatedResults'],
      queryFn: async () => {
        if (globalClearFlag) {
          return [];
        }
        return getAccumulatedResults();
      },
      staleTime: 1000 * 60 * 5,
      refetchOnWindowFocus: false,
    });
  };

  // Clear accumulated results
  const useClearAccumulatedResults = () => {
    return useMutation({
      mutationFn: async () => {
        await clearAccumulatedResults();
        return true;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['accumulatedResults'] });
      },
    });
  };

  // Clear search cache
  const clearSearchCache = async (params?: SearchParams) => {
    const userId = await getCurrentUserId();
    if (!userId) return;
    
    const keys = getStorageKeys(userId);
    
    if (params) {
      // Clear specific cache entry
      const cacheKey = getCacheKey(params);
      queryClient.removeQueries({ queryKey: cacheKey });
      
      // Also clear localStorage for this specific search
      const localStorageKey = await getLocalStorageKey(params);
      if (localStorageKey) {
        localStorage.removeItem(localStorageKey);
      }
    } else {
      // Clear all search results
      queryClient.removeQueries({ queryKey: [queryKeys.searchResults] });
      
      // Clear all localStorage cache entries for this user
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(keys.resultsCache)) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
    }
  };

  return {
    useSearchResults,
    useSearchHistory,
    useSaveTemplate,
    useTemplates,
    useDeleteTemplate,
    useRecentSearches,
    clearSearchCache,
    debugCacheContents: () => {
      const cache = queryClient.getQueryCache();
      console.log('=== CACHE DEBUG ===');
      console.log('Cache object:', cache);
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
    },
    getLocalStorageKey,
    useAccumulatedResults,
    useClearAccumulatedResults,
  };
}
