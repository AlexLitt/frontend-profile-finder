import React from "react";
import { 
  Card, 
  CardHeader, 
  CardBody, 
  Button, 
  Chip, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Badge,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Input,
  Textarea,
  addToast
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { ProspectList, useListManagement } from "../hooks/useListManagement";
import { motion, AnimatePresence } from "framer-motion";
import { SearchResult } from "../api/profileSearch";

interface SavedListsPanelProps {
  onSelectList?: (list: ProspectList) => void; // Callback when a list is selected
}

const SavedListsPanel: React.FC<SavedListsPanelProps> = ({ onSelectList }) => {
  const { useLists, useUpdateList, useDeleteList, useRemoveFromList } = useListManagement();
  const { data: lists = [], isLoading } = useLists();
  const updateListMutation = useUpdateList();
  const deleteListMutation = useDeleteList();
  const removeFromListMutation = useRemoveFromList();
  
  // State for edit modal
  const [isEditModalOpen, setIsEditModalOpen] = React.useState(false);
  const [editingList, setEditingList] = React.useState<ProspectList | null>(null);
  const [editName, setEditName] = React.useState("");
  const [editDescription, setEditDescription] = React.useState("");
  
  // State for viewing list details
  const [viewingList, setViewingList] = React.useState<ProspectList | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = React.useState(false);
  
  // State for deletion confirmation
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [listToDelete, setListToDelete] = React.useState<string | null>(null);
  
  // Handle edit list modal open
  const handleEditList = (list: ProspectList) => {
    setEditingList(list);
    setEditName(list.name);
    setEditDescription(list.description || "");
    setIsEditModalOpen(true);
  };
  
  // Handle save list edit
  const handleSaveEdit = async () => {
    if (!editingList) return;
    
    try {
      await updateListMutation.mutateAsync({
        id: editingList.id,
        name: editName.trim(),
        description: editDescription.trim()
      });
      
      addToast({
        title: "List updated",
        description: `Successfully updated "${editName}"`,
        color: "success"
      });
      
      setIsEditModalOpen(false);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to update list",
        color: "danger"
      });
    }
  };
  
  // Handle delete list
  const handleDeleteList = async (listId: string) => {
    try {
      await deleteListMutation.mutateAsync(listId);
      
      addToast({
        title: "List deleted",
        description: "The list has been deleted",
        color: "success"
      });
      
      setShowDeleteConfirm(false);
      setListToDelete(null);
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to delete list",
        color: "danger"
      });
    }
  };
  
  // Handle opening list details view
  const handleViewList = (list: ProspectList) => {
    setViewingList(list);
    setIsViewModalOpen(true);
    
    if (onSelectList) {
      onSelectList(list);
    }
  };
  
  // Handle removing a prospect from a list
  const handleRemoveProspect = async (listId: string, prospectId: string) => {
    try {
      await removeFromListMutation.mutateAsync({
        listId,
        prospectIds: [prospectId]
      });
      
      addToast({
        title: "Prospect removed",
        description: "Prospect has been removed from list",
        color: "success"
      });
      
      // Update the viewing list if needed
      if (viewingList && viewingList.id === listId) {
        setViewingList(prev => {
          if (!prev) return null;
          return {
            ...prev,
            prospects: prev.prospects.filter(p => {
              const id = p.id || `${p.name}_${p.email}`;
              return id !== prospectId;
            })
          };
        });
      }
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to remove prospect from list",
        color: "danger"
      });
    }
  };
  
  // Format date to readable string
  const formatDate = (timestamp: number) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(new Date(timestamp));
  };
  
  return (
    <div>
      <Card className="shadow-soft">
        <CardHeader className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Saved Lists</h3>
          <Badge color="primary" size="sm">{lists.length}</Badge>
        </CardHeader>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-500 border-t-transparent"></div>
            </div>
          ) : lists.length === 0 ? (
            <div className="p-6 text-center">
              <Icon icon="lucide:list" className="text-4xl mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">No saved lists yet</p>
              <p className="text-sm mt-2 text-gray-400">
                Save search results to lists for easy access
              </p>
            </div>
          ) : (
            <div>
              <AnimatePresence>
                {lists.map((list) => (
                  <motion.div
                    key={list.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b last:border-b-0 border-gray-100"
                  >
                    <div className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            <div className={`w-3 h-3 rounded-full bg-${list.color || 'default'}-500 mr-2`}></div>
                            <h4 className="font-medium">{list.name}</h4>
                          </div>
                          {list.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {list.description}
                            </p>
                          )}
                          <div className="flex items-center gap-2 mt-2">
                            <Chip size="sm" variant="flat">
                              {list.prospects.length} prospects
                            </Chip>
                            <span className="text-xs text-gray-400">
                              Updated {formatDate(list.updatedAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <Button
                            size="sm"
                            variant="light"
                            isIconOnly
                            onPress={() => handleViewList(list)}
                            className="rounded-full"
                            aria-label="View list"
                          >
                            <Icon icon="lucide:eye" className="text-lg" />
                          </Button>
                          <Dropdown>
                            <DropdownTrigger>
                              <Button
                                size="sm"
                                variant="light"
                                isIconOnly
                                className="rounded-full"
                                aria-label="More options"
                              >
                                <Icon icon="lucide:more-vertical" className="text-lg" />
                              </Button>
                            </DropdownTrigger>
                            <DropdownMenu aria-label="List actions">
                              <DropdownItem
                                key="edit"
                                startContent={<Icon icon="lucide:edit" />}
                                onPress={() => handleEditList(list)}
                              >
                                Edit
                              </DropdownItem>
                              <DropdownItem
                                key="delete"
                                className="text-danger"
                                color="danger"
                                startContent={<Icon icon="lucide:trash" />}
                                onPress={() => {
                                  setListToDelete(list.id);
                                  setShowDeleteConfirm(true);
                                }}
                              >
                                Delete
                              </DropdownItem>
                            </DropdownMenu>
                          </Dropdown>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </CardBody>
      </Card>
      
      {/* Edit List Modal */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <ModalContent>
          <ModalHeader>Edit List</ModalHeader>
          <ModalBody>
            <Input
              label="List name"
              value={editName}
              onValueChange={setEditName}
              className="mb-4"
              isRequired
            />
            <Textarea
              label="Description (optional)"
              value={editDescription}
              onValueChange={setEditDescription}
            />
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={() => setIsEditModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              color="primary" 
              onPress={handleSaveEdit}
              isDisabled={!editName.trim()}
              isLoading={updateListMutation.isPending}
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* View List Modal */}
      <Modal 
        isOpen={isViewModalOpen} 
        onClose={() => setIsViewModalOpen(false)}
        size="xl"
      >
        <ModalContent>
          {viewingList && (
            <>
              <ModalHeader>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full bg-${viewingList.color || 'default'}-500`}></div>
                  <span>{viewingList.name}</span>
                </div>
              </ModalHeader>
              <ModalBody>
                {viewingList.description && (
                  <p className="text-sm text-gray-600 mb-4">{viewingList.description}</p>
                )}
                
                <div className="mb-2 flex justify-between items-center">
                  <h3 className="text-lg font-medium">Prospects</h3>
                  <Chip size="sm">{viewingList.prospects.length} total</Chip>
                </div>
                
                {viewingList.prospects.length === 0 ? (
                  <div className="py-8 text-center">
                    <Icon icon="lucide:users" className="text-4xl mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-500">No prospects in this list yet</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {viewingList.prospects.map((prospect) => {
                      const prospectId = prospect.id || `${prospect.name}_${prospect.email}`;
                      return (
                        <div key={prospectId} className="py-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium">{prospect.name}</h4>
                              <p className="text-sm">{prospect.jobTitle} at {prospect.company}</p>
                              <p className="text-xs text-gray-500">{prospect.email}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="light"
                              isIconOnly
                              className="rounded-full"
                              onPress={() => handleRemoveProspect(viewingList.id, prospectId)}
                              aria-label="Remove prospect"
                            >
                              <Icon icon="lucide:x" className="text-lg" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="flat" onPress={() => setIsViewModalOpen(false)}>
                  Close
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={showDeleteConfirm} 
        onClose={() => {
          setShowDeleteConfirm(false);
          setListToDelete(null);
        }}
      >
        <ModalContent>
          <ModalHeader className="text-danger">Delete List?</ModalHeader>
          <ModalBody>
            <p>Are you sure you want to delete this list? This action cannot be undone.</p>
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="flat" 
              onPress={() => {
                setShowDeleteConfirm(false);
                setListToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button 
              color="danger" 
              onPress={() => listToDelete && handleDeleteList(listToDelete)}
              isLoading={deleteListMutation.isPending}
            >
              Delete List
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </div>
  );
};

export default SavedListsPanel;
