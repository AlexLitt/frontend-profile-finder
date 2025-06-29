import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Input, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from 'react-intersection-observer';

interface JobTitleOption {
  label: string;
  value: string;
  category: 'C-Suite' | 'VP' | 'Director' | 'Head' | 'Other';
}

interface JobTitleSelectorProps {
  onSelect: (titles: string[]) => void;
}

const jobTitles: JobTitleOption[] = [
  // C-Suite
  { label: "Chief Executive Officer (CEO)", value: "CEO", category: "C-Suite" },
  { label: "Chief Technology Officer (CTO)", value: "CTO", category: "C-Suite" },
  { label: "Chief Information Officer (CIO)", value: "CIO", category: "C-Suite" },
  { label: "Chief Financial Officer (CFO)", value: "CFO", category: "C-Suite" },
  { label: "Chief Operating Officer (COO)", value: "COO", category: "C-Suite" },
  { label: "Chief Marketing Officer (CMO)", value: "CMO", category: "C-Suite" },
  { label: "Chief Product Officer (CPO)", value: "CPO", category: "C-Suite" },
  
  // VPs
  { label: "VP of Engineering", value: "VP Engineering", category: "VP" },
  { label: "VP of Technology", value: "VP Technology", category: "VP" },
  { label: "VP of Product", value: "VP Product", category: "VP" },
  { label: "VP of Sales", value: "VP Sales", category: "VP" },
  { label: "VP of Marketing", value: "VP Marketing", category: "VP" },
  
  // Directors
  { label: "Director of Engineering", value: "Director Engineering", category: "Director" },
  { label: "Director of Technology", value: "Director Technology", category: "Director" },
  { label: "Director of Product", value: "Director Product", category: "Director" },
  { label: "Director of Sales", value: "Director Sales", category: "Director" },
  { label: "Director of Marketing", value: "Director Marketing", category: "Director" },
  
  // Heads
  { label: "Head of Engineering", value: "Head Engineering", category: "Head" },
  { label: "Head of Technology", value: "Head Technology", category: "Head" },
  { label: "Head of Product", value: "Head Product", category: "Head" }
];

