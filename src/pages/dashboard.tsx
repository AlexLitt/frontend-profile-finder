import React from "react";
import { useNavigate } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  Button,
  Chip,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";
import ModernDashboardCard from "../components/ModernDashboardCard";
import RecentSearches from "../components/RecentSearches";
import { SearchTemplate } from "../components/ChatSearchPanel";
import { useSearchCache, StoredSearch } from "../hooks/useSearchCache";

// Format date helper
const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Mock data for recent searches
const recentSearches = [
  {
    id: "search-1",
    query: "Marketing Directors at SaaS Companies",
    date: "2023-06-15T10:30:00Z",
    results: 42,
    filters: ["SaaS", "USA", "50-200 employees"]
  },
  {
    id: "search-2",
    query: "CTOs at Fintech Startups",
    date: "2023-06-12T14:20:00Z",
    results: 28,
    filters: ["Fintech", "Europe", "10-50 employees"]
  },
  {
    id: "search-3",
    query: "HR Managers at Enterprise Companies",
    date: "2023-06-10T09:15:00Z",
    results: 64,
    filters: ["Enterprise", "Global", "1000+ employees"]
  }
];

// Mock data for saved templates
const savedTemplates = [
  {
    id: "template-1",
    name: "SaaS Decision Makers",
    description: "Targets C-level and VP-level at SaaS companies",
    lastUsed: "2023-06-14T11:20:00Z"
  },
  {
    id: "template-2",
    name: "Startup Founders",
    description: "Finds founders and co-founders at early-stage startups",
    lastUsed: "2023-06-08T15:45:00Z"
  },
  {
    id: "template-3",
    name: "Enterprise IT Leaders",
    description: "IT Directors and CIOs at large enterprises",
    lastUsed: "2023-06-05T09:30:00Z"
  }
];

// Sample templates data
const sampleTemplates: SearchTemplate[] = [
  {
    id: "template-1",
    name: "SaaS Decision Makers",
    description: "CTOs at SaaS companies",
    params: {
      jobTitles: ["CTO", "VP Engineering", "Technical Director"],
      companies: ["Salesforce", "HubSpot", "Zendesk"],
      jobLevels: ["C-Level", "VP"],
      locations: ["Global"],
      keywords: ["cloud", "software architecture"]
    },
    lastUsed: new Date("2023-06-14T11:20:00Z")
  },
  {
    id: "template-2",
    name: "Startup Founders",
    description: "Founders at tech startups",
    params: {
      jobTitles: ["Founder", "Co-founder", "CEO"],
      companies: ["Stripe", "Notion", "Figma"],
      jobLevels: ["C-Level"],
      locations: ["United States", "Europe"],
      keywords: ["startup", "entrepreneur"]
    },
    lastUsed: new Date("2023-06-08T15:45:00Z")
  },
  {
    id: "template-3",
    name: "Enterprise IT Leaders",
    description: "IT Directors at large enterprises",
    params: {
      jobTitles: ["CIO", "IT Director", "Head of IT"],
      companies: ["IBM", "Oracle", "Microsoft", "SAP"],
      jobLevels: ["C-Level", "VP", "Director"],
      locations: ["Global"],
      keywords: ["enterprise architecture", "digital transformation"]
    },
    lastUsed: new Date("2023-06-05T09:30:00Z")
  }
];

