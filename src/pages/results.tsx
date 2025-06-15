import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  Input,
  Button,
  Chip,
  addToast
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import ModernResultsTable from "../components/ModernResultsTable";

// Mock data for search results
const generateMockResults = () => {
  const companies = ["Acme Inc", "TechCorp", "Global Solutions", "Innovate Labs", "Future Systems", "DataWorks", "CloudNine", "Apex Software"];
  const firstNames = ["John", "Sarah", "Michael", "Emma", "David", "Jennifer", "Robert", "Lisa", "James", "Jessica"];
  const lastNames = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Miller", "Davis", "Garcia", "Rodriguez", "Wilson"];
  const jobTitles = [
    "Chief Technology Officer", 
    "VP of Engineering", 
    "Director of Product", 
    "Head of Marketing", 
    "Chief Revenue Officer",
    "VP of Sales",
    "Engineering Manager",
    "Product Manager",
    "Marketing Director",
    "Sales Director"
  ];
  
  return Array.from({ length: 50 }, (_, i) => ({
    id: `prospect-${i + 1}`,
    name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`,
    jobTitle: jobTitles[Math.floor(Math.random() * jobTitles.length)],
    company: companies[Math.floor(Math.random() * companies.length)],
    linkedInUrl: `https://linkedin.com/in/user-${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `+1 ${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 900) + 100}-${Math.floor(Math.random() * 9000) + 1000}`,
    snippet: "This prospect has 10+ years of experience in the industry and has been with their current company for 3 years. They previously worked at Fortune 500 companies and have a strong background in technology leadership.",
    confidence: Math.floor(Math.random() * 30) + 70 // 70-99%
  }));
};

const mockResults = generateMockResults();

export default function ResultsPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [results, setResults] = React.useState(mockResults);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [currentPage, setCurrentPage] = React.useState(1);
  const [selectedKeys, setSelectedKeys] = React.useState(new Set<string>());
  const [sortDescriptor, setSortDescriptor] = React.useState({
    column: "confidence",
    direction: "descending"
  });
  
  const rowsPerPage = 10;
  
  // Filter results based on search query
  const filteredResults = React.useMemo(() => {
    if (!searchQuery.trim()) return results;
    
    const lowerQuery = searchQuery.toLowerCase();
    return results.filter(
      result => 
        result.name.toLowerCase().includes(lowerQuery) ||
        result.jobTitle.toLowerCase().includes(lowerQuery) ||
        result.company.toLowerCase().includes(lowerQuery)
    );
  }, [results, searchQuery]);
  
  // Sort results
  const sortedResults = React.useMemo(() => {
    return [...filteredResults].sort((a, b) => {
      const first = a[sortDescriptor.column as keyof typeof a];
      const second = b[sortDescriptor.column as keyof typeof b];
      
      if (first === second) return 0;
      
      if (sortDescriptor.direction === "ascending") {
        return first < second ? -1 : 1;
      } else {
        return first > second ? -1 : 1;
      }
    });
  }, [filteredResults, sortDescriptor]);
  
  // Paginate results
  const paginatedResults = React.useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    return sortedResults.slice(start, end);
  }, [sortedResults, currentPage]);
  
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
                Found {filteredResults.length} prospects matching your criteria
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
      
      <ModernResultsTable 
        results={paginatedResults}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        totalPages={Math.ceil(filteredResults.length / rowsPerPage)}
        onExport={handleExport}
        onCrmIntegration={handleCRMIntegration}
      />
      
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