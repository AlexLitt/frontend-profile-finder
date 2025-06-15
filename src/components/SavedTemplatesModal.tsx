import React from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Card,
  CardBody
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { SearchTemplate } from "./ChatSearchPanel";

interface SavedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  templates: SearchTemplate[];
  onSelect: (template: SearchTemplate) => void;
}

const SavedTemplatesModal: React.FC<SavedTemplatesModalProps> = ({
  isOpen,
  onClose,
  templates,
  onSelect
}) => {
  // Format date to readable string
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Saved Search Templates
            </ModalHeader>
            <ModalBody>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon icon="lucide:bookmark" className="text-4xl mx-auto mb-2" />
                  <p>No saved templates yet</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <Card 
                        isPressable 
                        onPress={() => onSelect(template)}
                        className="border border-gray-200 hover:border-primary-200 transition-colors"
                      >
                        <CardBody className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="text-lg font-semibold">{template.name}</h3>
                              <p className="text-sm text-gray-600">{template.description}</p>
                              <div className="flex flex-wrap gap-1 mt-2">
                                {template.params.jobTitles.map((title, i) => (
                                  <span 
                                    key={i} 
                                    className="text-xs bg-gray-100 px-2 py-1 rounded-full text-gray-700"
                                  >
                                    {title}
                                  </span>
                                ))}
                                {template.params.companies.map((company, i) => (
                                  <span 
                                    key={i} 
                                    className="text-xs bg-primary-100 px-2 py-1 rounded-full text-primary-700"
                                  >
                                    {company}
                                  </span>
                                ))}
                              </div>
                              <p className="text-xs text-gray-400 mt-2">
                                Last used: {formatDate(template.lastUsed)}
                              </p>
                            </div>
                            <Button 
                              color="primary"
                              size="sm"
                              className="ml-2"
                              onPress={() => onSelect(template)}
                            >
                              Use
                            </Button>
                          </div>
                        </CardBody>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button 
                variant="flat" 
                onPress={onClose}
                className="w-full sm:w-auto"
              >
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SavedTemplatesModal;