//

import React from "react";
import { Button, Input, Chip, Card, CardBody, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import SummaryCard from "./SummaryCard";
import SavedTemplatesModal from "./SavedTemplatesModal";
import JobTitleSelector from "./JobTitleSelector";
import { parseList } from "../api/profileSearch";

// Types for chat messages
type MessageType = "bot" | "user" | "system";

interface Message {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  timestamp: Date;
}

// Types for search parameters
export interface SearchParams {
  jobTitles: string[];
  companies: string[];
  jobLevels: string[];
  locations: string[];
  keywords: string[];
}

// Template interface
export interface SearchTemplate {
  id: string;
  name: string;
  description: string;
  params: SearchParams;
  lastUsed: Date;
}

// Props interface
interface ChatSearchPanelProps {
  onSearch: (params: SearchParams) => void;
  isLoading?: boolean;
  templates?: SearchTemplate[];
}

// Chat state machine states
type ChatState = 
  | "initial" 
  | "askJobTitleAndCompany" 
  | "askCompany"
  | "askJobLevel" 
  | "askLocation" 
  | "askKeywords" 
  | "confirmSummary"
  | "askSaveTemplate";

// Sample data for suggestions
const jobLevelSuggestions = ["C-Level", "VP", "Director", "Manager", "Any"];
const locationSuggestions = ["United States", "Europe", "Asia", "Global", "Remote"];

// Decision maker positions for the dropdown
const decisionMakerPositions = [
  { label: "Chief Executive Officer (CEO)", value: "CEO" },
  { label: "Chief Technology Officer (CTO)", value: "CTO" },
  { label: "Chief Information Officer (CIO)", value: "CIO" },
  { label: "Chief Financial Officer (CFO)", value: "CFO" },
  { label: "Chief Operating Officer (COO)", value: "COO" },
  { label: "Chief Marketing Officer (CMO)", value: "CMO" },
  { label: "Chief Product Officer (CPO)", value: "CPO" },
  { label: "Vice President of Engineering", value: "VP Engineering" },
  { label: "Vice President of Technology", value: "VP Technology" },
  { label: "Vice President of Product", value: "VP Product" },
  { label: "Vice President of Sales", value: "VP Sales" },
  { label: "Vice President of Marketing", value: "VP Marketing" },
  { label: "Director of Engineering", value: "Director Engineering" },
  { label: "Director of Technology", value: "Director Technology" },
  { label: "Director of Product", value: "Director Product" },
  { label: "Director of Sales", value: "Director Sales" },
  { label: "Director of Marketing", value: "Director Marketing" },
  { label: "Head of Engineering", value: "Head Engineering" },
  { label: "Head of Technology", value: "Head Technology" },
  { label: "Head of Product", value: "Head Product" },
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

const ChatSearchPanel: React.FC<ChatSearchPanelProps> = ({ onSearch, isLoading = false, templates = [] }) => {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [inputValue, setInputValue] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);
  const [chatState, setChatState] = React.useState<ChatState>("initial");
  const [searchParams, setSearchParams] = React.useState<SearchParams>({
    jobTitles: [],
    companies: [],
    jobLevels: [],
    locations: [],
    keywords: [],
  });
  const [showAdvancedFilters, setShowAdvancedFilters] = React.useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = React.useState(false);
  const [templateName, setTemplateName] = React.useState("");
  const [showSaveInput, setShowSaveInput] = React.useState(false);

  const messagesEndRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  React.useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize chat
  // Initialize chat only once when component mounts
  React.useEffect(() => {
    const initializeChat = async () => {
      if (templates.length > 0) {
        const initialTemplate = templates[0]; // Use the first template as the initial one
        setSearchParams(initialTemplate.params);
        setChatState("confirmSummary");
        setMessages([
          {
            id: `bot-${Date.now()}`,
            type: "bot",
            content: `I've loaded your "${initialTemplate.name}" template. Here's a summary of your search criteria:`,
            timestamp: new Date()
          },
          {
            id: `bot-${Date.now() + 1}`,
            type: "bot",
            content: (
              <div className="space-y-4">
                <SummaryCard 
                  searchParams={initialTemplate.params} 
                  onSearch={() => onSearch(initialTemplate.params)}
                  onEdit={handleEditCriteria}
                />
              </div>
            ),
            timestamp: new Date()
          }
        ]);
      } else {
        // Start fresh search
        setChatState("initial");
        setMessages([{
          id: `bot-${Date.now()}`,
          type: "bot",
          content: "What job title are you looking for?",
          timestamp: new Date()
        }]);
      }
    };

    initializeChat();
  }, [templates]);

  // Add a bot message
  const addBotMessage = (content: string | React.ReactNode) => {
    setIsTyping(true);
    
    // Simulate typing delay
    setTimeout(() => {
      setMessages(prev => [
        ...prev, 
        { 
          id: `bot-${Date.now()}`, 
          type: "bot", 
          content, 
          timestamp: new Date() 
        }
      ]);
      setIsTyping(false);
    }, 800);
  };

  // Add a user message
  const addUserMessage = (content: string | React.ReactNode) => {
    setMessages(prev => [
      ...prev, 
      { 
        id: `user-${Date.now()}`, 
        type: "user", 
        content, 
        timestamp: new Date() 
      }
    ]);
  };

  // Parse job title and company from input
  const parseJobTitleAndCompany = (input: string) => {
    // Simple regex to match "job title at company"
    const regex = /(.+)\s+at\s+(.+)/i;
    const match = input.match(regex);
    
    if (match) {
      const jobTitles = match[1].split(',').map(title => title.trim()).filter(Boolean);
      const companies = match[2].split(',').map(company => company.trim()).filter(Boolean);
      
      return { jobTitles, companies };
    }
    
    return null;
  };

  // Process user input based on current state
  const processUserInput = (input: string) => {
    if (!input.trim()) return;
    
    addUserMessage(input);
    setInputValue("");

    switch (chatState) {
      case "initial":
      case "askJobTitleAndCompany": {
        // Use parseList to robustly parse job titles
        const jobTitles = parseList(input);
        console.log("Parsed job titles:", jobTitles);
        setSearchParams(prev => ({ ...prev, jobTitles }));
        setTimeout(() => {
          addBotMessage("Which company or list of companies do you want to search? (e.g., Tesla, Netflix, Microsoft)");
          setChatState("askCompany");
        }, 500);
        break;
      }
      case "askCompany": {
        // Use parseList to robustly parse companies
        const companies = parseList(input);
        console.log("Parsed companies:", companies);
        const newParams = { ...searchParams, companies };
        console.log("Search params before API call:", newParams);
        setSearchParams(newParams);
        if (newParams.jobTitles.length > 0 && companies.length > 0) {
          addBotMessage(
            <div className="space-y-4">
              <p>Perfect! Here's a summary of your search criteria:</p>
              <SummaryCard 
                searchParams={newParams} 
                onSearch={() => onSearch(newParams)}
                onEdit={handleEditCriteria}
              />
            </div>
          );
          setChatState("confirmSummary");
        } else {
          addBotMessage("Please provide both a job title and a company to run the search.");
          setChatState("askJobTitleAndCompany");
        }
        break;
      }
      default:
        addBotMessage("I'm not sure how to process that. Let's start over. What job title are you looking for?");
        setChatState("askJobTitleAndCompany");
    }
  };

  // Handle suggestion chip clicks
  const handleSuggestionClick = (value: string, type: string) => {
    switch (type) {
      case "jobLevel":
        setInputValue(value);
        processUserInput(value);
        break;
      case "location":
        setInputValue(value);
        processUserInput(value);
        break;
      default:
        setInputValue(value);
    }
  };

  // Handle editing search criteria
  const handleEditCriteria = () => {
    addBotMessage("Let's update your search. Who are you looking for?");
    setChatState("askJobTitleAndCompany");
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    processUserInput(inputValue);
  };

  // Handle quick suggestion clicks
  const handleQuickSuggestion = (suggestion: string) => {
    setInputValue(suggestion);
    inputRef.current?.focus();
  };

  // Handle template selection
  const handleTemplateSelect = (template: SearchTemplate) => {
    setIsTemplateModalOpen(false);
    setSearchParams(template.params);
    
    addBotMessage(`I've loaded your "${template.name}" template. Here's a summary of your search criteria:`);
    
    setTimeout(() => {
      addBotMessage(
        <div className="space-y-4">
          <SummaryCard 
            searchParams={template.params} 
            onSearch={() => onSearch(template.params)}
            onEdit={handleEditCriteria}
          />
        </div>
      );
      setChatState("confirmSummary");
    }, 500);
  };

  // Handle saving template
  const handleSaveTemplate = () => {
    if (!templateName.trim()) return;
    
    const newTemplate: SearchTemplate = {
      id: `template-${Date.now()}`,
      name: templateName,
      description: `${searchParams.jobTitles.join(', ')} at ${searchParams.companies.join(', ')}`,
      params: searchParams,
      lastUsed: new Date()
    };
    
    addBotMessage(`Great! I've saved "${templateName}" as a template for future use.`);
    setTemplateName("");
    setShowSaveInput(false);
  };

  return (
    <Card className="h-full flex flex-col shadow-card overflow-hidden">
      <CardBody className="p-0 flex flex-col h-full">
        {/* Chat header */}
        <div className="p-4 border-b bg-white flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center">
            <Icon icon="lucide:message-circle" className="mr-2 text-primary-500" />
            Search Assistant
          </h2>
          <Button
            isIconOnly
            variant="light"
            onPress={() => setIsTemplateModalOpen(true)}
            aria-label="Saved templates"
            className="rounded-full"
          >
            <Icon icon="lucide:bookmark" className="text-lg text-primary-500" />
          </Button>
        </div>

        {/* Messages container */}
        <div 
          id="chatMessages" 
          className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50"
        >
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`chat-message chat-message-${message.type} max-w-[85%] ${
                message.type === "user" ? "ml-auto" : ""
              }`}
            >
              <div
                className={`rounded-2xl p-3 ${
                  message.type === "user"
                    ? "bg-primary-500 text-white"
                    : "bg-white shadow-soft"
                }`}
              >
                {message.content}
              </div>
            </motion.div>
          ))}
          
          {/* Template save input */}
          {showSaveInput && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="chat-message max-w-[85%]"
            >
              <div className="rounded-2xl p-3 bg-white shadow-soft">
                <p className="mb-2">Enter a name for your template:</p>
                <div className="flex gap-2">
                  <Input
                    size="sm"
                    placeholder="e.g., Marketing Directors at SaaS"
                    value={templateName}
                    onValueChange={setTemplateName}
                    className="flex-1"
                    autoFocus
                  />
                  <Button 
                    size="sm" 
                    color="primary"
                    onPress={handleSaveTemplate}
                    isDisabled={!templateName.trim()}
                  >
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
          
          {/* Typing indicator */}
          {isTyping && (
            <div className="chat-message max-w-[85%]">
              <div className="rounded-2xl p-3 bg-white shadow-soft inline-flex items-center">
                <span className="mr-2">Typing</span>
                <Spinner size="sm" color="primary" />
              </div>
            </div>
          )}
          
          {/* Invisible element to scroll to */}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick suggestions - temporarily hidden
        <div className="p-3 bg-white border-t">
          <div className="flex items-center mb-2">
            <Icon icon="lucide:lightbulb" className="text-amber-500 mr-2" />
            <span className="text-sm text-gray-500">Try saying:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            <Chip 
              size="sm" 
              variant="flat" 
              className="cursor-pointer"
              onClick={() => handleQuickSuggestion("CTOs at Tesla")}
            >
              "CTOs at Tesla"
            </Chip>
            <Chip 
              size="sm" 
              variant="flat" 
              className="cursor-pointer"
              onClick={() => handleQuickSuggestion("Product Managers at Netflix")}
            >
              "Product Managers at Netflix"
            </Chip>
            <Chip 
              size="sm" 
              variant="flat" 
              className="cursor-pointer"
              onClick={() => handleQuickSuggestion("Marketing Directors at SaaS companies")}
            >
              "Marketing Directors at SaaS companies"
            </Chip>
          </div>
        </div>
        */}

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            {(chatState === "initial" || chatState === "askJobTitleAndCompany") ? (
              <div className="w-full chat-message max-w-[85%]">
                <JobTitleSelector
                  onSelect={(selectedTitles) => {
                    setSearchParams(prev => ({ ...prev, jobTitles: selectedTitles }));
                    // Show selected titles in an outgoing message
                    addUserMessage(
                      <div className="bg-primary-500 text-white px-4 py-2 rounded-full text-sm inline-block">
                        {selectedTitles.join(", ")}
                      </div>
                    );
                    // Proceed to company selection
                    setTimeout(() => {
                      addBotMessage("Which company or list of companies do you want to search? (e.g., Tesla, Netflix, Microsoft)");
                      setChatState("askCompany");
                    }, 500);
                  }}
                />
              </div>
            ) : (
              <Input
                ref={inputRef}
                fullWidth
                placeholder={chatState === "askCompany" ? "Enter company names..." : "Type your message..."}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="rounded-full"
                aria-label="Chat message input"
                aria-owns="chatMessages"
                endContent={
                  <Button
                    isIconOnly
                    type="submit"
                    color="primary"
                    size="sm"
                    className="rounded-full"
                    aria-label="Send message"
                    isDisabled={!inputValue.trim() || isTyping}
                  >
                    <Icon icon="lucide:send" className="text-lg" />
                  </Button>
                }
              />
            )}
          </div>
        </form>
      </CardBody>

      {/* Saved Templates Modal */}
      <SavedTemplatesModal
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
        templates={templates}
        onSelect={handleTemplateSelect}
      />
    </Card>
  );
};

export default ChatSearchPanel;
