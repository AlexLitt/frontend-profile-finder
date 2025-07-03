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

  // Format date to readable string
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(new Date(timestamp));
  };

  if (recentSearches.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardBody className="p-4">
        <h3 className="text-md font-semibold mb-3 flex items-center gap-2">
          <Icon icon="lucide:history" className="text-gray-500" />
          Recent Searches
        </h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {recentSearches.map((search) => (
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
