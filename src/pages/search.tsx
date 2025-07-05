// src/pages/search.tsx
import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { addToast } from "@heroui/react";
import { Icon } from "@iconify/react";
import ChatSearchPanel, { SearchParams } from "../components/ChatSearchPanel";
import { useSearchCache, StoredSearch } from "../hooks/useSearchCache";

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { 
    useSearchResults, 
    useSaveTemplate, 
    useTemplates, 
    prefetchSearchResults,
    clearSearchCache 
  } = useSearchCache();
  const [currentParams, setCurrentParams] = React.useState<SearchParams | null>(null);
  
  // Check if we're in chat mode with a selected prospect
  const urlParams = new URLSearchParams(location.search);
  const chatMode = urlParams.get('mode') === 'chat';
  const prospectId = urlParams.get('prospect');
  const [selectedProspect, setSelectedProspect] = React.useState<any>(null);
  
  // Load selected prospect from session storage if in chat mode
  React.useEffect(() => {
    if (chatMode && prospectId) {
      const storedProspect = sessionStorage.getItem('selectedProspect');
      if (storedProspect) {
        try {
          setSelectedProspect(JSON.parse(storedProspect));
        } catch (e) {
          console.error('Error parsing selected prospect:', e);
        }
      }
    }
  }, [chatMode, prospectId]);
  
  // Get templates for suggestions
  const { data: templates = [] } = useTemplates();
  
  // Set up the search query
  const { data: results, isLoading, error } = useSearchResults(currentParams ?? {
    jobTitles: [],
    companies: [],
    jobLevels: [],
    locations: [],
    keywords: []
  });

  const handleSearch = async (params: SearchParams) => {
    // Filter out empty values and normalize search params
    const filteredParams = {
      jobTitles: params.jobTitles.filter(Boolean).map(t => t.trim()),
      companies: params.companies.filter(Boolean).map(c => c.trim()),
      jobLevels: params.jobLevels.filter(Boolean).map(l => l.trim()),
      locations: params.locations.filter(Boolean).map(l => l.trim()),
      keywords: params.keywords.filter(Boolean).map(k => k.trim())
    };
    
    // Update current params state with filtered params
    setCurrentParams(filteredParams);
    
    try {
      // Check if we have any search terms
      if (filteredParams.jobTitles.length === 0 && filteredParams.companies.length === 0) {
        addToast({
          title: "Search error",
          description: "Please enter at least one job title or company",
          color: "danger",
        });
        return;
      }
      
      // Show loading toast
      addToast({
        title: "Starting search",
        description: "Preparing results...",
        color: "primary",
      });
      
      // Log the cleaned search params
      
      // Force reset any existing cache for these params
      clearSearchCache(filteredParams);
      
      // Prefetch results before navigating
      try {
        const prefetchResult = await prefetchSearchResults(filteredParams);
      } catch (prefetchErr) {
        // Continue anyway - the results page will handle the fetch
      }

      // Navigate to results page with search parameters
      const titles = filteredParams.jobTitles.join(",");
      const companies = filteredParams.companies.join(",");
      
      // Add a longer delay to ensure the prefetch completes and data is properly saved
      setTimeout(() => {
        navigate(`/results?titles=${encodeURIComponent(titles)}&companies=${encodeURIComponent(companies)}`);
        
        addToast({
          title: "Search complete",
          description: "Showing search results",
          color: "success",
        });
      }, 1000); // Increased delay to 1 second for more reliable cache saving
    } catch (err) {
      console.error('❌ Search/prefetch failed:', err);
      addToast({
        title: "Search failed",
        description: "There was an error fetching profiles.",
        color: "danger",
      });
    }
  };

  const handleRecentSearchSelect = (search: StoredSearch) => {
    handleSearch(search.params);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Show chat mode indicator if applicable */}
      {chatMode && selectedProspect && (
        <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Icon icon="lucide:message-circle" className="text-primary-600" />
            </div>
            <div>
              <h3 className="font-medium text-primary-900">Chat Mode</h3>
              <p className="text-sm text-primary-700">
                Starting chat with <strong>{selectedProspect.name}</strong> - {selectedProspect.jobTitle} at {selectedProspect.company}
              </p>
            </div>
          </div>
        </div>
      )}
      
      <ChatSearchPanel 
        onSearch={handleSearch} 
        templates={templates}
        isLoading={isLoading}
      />
    </div>
  );
};

export default SearchPage;
