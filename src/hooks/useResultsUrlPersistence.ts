import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SearchParams {
  jobTitles: string[];
  companies: string[];
  jobLevels: string[];
  locations: string[];
  keywords: string[];
}

// Custom hook to manage URL state persistence for search results
export function useResultsUrlPersistence() {
  const location = useLocation();
  const navigate = useNavigate();

  // Save current URL to sessionStorage when on results page
  useEffect(() => {
    if (location.pathname === '/results' && location.search) {
      sessionStorage.setItem('lastResultsUrl', location.pathname + location.search);
      console.log('💾 Saved results URL to session:', location.pathname + location.search);
    }
  }, [location.pathname, location.search]);

  // Function to restore URL from session storage if needed
  const restoreUrlIfNeeded = () => {
    const params = new URLSearchParams(location.search);
    const titles = params.get("titles");
    const companies = params.get("companies");

    // If we're on results page but missing URL params, try to restore
    if (location.pathname === '/results' && (!titles && !companies)) {
      const savedUrl = sessionStorage.getItem('lastResultsUrl');
      if (savedUrl && savedUrl !== location.pathname + location.search) {
        console.log('🔄 Restoring results URL from session:', savedUrl);
        navigate(savedUrl, { replace: true });
        return true;
      }
    }
    return false;
  };

  // Function to recover search params from the most recent cache entry
  const recoverParamsFromCache = (): SearchParams | null => {
    try {
      // First try search history
      const history = JSON.parse(localStorage.getItem('df_search_history') || '[]');
      if (history.length > 0) {
        const mostRecent = history[0];
        console.log('🔍 Recovered params from search history:', mostRecent.params);
        return mostRecent.params;
      }

      // Then try scanning cache entries for the most recent one with metadata
      const cacheEntries: Array<{params: SearchParams, timestamp: number}> = [];
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('df_results_cache_')) {
          try {
            const storedItem = localStorage.getItem(key);
            if (storedItem) {
              const parsedItem = JSON.parse(storedItem);
              
              if (parsedItem && parsedItem.__timestamp && parsedItem.__queryParams) {
                cacheEntries.push({
                  params: parsedItem.__queryParams,
                  timestamp: parsedItem.__timestamp
                });
              }
            }
          } catch (e) {
            console.warn('⚠️ Error parsing cache entry for param recovery:', key, e);
          }
        }
      }

      if (cacheEntries.length > 0) {
        const mostRecent = cacheEntries.sort((a, b) => b.timestamp - a.timestamp)[0];
        console.log('🔍 Recovered params from cache metadata:', mostRecent.params);
        return mostRecent.params;
      }

      return null;
    } catch (e) {
      console.warn('⚠️ Error during param recovery:', e);
      return null;
    }
  };

  return {
    restoreUrlIfNeeded,
    recoverParamsFromCache
  };
}
