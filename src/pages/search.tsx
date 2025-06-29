// src/pages/search.tsx
import React from "react";
import { useNavigate } from "react-router-dom";
import { addToast } from "@heroui/react";
import ChatSearchPanel, { SearchParams } from "../components/ChatSearchPanel";
import { fetchProfiles } from "../api/profileSearch";

// Simple spinner component for loading state
const Spinner: React.FC = () => (
  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
);

const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [results, setResults] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSearch = async (params: SearchParams) => {
    setIsLoading(true);
    try {
      console.log("Search params received:", params);
      
      // Ensure we have valid arrays before joining
      if (!Array.isArray(params.jobTitles) || !Array.isArray(params.companies)) {
        console.error("Invalid params received:", params);
        throw new Error("Invalid search parameters");
      }

      // Join arrays into comma-separated strings before calling API
      const titles = params.jobTitles.join(",");
      const companies = params.companies.join(",");
      
      console.log("Calling fetchProfiles with:", { titles, companies });
      const profiles = await fetchProfiles({ titles, companies });
      console.log("Received profiles:", profiles);
      
      addToast({
        title: "Starting search",
        description: "Redirecting to results page...",
        color: "success",
      });
      // Navigate to results page with search parameters
      navigate(`/results?titles=${encodeURIComponent(titles)}&companies=${encodeURIComponent(companies)}`);
    } catch (err) {
      console.error(err);
      addToast({
        title: "Search failed",
        description: "There was an error fetching profiles.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex">
      <ChatSearchPanel onSearch={handleSearch} />
      {/* Optionally show a spinner while loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Spinner />
        </div>
      )}
    </div>
  );
};

export default SearchPage;
