import React from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  Button,
  addToast
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";
import ChatSearchPanel, { SearchTemplate } from "../components/ChatSearchPanel";

// Mock data for form options
const industries = [
  { value: "saas", label: "SaaS" },
  { value: "fintech", label: "Fintech" },
  { value: "healthcare", label: "Healthcare" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "education", label: "Education" },
  { value: "manufacturing", label: "Manufacturing" },
  { value: "retail", label: "Retail" },
  { value: "media", label: "Media & Entertainment" }
];

const locations = [
  { value: "us", label: "United States" },
  { value: "ca", label: "Canada" },
  { value: "uk", label: "United Kingdom" },
  { value: "eu", label: "Europe" },
  { value: "asia", label: "Asia" },
  { value: "aus", label: "Australia" },
  { value: "global", label: "Global" }
];

const companySizes = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1001-5000", label: "1001-5000 employees" },
  { value: "5001+", label: "5001+ employees" }
];

const jobLevels = [
  { value: "c-level", label: "C-Level" },
  { value: "vp", label: "VP" },
  { value: "director", label: "Director" },
  { value: "manager", label: "Manager" },
  { value: "individual", label: "Individual Contributor" }
];

// Mock template data
const searchTemplates = {
  "template-1": {
    name: "SaaS Decision Makers",
    companies: "Salesforce, HubSpot, Zendesk",
    jobTitles: "CTO, VP Engineering, Technical Director",
    industries: ["saas"],
    locations: ["us", "ca"],
    companySizes: ["201-500", "501-1000", "1001-5000"],
    jobLevels: ["c-level", "vp", "director"],
    keywords: "cloud, software architecture, technical leadership"
  },
  "template-2": {
    name: "Startup Founders",
    companies: "",
    jobTitles: "Founder, Co-founder, CEO",
    industries: ["saas", "fintech", "healthcare"],
    locations: ["us", "uk", "eu"],
    companySizes: ["1-10", "11-50"],
    jobLevels: ["c-level"],
    keywords: "startup, entrepreneur, seed funding, series A"
  },
  "template-3": {
    name: "Enterprise IT Leaders",
    companies: "IBM, Oracle, Microsoft, SAP",
    jobTitles: "CIO, IT Director, Head of IT",
    industries: ["manufacturing", "retail", "healthcare"],
    locations: ["global"],
    companySizes: ["1001-5000", "5001+"],
    jobLevels: ["c-level", "vp", "director"],
    keywords: "enterprise architecture, digital transformation, IT strategy"
  }
};

export default function SearchPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  
  const templateId = searchParams.get("template");
  const editTemplateId = searchParams.get("edit");
  const cloneSearchId = searchParams.get("clone");
  
  // Get template from location state if available
  const initialTemplate = location.state?.template as SearchTemplate | undefined;
  
  const [isLoading, setIsLoading] = React.useState(false);
  
  // Handle search submission from chat
  const handleSearch = async (params: any) => {
    setIsLoading(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Show success message
      addToast({
        title: "Search initiated",
        description: "Your search is being processed. You'll be redirected to results shortly.",
        color: "success"
      });
      
      // Redirect to results page
      navigate("/results");
    } catch (error) {
      addToast({
        title: "Search failed",
        description: "There was an error processing your search. Please try again.",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-6rem)]">
      <ChatSearchPanel 
        onSearch={handleSearch} 
        initialTemplate={initialTemplate}
      />
    </div>
  );
}