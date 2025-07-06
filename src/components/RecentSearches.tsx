import React from "react";
import { Card, CardBody, Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useSearchCache, StoredSearch } from "../hooks/useSearchCache";
import { useNavigate } from "react-router-dom";

interface RecentSearchesProps {
  onSelectSearch: (params: StoredSearch) => void;
}

const RecentSearches: React.FC<RecentSearchesProps> = ({ onSelectSearch }) => {
  const { useRecentSearches } = useSearchCache();
  const { data: recentSearches = [] } = useRecentSearches(10); // Fetch 10 to allow for scrolling
  const navigate = useNavigate();

  // Mock data for development/demo purposes when no real searches exist
  const mockSearches: StoredSearch[] = [
    {
      id: "mock-1",
      params: {
        jobTitles: ["Marketing Director", "VP Marketing"],
        companies: ["Salesforce", "HubSpot", "Zendesk"],
        jobLevels: ["VP", "Director"],
        locations: ["United States"],
        keywords: ["SaaS", "B2B"]
      },
      timestamp: Date.now() - 2 * 60 * 60 * 1000, // 2 hours ago
      resultCount: 42
    },
    {
      id: "mock-2", 
      params: {
        jobTitles: ["CTO", "VP Engineering"],
        companies: ["Stripe", "Notion", "Figma"],
        jobLevels: ["C-Level", "VP"],
        locations: ["San Francisco", "New York"],
        keywords: ["fintech", "startup"]
      },
      timestamp: Date.now() - 6 * 60 * 60 * 1000, // 6 hours ago
      resultCount: 28
    },
    {
      id: "mock-3",
      params: {
        jobTitles: ["HR Manager", "People Operations"],
        companies: ["Microsoft", "Google", "Apple"],
        jobLevels: ["Manager", "Director"],
        locations: ["Global"],
        keywords: ["enterprise", "talent"]
      },
      timestamp: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
      resultCount: 64
    }
  ];

  // Use real searches if available, otherwise show mock data for demo
  const displaySearches = recentSearches.length > 0 ? recentSearches : mockSearches;

  // Format date to readable string
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(timestamp));
  };

  if (displaySearches.length === 0) {
    return (
      <Card>
        <CardBody className="p-4">
          <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
            <Icon icon="lucide:history" className="text-gray-500" />
            Recent Searches
          </h3>
          <div className="text-center py-8">
            <Icon icon="lucide:search" className="text-4xl text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No recent searches yet</p>
            <p className="text-gray-400 text-xs mt-1">
              Start searching to see your recent activity here
            </p>
            <Button
              color="primary"
              size="sm"
              className="mt-4"
              startContent={<Icon icon="lucide:search" />}
              onPress={() => navigate("/search")}
            >
              Start Searching
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardBody className="p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Icon icon="lucide:history" className="text-gray-500" />
          Recent Searches
          {recentSearches.length === 0 && (
            <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
              Demo Data
            </span>
          )}
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {displaySearches.map((search) => (
            <motion.div
              key={search.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="border rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onSelectSearch(search)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm truncate">
                    {search.params.jobTitles.join(", ")}
                  </h4>
                  <p className="text-xs text-gray-500 truncate">
                    at {search.params.companies.join(", ")}
                  </p>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <span>{formatDate(search.timestamp)}</span>
                    <span>{search.resultCount} results</span>
                  </div>
                </div>
                <Button
                  isIconOnly
                  variant="light"
                  size="sm"
                  className="text-gray-500 flex-shrink-0"
                  onPress={() => {
                    const titles = search.params.jobTitles.join(",");
                    const companies = search.params.companies.join(",");
                    navigate(`/results?titles=${encodeURIComponent(titles)}&companies=${encodeURIComponent(companies)}`);
                  }}
                >
                  <Icon icon="lucide:arrow-right" className="text-sm" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      </CardBody>
    </Card>
  );
};

export default RecentSearches;
