import React from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Card,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { SearchTemplate } from "./ChatSearchPanel";
import { useSearchCache } from "../hooks/useSearchCache";

interface SavedTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: SearchTemplate) => void;
}

const SavedTemplatesModal: React.FC<SavedTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelect
}) => {
  // Use our caching hooks
  const { useTemplates, useDeleteTemplate } = useSearchCache();
  const { data: templates = [] } = useTemplates();
  const { mutate: deleteTemplate } = useDeleteTemplate();

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
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Saved Search Templates</h2>
                <span className="text-sm text-gray-500">{templates.length} templates</span>
              </div>
            </ModalHeader>
            <ModalBody>
              {templates.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Icon icon="lucide:bookmark" className="text-4xl mx-auto mb-2" />
                  <p>No saved templates yet</p>
                  <p className="text-sm mt-2">Save your search criteria as templates for quick access</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {templates.map((template) => (
                    <motion.div
                      key={template.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border rounded-lg p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">{template.name}</h3>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button 
                                  isIconOnly 
                                  variant="light" 
                                  className="text-gray-500"
                                >
                                  <Icon icon="lucide:more-vertical" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu>
                                <DropdownItem 
                                  key="use"
                                  startContent={<Icon icon="lucide:search" />}
                                  onPress={() => {
                                    onSelect(template);
                                    onClose();
                                  }}
                                >
                                  Use Template
                                </DropdownItem>
                                <DropdownItem 
                                  key="delete"
                                  className="text-danger"
                                  color="danger"
                                  startContent={<Icon icon="lucide:trash" />}
                                  onPress={() => deleteTemplate(template.id)}
                                >
                                  Delete Template
                                </DropdownItem>
                              </DropdownMenu>
                            </Dropdown>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {template.params.jobTitles.map((title, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700"
                              >
                                {title}
                              </span>
                            ))}
                            {template.params.companies.map((company, i) => (
                              <span
                                key={i}
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700"
                              >
                                {company}
                              </span>
                            ))}
                          </div>
                          <div className="mt-3 text-xs text-gray-500">
                            Last used: {formatDate(template.lastUsed)}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>Close</Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};

export default SavedTemplatesModal;