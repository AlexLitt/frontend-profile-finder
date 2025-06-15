import React from "react";
import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface SearchParams {
  jobTitles: string[];
  companies: string[];
  jobLevels?: string[];
  locations: string[];
  keywords?: string[];
}

interface SummaryCardProps {
  searchParams: SearchParams;
  onSearch: () => void;
  onEdit: () => void;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ searchParams, onSearch, onEdit }) => {
  // Animation variants for staggered animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, scale: 0.8 },
    show: { opacity: 1, scale: 1 }
  };

  return (
    <Card className="shadow-soft border border-gray-100">
      <CardBody className="p-4">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold">Search Summary</h3>
          <Button
            isIconOnly
            variant="light"
            size="sm"
            onPress={onEdit}
            aria-label="Edit search criteria"
          >
            <Icon icon="lucide:pencil" className="text-gray-500" />
          </Button>
        </div>

        <motion.div 
          className="space-y-3"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Job Titles */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Job Titles</p>
            <div className="flex flex-wrap gap-2">
              {searchParams.jobTitles.map((title, index) => (
                <motion.div key={`title-${index}`} variants={item}>
                  <Chip color="primary" variant="flat" className="pill-appear">
                    {title}
                  </Chip>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Companies */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Companies</p>
            <div className="flex flex-wrap gap-2">
              {searchParams.companies.map((company, index) => (
                <motion.div key={`company-${index}`} variants={item}>
                  <Chip color="secondary" variant="flat" className="pill-appear">
                    {company}
                  </Chip>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Job Levels (if any) */}
          {searchParams.jobLevels && searchParams.jobLevels.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Job Levels</p>
              <div className="flex flex-wrap gap-2">
                {searchParams.jobLevels.map((level, index) => (
                  <motion.div key={`level-${index}`} variants={item}>
                    <Chip color="danger" variant="flat" className="pill-appear">
                      {level}
                    </Chip>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          <div>
            <p className="text-sm text-gray-500 mb-1">Locations</p>
            <div className="flex flex-wrap gap-2">
              {searchParams.locations.map((location, index) => (
                <motion.div key={`location-${index}`} variants={item}>
                  <Chip color="success" variant="flat" className="pill-appear">
                    {location}
                  </Chip>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Keywords (if any) */}
          {searchParams.keywords && searchParams.keywords.length > 0 && (
            <div>
              <p className="text-sm text-gray-500 mb-1">Keywords</p>
              <div className="flex flex-wrap gap-2">
                {searchParams.keywords.map((keyword, index) => (
                  <motion.div key={`keyword-${index}`} variants={item}>
                    <Chip variant="flat" className="pill-appear">
                      {keyword}
                    </Chip>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <Button
          color="primary"
          className="w-full mt-4"
          startContent={<Icon icon="lucide:search" />}
          onPress={onSearch}
          aria-label="Run search with these criteria"
        >
          Run Search
        </Button>
      </CardBody>
    </Card>
  );
};

export default SummaryCard;