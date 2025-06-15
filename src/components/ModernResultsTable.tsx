import React from "react";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Chip,
  Button,
  Tooltip,
  Pagination
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface Prospect {
  id: string;
  name: string;
  jobTitle: string;
  company: string;
  linkedInUrl: string;
  confidence: number;
}

interface ModernResultsTableProps {
  results: Prospect[];
  selectedKeys: Set<string>;
  onSelectionChange: (keys: Set<string>) => void;
  currentPage: number;
  onPageChange: (page: number) => void;
  totalPages: number;
  onExport: (format: string) => void;
  onCrmIntegration: (crm: string) => void;
}

const ModernResultsTable: React.FC<ModernResultsTableProps> = ({
  results,
  selectedKeys,
  onSelectionChange,
  currentPage,
  onPageChange,
  totalPages,
  onExport,
  onCrmIntegration
}) => {
  // Get confidence color based on score
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return "success";
    if (score >= 70) return "primary";
    if (score >= 50) return "warning";
    return "danger";
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="bg-white rounded-xl shadow-soft overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              {selectedKeys.size} of {results.length} selected
            </span>
            {selectedKeys.size > 0 && (
              <Button 
                variant="light" 
                size="sm"
                onPress={() => onSelectionChange(new Set())}
                className="rounded-full"
              >
                Clear
              </Button>
            )}
          </div>
          
          <div className="flex gap-2">
            {selectedKeys.size > 0 && (
              <>
                <Tooltip content="Export to CSV">
                  <Button 
                    isIconOnly
                    variant="flat" 
                    size="sm"
                    onPress={() => onExport("csv")}
                    className="rounded-full"
                    aria-label="Export to CSV"
                  >
                    <Icon icon="lucide:file-text" className="text-lg" />
                  </Button>
                </Tooltip>
                
                <Tooltip content="Export to Excel">
                  <Button 
                    isIconOnly
                    variant="flat" 
                    size="sm"
                    onPress={() => onExport("xlsx")}
                    className="rounded-full"
                    aria-label="Export to Excel"
                  >
                    <Icon icon="lucide:file-spreadsheet" className="text-lg" />
                  </Button>
                </Tooltip>
                
                <Tooltip content="Send to HubSpot">
                  <Button 
                    isIconOnly
                    variant="flat" 
                    size="sm"
                    onPress={() => onCrmIntegration("HubSpot")}
                    className="rounded-full"
                    aria-label="Send to HubSpot"
                  >
                    <Icon icon="logos:hubspot-icon" className="text-lg" />
                  </Button>
                </Tooltip>
                
                <Tooltip content="Send to Salesforce">
                  <Button 
                    isIconOnly
                    variant="flat" 
                    size="sm"
                    onPress={() => onCrmIntegration("Salesforce")}
                    className="rounded-full"
                    aria-label="Send to Salesforce"
                  >
                    <Icon icon="logos:salesforce" className="text-lg" />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>
        
        <Table
          removeWrapper
          aria-label="Search results"
          selectionMode="multiple"
          selectedKeys={selectedKeys}
          onSelectionChange={onSelectionChange as any}
          classNames={{
            base: "rounded-none",
            table: "min-w-full",
            thead: "bg-gray-50",
            tr: "hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0",
          }}
        >
          <TableHeader>
            <TableColumn className="text-xs font-semibold text-gray-500">NAME</TableColumn>
            <TableColumn className="text-xs font-semibold text-gray-500">JOB TITLE</TableColumn>
            <TableColumn className="text-xs font-semibold text-gray-500">COMPANY</TableColumn>
            <TableColumn className="text-xs font-semibold text-gray-500">MATCH</TableColumn>
            <TableColumn className="text-xs font-semibold text-gray-500">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody>
            {results.map((item) => (
              <TableRow key={item.id}>
                <TableCell>
                  <div className="font-medium">{item.name}</div>
                </TableCell>
                <TableCell>{item.jobTitle}</TableCell>
                <TableCell>{item.company}</TableCell>
                <TableCell>
                  <Chip 
                    color={getConfidenceColor(item.confidence)} 
                    variant="flat"
                    size="sm"
                    className="font-medium"
                  >
                    {item.confidence}%
                  </Chip>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Tooltip content="View LinkedIn Profile">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        as="a" 
                        href={item.linkedInUrl} 
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="View LinkedIn profile"
                        className="rounded-full"
                      >
                        <Icon icon="logos:linkedin-icon" className="text-lg" />
                      </Button>
                    </Tooltip>
                    <Tooltip content="More Actions">
                      <Button 
                        isIconOnly 
                        variant="light" 
                        size="sm"
                        aria-label="More actions"
                        className="rounded-full"
                      >
                        <Icon icon="lucide:more-vertical" className="text-lg" />
                      </Button>
                    </Tooltip>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="p-4 border-t border-gray-100 flex justify-center">
          <Pagination
            total={totalPages}
            page={currentPage}
            onChange={onPageChange}
            classNames={{
              cursor: "bg-primary-500"
            }}
          />
        </div>
      </div>
    </motion.div>
  );
};

export default ModernResultsTable;