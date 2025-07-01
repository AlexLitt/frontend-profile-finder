// src/pages/search.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";
import ChatSearchPanel, { SearchParams } from "../components/ChatSearchPanel";
import { useSearchCache, StoredSearch } from "../hooks/useSearchCache";
import RecentSearches from "../components/RecentSearches";

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const { useSearchResults, useSaveTemplate, useTemplates } = useSearchCache();
  const [currentParams, setCurrentParams] = React.useState<SearchParams | null>(null);
  
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
    setCurrentParams(params);
    
    try {
      // Results will be fetched automatically through React Query
      addToast({
        title: "Starting search",
        description: "Redirecting to results page...",
        color: "success",
      });

      // Navigate to results page with search parameters
      const titles = params.jobTitles.join(",");
      const companies = params.companies.join(",");
      navigate(`/results?titles=${encodeURIComponent(titles)}&companies=${encodeURIComponent(companies)}`);
    } catch (err) {
      console.error(err);
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
      <ChatSearchPanel 
        onSearch={handleSearch} 
        templates={templates}
        isLoading={isLoading}
      />
      
      {/* Recent Searches Section */}
      <RecentSearches onSelectSearch={handleRecentSearchSelect} />
    </div>
  );
};

export default SearchPage;