const JobTitleSelector: React.FC<JobTitleSelectorProps> = ({ onSelect }) => {
  const [selectedTitles, setSelectedTitles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customTitle, setCustomTitle] = useState('');
  const [showAllSelectedMessage, setShowAllSelectedMessage] = useState(false);
  const continueButtonRef = useRef<HTMLButtonElement>(null);
  const customTitleRef = useRef<HTMLDivElement>(null);

  // Accessibility: Live region for selection updates
  const [selectionAnnouncement, setSelectionAnnouncement] = useState('');
  
  // Update selection announcement for screen readers
  useEffect(() => {
    const count = selectedTitles.size;
    setSelectionAnnouncement(`${count} ${count === 1 ? 'title' : 'titles'} selected`);
  }, [selectedTitles.size]);

  // Filter titles based on search query
  const filteredTitles = useMemo(() => {
    return jobTitles.filter(title => 
      title.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      title.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  // Group titles by category
  const groupedTitles = useMemo(() => {
    return filteredTitles.reduce((acc, title) => {
      if (!acc[title.category]) {
        acc[title.category] = [];
      }
      acc[title.category].push(title);
      return acc;
    }, {} as Record<string, JobTitleOption[]>);
  }, [filteredTitles]);

  const handleToggle = (value: string) => {
    const newSelected = new Set(selectedTitles);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    setSelectedTitles(newSelected);
  };

  const handleSelectAll = () => {
    const newSelected = new Set(filteredTitles.map(t => t.value));
    setSelectedTitles(newSelected);
    // Show confirmation message
    setShowAllSelectedMessage(true);
    setTimeout(() => setShowAllSelectedMessage(false), 2000);
  };

  const handleClearAll = () => {
    setSelectedTitles(new Set());
    setCustomTitle('');
    setShowCustomInput(false);
  };

  // Handle keyboard navigation
  const handleKeyPress = (e: React.KeyboardEvent, value: string) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      handleToggle(value);
    }
  };

  const handleContinue = () => {
    const titles = Array.from(selectedTitles);
    if (customTitle) {
      titles.push(customTitle);
    }
    onSelect(titles);
  };

  return (
    <div className="p-4 bg-white rounded-2xl shadow-soft space-y-4">
      {/* Hidden live region for accessibility */}
      <div
        aria-live="polite"
        className="sr-only"
        role="status"
      >
        {selectionAnnouncement}
      </div>

      <p className="font-medium text-gray-700 mb-3">
        What job titles are you looking for?
      </p>
      
      {/* Search and Actions */}
      <div className="space-y-3">
        <Input
          size="sm"
          placeholder="Search titles..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          startContent={<Icon icon="lucide:search" className="text-gray-400" />}
          className="w-full"
          aria-label="Search job titles"
        />
        
        <div className="flex justify-between text-sm">
          <div className="space-x-3">
            <motion.button
              onClick={handleSelectAll}
              className="text-primary-600 hover:text-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
              whileTap={{ scale: 0.95 }}
            >
              {showAllSelectedMessage ? (
                <span className="flex items-center">
                  <Icon icon="lucide:check" className="mr-1" />
                  All {filteredTitles.length} selected
                </span>
              ) : (
                'Select All'
              )}
            </motion.button>
            <motion.button
              onClick={handleClearAll}
              className="text-gray-600 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md px-2 py-1"
              whileTap={{ scale: 0.95 }}
            >
              Clear All
            </motion.button>
          </div>
        </div>
      </div>

      {/* Title Options Grid with Virtualization */}
      <div className="space-y-6 max-h-[400px] overflow-y-auto pr-2">
        {Object.entries(groupedTitles).map(([category, titles]) => {
          const { ref, inView } = useInView({
            triggerOnce: true,
            threshold: 0.1
          });

          return (
            <div key={category} ref={ref} className="space-y-3">
              <h3 className="text-base font-semibold text-gray-700 pt-2 sticky top-0 bg-white z-10 border-b pb-2">
                {category}
              </h3>
              {inView && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {titles.map((title) => (
                    <motion.div
                      key={title.value}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <button
                        onClick={() => handleToggle(title.value)}
                        className={`
                          w-full p-2 rounded-full cursor-pointer transition-all
                          flex items-center space-x-2 group
                          ${
                            selectedTitles.has(title.value)
                              ? 'bg-primary-50 border-primary-500 text-primary-700'
                              : 'bg-white border-gray-300 text-gray-700 hover:bg-primary-50/5'
                          }
                          border focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
                        `}
                        role="checkbox"
                        aria-checked={selectedTitles.has(title.value)}
                        aria-label={title.label}
                      >
                        <motion.div
                          className={`
                            w-4 h-4 rounded flex items-center justify-center
                            ${
                              selectedTitles.has(title.value)
                                ? 'bg-primary-500 text-white'
                                : 'border border-gray-400 group-hover:border-primary-500'
                            }
                          `}
                          initial={false}
                          animate={{
                            scale: selectedTitles.has(title.value) ? 1 : 0.8,
                            opacity: selectedTitles.has(title.value) ? 1 : 0.8
                          }}
                        >
                          <AnimatePresence>
                            {selectedTitles.has(title.value) && (
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                              >
                                <Icon icon="lucide:check" className="w-3 h-3" />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                        <span className="text-sm font-medium">{title.label}</span>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Custom Title Input and No Results State */}
      {searchQuery && Object.keys(groupedTitles).length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-8"
        >
          <p className="text-gray-500 mb-4">No titles match "{searchQuery}"</p>
          {!showCustomInput ? (
            <Button
              color="primary"
              variant="flat"
              size="sm"
              onClick={() => setShowCustomInput(true)}
              startContent={<Icon icon="lucide:plus" className="w-4 h-4" />}
            >
              Add Custom Title
            </Button>
          ) : (
            <div className="max-w-sm mx-auto" ref={customTitleRef}>
              <Input
                size="sm"
                placeholder="Enter custom title..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                autoFocus
              />
            </div>
          )}
        </motion.div>
      ) : (
        <div className="mt-4">
          <AnimatePresence>
            {!showCustomInput ? (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowCustomInput(true)}
                className="text-primary-600 hover:text-primary-700 text-sm flex items-center space-x-1 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-md px-2 py-1"
              >
                <Icon icon="lucide:plus" className="w-4 h-4" />
                <span>Add custom title</span>
              </motion.button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="space-y-2"
                ref={customTitleRef}
              >
                <Input
                  size="sm"
                  placeholder="Enter custom title..."
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  autoFocus
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Sticky Continue Button */}
      <div className="sticky bottom-0 bg-white pt-4 mt-4 border-t">
        <div className="flex justify-end">
          <Button
            ref={continueButtonRef}
            color="primary"
            className="rounded-full px-6"
            isDisabled={selectedTitles.size === 0 && !customTitle}
            onClick={handleContinue}
          >
            Continue
          </Button>
        </div>
      </div>
    </div>
  );
};

export default JobTitleSelector;
