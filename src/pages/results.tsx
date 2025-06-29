import React from "react";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  Input,
  Button,
  Chip,
  addToast
} from "@heroui/react";
import { fetchProfiles, SearchResult } from "../api/profileSearch";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import ModernResultsTable from "../components/ModernResultsTable";


export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation(); // <-- Add this line
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState<SearchResult[]>([]);

  // Get search params from URL
  const params = new URLSearchParams(location.search);
  const titles = params.get("titles") || "";
  const companies = params.get("companies") || "";

  // Fetch results when search params change
  React.useEffect(() => {
    async function getResults() {
      console.log("Starting search with params:", { titles, companies });
      setIsLoading(true);
      try {
        const data = await fetchProfiles({ titles, companies });
        console.log("Received profiles:", data);
        
        if (Array.isArray(data) && data.length > 0) {
          // Store the results directly
          console.log(`Setting ${data.length} profiles as results:`, data);
          setResults(data);
        } else {
          console.warn("No valid results received:", data);
          setResults([]);
        }
      } catch (e) {
        console.error("Error fetching results:", e);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }
    
    if (titles || companies) {
      getResults();
    } else {
      setResults([]); // Clear results if no search params
    }
  }, [titles, companies]);


  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set<string>());
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "confidence",
    direction: "descending"
  });
  
  const rowsPerPage = 10;
   // Filter and sort the results
  const displayResults = React.useMemo(() => {
    console.log("Starting display results calculation with", results.length, "results");
    
    // Start with a copy of the results array
    let filtered = [...results];
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
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle CRM integration
  const handleCRMIntegration = async (crm: string) => {
    setIsLoading(true);
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
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="shadow-sm overflow-hidden">
        <CardHeader className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold">Search Results</h2>
              <p className="text-gray-500 text-sm">
                Found {displayResults.length} prospects matching your criteria
              </p>
            </div>
            <Button
              color="primary"
              onPress={() => navigate("/search")}
              className="px-6 py-2 rounded-lg"
              startContent={<Icon icon="lucide:search" />}
            >
              New Search
            </Button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 mt-4">
            <Input
              placeholder="Search by name, job title, or company..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Icon icon="lucide:search" className="text-default-400" />}
              className="w-full sm:max-w-xs rounded-full"
            />
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
        />
      ) : (
        <Card className="shadow-sm">
          <CardBody className="p-6 text-center text-gray-500">
            No results found
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
    </div>
  );
}

