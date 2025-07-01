import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchTemplate } from '../components/ChatSearchPanel';
import { fetchProfiles, SearchResult } from '../api/profileSearch';
import { useEffect } from 'react';

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
  recentSearches: 'df_recent_searches'
} as const;

export interface StoredSearch {
  id: string;
  params: SearchParams;
  timestamp: number;
  resultCount: number;
}

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
    return useQuery({
      queryKey: [queryKeys.searchResults, params],
      queryFn: async () => {
        const titles = params.jobTitles.join(',');
        const companies = params.companies.join(',');
        const results = await fetchProfiles({ titles, companies });
        
        // Store in search history
        const search: StoredSearch = {
          id: Date.now().toString(),
          params,
          timestamp: Date.now(),
          resultCount: results.length
        };
        
        const history = JSON.parse(localStorage.getItem(storageKeys.history) || '[]');
        history.unshift(search);
        localStorage.setItem(storageKeys.history, JSON.stringify(history.slice(0, 50))); // Keep last 50 searches
        
        return results;
      },
      staleTime: 1000 * 60 * 5, // Results considered fresh for 5 minutes
      gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
      enabled: params.jobTitles.length > 0 || params.companies.length > 0, // Only run if we have search params
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

  return {
    useSearchResults,
    useSearchHistory,
    useSaveTemplate,
    useTemplates,
    useDeleteTemplate,
    useRecentSearches,
  };
}