export default function DashboardPage() {
  const { profile, user, isAdmin, isAuthenticated, refreshSession } = useAuth();
  const navigate = useNavigate();
  const { useSearchResults } = useSearchCache();
  const [showDebug, setShowDebug] = React.useState(false);

  // Handle recent search selection
  const handleRecentSearchSelect = (search: StoredSearch) => {
    const titles = search.params.jobTitles.join(",");
    const companies = search.params.companies.join(",");
    navigate(`/results?titles=${encodeURIComponent(titles)}&companies=${encodeURIComponent(companies)}`);
  };

  // Debug section for troubleshooting
  const DebugSection = () => (
    <Card className="mb-6 bg-yellow-50 border-yellow-200">
      <CardBody>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-yellow-800">Debug Information</h3>
          <Button 
            size="sm" 
            variant="flat" 
            color="warning"
            onClick={() => setShowDebug(!showDebug)}
          >
            {showDebug ? 'Hide' : 'Show'} Debug
          </Button>
        </div>
        {showDebug && (
          <div className="space-y-2 text-sm">
            <div><strong>Is Authenticated:</strong> {isAuthenticated ? 'Yes' : 'No'}</div>
            <div><strong>Is Admin:</strong> {isAdmin ? 'Yes' : 'No'}</div>
            <div><strong>User ID:</strong> {user?.id || 'None'}</div>
            <div><strong>User Email:</strong> {user?.email || 'None'}</div>
            <div><strong>Profile ID:</strong> {profile?.id || 'None'}</div>
            <div><strong>Profile Email:</strong> {profile?.email || 'None'}</div>
            <div><strong>Profile Role:</strong> {profile?.role || 'None'}</div>
            <div><strong>Profile isAdmin:</strong> {profile?.isAdmin ? 'Yes' : 'No'}</div>
            <div><strong>Subscription Plan:</strong> {profile?.subscription?.plan || 'None'}</div>
            <div><strong>Searches Remaining:</strong> {profile?.subscription?.searchesRemaining || 0}</div>
            <Button 
              size="sm" 
              color="primary" 
              onClick={refreshSession}
              className="mt-2"
            >
              Refresh Session
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );

  const stats = [
    {
      label: "Remaining Searches",
      value: profile?.subscription.searchesRemaining || 0,
      icon: "lucide:search",
      color: "primary" as const
    },
    {
      label: "Current Plan",
      value: profile?.subscription.plan.toUpperCase() || "FREE",
      icon: "lucide:zap",
      color: "success" as const
    },
    {
      label: "Recent Searches",
      value: recentSearches.length,
      icon: "lucide:history",
      color: "warning" as const
    }
  ];

  const handleTemplateSelect = (template: SearchTemplate) => {
    // TODO: Implement template selection
    console.log('Selected template:', template);
  };

  if (!profile) {
    return null;
  }

  const { plan, searchesRemaining } = profile.subscription;
  const totalSearches = plan === "free" ? 10 : plan === "pro" ? 100 : 500;
  const searchesUsed = totalSearches - searchesRemaining;
  const searchesPercentage = (searchesUsed / totalSearches) * 100;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Debug section */}
      <DebugSection />
      
      {/* Welcome section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.fullName || 'User'}
          </h1>
          <p className="text-gray-500 mt-1">
            Here's what's happening with your account
          </p>
        </div>
        <Button
          color="primary"
          startContent={<Icon icon="lucide:search" />}
          onPress={() => navigate("/search")}
        >
          New Search
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <ModernDashboardCard
            key={index}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
          />
        ))}
      </div>

      {/* Saved templates */}
      <Card className="shadow-soft overflow-hidden">
        <CardHeader className="flex justify-between items-center border-b border-gray-100">
          <h3 className="text-lg font-semibold">Saved Search Templates</h3>
          <Button 
            variant="light" 
            color="primary" 
            size="sm"
            onPress={() => navigate("/search")}
            startContent={<Icon icon="lucide:message-circle" />}
            className="rounded-full"
          >
            New Chat Search
          </Button>
        </CardHeader>
        <CardBody className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sampleTemplates.map((template) => (
              <Card 
                key={template.id} 
                isPressable
                onPress={() => handleTemplateSelect(template)}
                className="border border-gray-200 hover:border-primary-200 transition-colors"
              >
                <CardBody className="p-4">
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {template.params.jobTitles.slice(0, 2).map((title, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700"
                      >
                        {title}
                      </span>
                    ))}
                    {template.params.companies.slice(0, 2).map((company, i) => (
                      <span 
                        key={i} 
                        className="text-xs bg-primary-100 px-2 py-1 rounded-full text-primary-700"
                      >
                        {company}
                      </span>
                    ))}
                    {(template.params.jobTitles.length > 2 || template.params.companies.length > 2) && (
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700">
                        +{template.params.jobTitles.length + template.params.companies.length - 4} more
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400">
                    Last used: {formatDate(template.lastUsed)}
                  </p>
                </CardBody>
              </Card>
            ))}
          </div>
        </CardBody>
      </Card>
      
      {/* Recent searches */}
      <RecentSearches onSelectSearch={handleRecentSearchSelect} />
      
      {/* Quick tips */}
      <Card className="bg-primary-50 border border-primary-100 shadow-soft">
        <CardBody className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary-100 rounded-full">
              <Icon icon="lucide:lightbulb" className="text-xl text-primary-600" />
            </div>
            <div>
              <h4 className="font-semibold text-primary-700 mb-1">Pro Tip</h4>
              <p className="text-sm text-primary-700">
                Try our new chat search interface! Simply type natural language queries like 
                "Find CTOs at Tesla" or "Marketing Directors at SaaS companies" and let our AI assistant guide you.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}