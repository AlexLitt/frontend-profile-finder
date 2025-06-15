import React from "react";
import { Button, Input, Chip, Card, CardBody, Spinner } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import SummaryCard from "./SummaryCard";
import SavedTemplatesModal from "./SavedTemplatesModal";

// Types for chat messages
type MessageType = "bot" | "user" | "system";

interface Message {
  id: string;
  type: MessageType;
  content: string | React.ReactNode;
  timestamp: Date;
}

// Types for search parameters
interface SearchParams {
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

interface ChatSearchPanelProps {
  onSearch: (params: SearchParams) => void;
  initialTemplate?: SearchTemplate;
}

const ChatSearchPanel: React.FC<ChatSearchPanelProps> = ({ onSearch, initialTemplate }) => {
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
  const [templates, setTemplates] = React.useState<SearchTemplate[]>(sampleTemplates);
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
  React.useEffect(() => {
    // If there's an initial template, load it
    if (initialTemplate) {
      setSearchParams(initialTemplate.params);
      
      setTimeout(() => {
        addBotMessage(`I've loaded your "${initialTemplate.name}" template. Here's a summary of your search criteria:`);
        
        setTimeout(() => {
          addBotMessage(
            <div className="space-y-4">
              <SummaryCard 
                searchParams={initialTemplate.params} 
                onSearch={() => onSearch(initialTemplate.params)}
                onEdit={handleEditCriteria}
              />
            </div>
          );
          setChatState("confirmSummary");
        }, 500);
      }, 500);
    } else {
      // Add welcome message with slight delay to simulate chat
      setTimeout(() => {
        addBotMessage("👋 Hi! Who are you looking for? You can say something like 'CTOs at Tesla' or 'Product Managers at Netflix.'");
        setChatState("askJobTitleAndCompany");
      }, 500);
    }
  }, [initialTemplate]);

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
  const addUserMessage = (content: string) => {
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
      case "askJobTitleAndCompany": {
        const parsed = parseJobTitleAndCompany(input);
        
        if (parsed) {
          // Successfully parsed both job title and company
          setSearchParams(prev => ({
            ...prev,
            jobTitles: parsed.jobTitles,
            companies: parsed.companies
          }));
          
          setTimeout(() => {
            addBotMessage(
              <div>
                <p className="mb-2">Great! What job level are you looking for?</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {jobLevelSuggestions.map(level => (
                    <Chip 
                      key={level}
                      color="primary"
                      variant="flat"
                      className="cursor-pointer hover:bg-primary-100 transition-colors"
                      onClick={() => handleSuggestionClick(level, "jobLevel")}
                    >
                      {level}
                    </Chip>
                  ))}
                </div>
              </div>
            );
            setChatState("askJobLevel");
          }, 500);
        } else {
          // Could not parse, ask for job title first
          const jobTitles = input.split(',').map(title => title.trim()).filter(Boolean);
          setSearchParams(prev => ({ ...prev, jobTitles }));
          
          setTimeout(() => {
            addBotMessage("Which company or list of companies do you want to search? (e.g., Tesla, Netflix, Microsoft)");
            setChatState("askCompany");
          }, 500);
        }
        break;
      }

      case "askCompany": {
        const companies = input.split(',').map(company => company.trim()).filter(Boolean);
        setSearchParams(prev => ({ ...prev, companies }));
        
        setTimeout(() => {
          addBotMessage(
            <div>
              <p className="mb-2">What job level are you looking for?</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {jobLevelSuggestions.map(level => (
                  <Chip 
                    key={level}
                    color="primary"
                    variant="flat"
                    className="cursor-pointer hover:bg-primary-100 transition-colors"
                    onClick={() => handleSuggestionClick(level, "jobLevel")}
                  >
                    {level}
                  </Chip>
                ))}
              </div>
            </div>
          );
          setChatState("askJobLevel");
        }, 500);
        break;
      }

      case "askJobLevel": {
        const jobLevels = input.toLowerCase() === "any" 
          ? ["Any"] 
          : input.split(',').map(level => level.trim()).filter(Boolean);
        
        setSearchParams(prev => ({ ...prev, jobLevels }));
        
        setTimeout(() => {
          addBotMessage(
            <div>
              <p className="mb-2">Which region or country? (e.g., United States, Europe, or type 'Global')</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {locationSuggestions.map(location => (
                  <Chip 
                    key={location}
                    color="primary"
                    variant="flat"
                    className="cursor-pointer hover:bg-primary-100 transition-colors"
                    onClick={() => handleSuggestionClick(location, "location")}
                  >
                    {location}
                  </Chip>
                ))}
              </div>
            </div>
          );
          setChatState("askLocation");
        }, 500);
        break;
      }

      case "askLocation": {
        const locations = input.toLowerCase() === "global" 
          ? ["Global"] 
          : input.split(',').map(location => location.trim()).filter(Boolean);
        
        setSearchParams(prev => ({ ...prev, locations }));
        
        if (showAdvancedFilters) {
          setTimeout(() => {
            addBotMessage("Any specific keywords you'd like to include? (Optional)");
            setChatState("askKeywords");
          }, 500);
        } else {
          setTimeout(() => {
            addBotMessage(
              <div className="space-y-4">
                <p>Perfect! Here's a summary of your search criteria:</p>
                <SummaryCard 
                  searchParams={searchParams} 
                  onSearch={() => {
                    onSearch(searchParams);
                    setTimeout(() => {
                      addBotMessage(
                        <div>
                          <p>Would you like to save this search as a template for future use?</p>
                          <div className="flex gap-2 mt-2">
                            <Button 
                              color="primary" 
                              size="sm"
                              onPress={() => setShowSaveInput(true)}
                            >
                              Save as Template
                            </Button>
                            <Button 
                              variant="flat" 
                              size="sm"
                              onPress={() => addBotMessage("No problem! Your search is complete.")}
                            >
                              No, thanks
                            </Button>
                          </div>
                        </div>
                      );
                      setChatState("askSaveTemplate");
                    }, 1000);
                  }}
                  onEdit={handleEditCriteria}
                />
                <div className="flex justify-center">
                  <Button
                    variant="flat"
                    color="primary"
                    size="sm"
                    startContent={<Icon icon="lucide:sliders" />}
                    onPress={() => {
                      setShowAdvancedFilters(true);
                      addBotMessage("Any specific keywords you'd like to include? (Optional)");
                      setChatState("askKeywords");
                    }}
                  >
                    Add Keywords
                  </Button>
                </div>
              </div>
            );
            setChatState("confirmSummary");
          }, 500);
        }
        break;
      }

      case "askKeywords": {
        const keywords = input.split(',').map(keyword => keyword.trim()).filter(Boolean);
        setSearchParams(prev => ({ ...prev, keywords }));
        
        setTimeout(() => {
          addBotMessage(
            <div className="space-y-4">
              <p>Perfect! Here's a summary of your search criteria:</p>
              <SummaryCard 
                searchParams={{
                  ...searchParams,
                  keywords
                }} 
                onSearch={() => {
                  onSearch({
                    ...searchParams,
                    keywords
                  });
                  setTimeout(() => {
                    addBotMessage(
                      <div>
                        <p>Would you like to save this search as a template for future use?</p>
                        <div className="flex gap-2 mt-2">
                          <Button 
                            color="primary" 
                            size="sm"
                            onPress={() => setShowSaveInput(true)}
                          >
                            Save as Template
                          </Button>
                          <Button 
                            variant="flat" 
                            size="sm"
                            onPress={() => addBotMessage("No problem! Your search is complete.")}
                          >
                            No, thanks
                          </Button>
                        </div>
                      </div>
                    );
                    setChatState("askSaveTemplate");
                  }, 1000);
                }}
                onEdit={handleEditCriteria}
              />
            </div>
          );
          setChatState("confirmSummary");
        }, 500);
        break;
      }

      case "confirmSummary": {
        // Handle any additional input after confirmation
        if (input.toLowerCase().includes("search") || input.toLowerCase().includes("yes")) {
          addBotMessage("Starting your search now...");
          onSearch(searchParams);
          setTimeout(() => {
            addBotMessage(
              <div>
                <p>Would you like to save this search as a template for future use?</p>
                <div className="flex gap-2 mt-2">
                  <Button 
                    color="primary" 
                    size="sm"
                    onPress={() => setShowSaveInput(true)}
                  >
                    Save as Template
                  </Button>
                  <Button 
                    variant="flat" 
                    size="sm"
                    onPress={() => addBotMessage("No problem! Your search is complete.")}
                  >
                    No, thanks
                  </Button>
                </div>
              </div>
            );
            setChatState("askSaveTemplate");
          }, 1000);
        } else if (input.toLowerCase().includes("edit") || input.toLowerCase().includes("change")) {
          handleEditCriteria();
        } else if (input.toLowerCase().includes("keyword")) {
          setShowAdvancedFilters(true);
          addBotMessage("Any specific keywords you'd like to include? (Optional)");
          setChatState("askKeywords");
        } else {
          addBotMessage("Would you like to run this search, edit your criteria, or add keywords?");
        }
        break;
      }

      case "askSaveTemplate": {
        if (input.toLowerCase().includes("yes") || input.toLowerCase().includes("save")) {
          setShowSaveInput(true);
        } else {
          addBotMessage("No problem! Your search is complete.");
        }
        break;
      }

      default:
        addBotMessage("I'm not sure how to process that. Let's start over. Who are you looking for?");
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
    
    setTemplates(prev => [...prev, newTemplate]);
    setTemplateName("");
    setShowSaveInput(false);
    
    addBotMessage(`Great! I've saved "${templateName}" as a template for future use.`);
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

        {/* Quick suggestions */}
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

        {/* Input area */}
        <form onSubmit={handleSubmit} className="p-4 border-t bg-white">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              fullWidth
              placeholder="Type your message..."
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