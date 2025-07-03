import React from "react";
import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Input,
  Textarea,
  Chip,
  Select, 
  SelectItem, 
  Spinner,
  addToast
} from "@heroui/react";
import { SearchResult } from "../api/profileSearch";
import { ProspectList, useListManagement } from "../hooks/useListManagement";
import { Icon } from "@iconify/react";

interface SaveToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProspects: SearchResult[];
}

const SaveToListModal: React.FC<SaveToListModalProps> = ({ 
  isOpen, 
  onClose,
  selectedProspects = []
}) => {
  const { useLists, useCreateList, useAddToList } = useListManagement();
  const { data: lists = [], isLoading: isLoadingLists } = useLists();
  const createListMutation = useCreateList();
  const addToListMutation = useAddToList();

  const [mode, setMode] = React.useState<'create' | 'add'>('create');
  const [selectedListId, setSelectedListId] = React.useState<string>("");
  const [newListName, setNewListName] = React.useState("");
  const [newListDescription, setNewListDescription] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(lists.length > 0 ? 'add' : 'create');
      setSelectedListId(lists.length > 0 ? lists[0].id : "");
      setNewListName("");
      setNewListDescription("");
      setIsSubmitting(false);
    }
  }, [isOpen, lists]);

  const handleCreateList = async () => {
    if (!newListName.trim()) {
      addToast({
        title: "Name required",
        description: "Please enter a name for your list",
        color: "danger"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await createListMutation.mutateAsync({
        name: newListName.trim(),
        description: newListDescription.trim(),
        prospects: selectedProspects,
        color: getRandomColor()
      });

      addToast({
        title: "List created",
        description: `Created list "${newListName}" with ${selectedProspects.length} prospects`,
        color: "success"
      });
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to create list. Please try again.",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToList = async () => {
    if (!selectedListId) {
      addToast({
        title: "Selection required",
        description: "Please select a list",
        color: "danger"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await addToListMutation.mutateAsync({
        listId: selectedListId,
        prospects: selectedProspects
      });
      
      addToast({
        title: "Prospects added",
        description: `Added ${selectedProspects.length} prospects to "${result?.name}"`,
        color: "success"
      });
      onClose();
    } catch (error) {
      addToast({
        title: "Error",
        description: "Failed to add to list. Please try again.",
        color: "danger"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Generate random pastel color for list visual organization
  const getRandomColor = () => {
    const colors = [
      "primary", "secondary", "success", "warning", 
      "danger", "info", "default"
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const handleSubmit = () => {
    if (mode === 'create') {
      handleCreateList();
    } else {
      handleAddToList();
    }
  };

  if (isLoadingLists) {
    return (
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <ModalBody className="py-8 flex justify-center items-center">
            <Spinner size="lg" color="primary" />
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Save to List
        </ModalHeader>
        <ModalBody>
          <div className="mb-4">
            <Chip color="primary" variant="flat">
              {selectedProspects.length} prospects selected
            </Chip>
          </div>

          {lists.length > 0 && (
            <div className="flex gap-3 mb-4">
              <Button
                variant={mode === 'add' ? "solid" : "flat"}
                color="primary"
                onPress={() => setMode('add')}
                className="flex-1"
              >
                Add to existing list
              </Button>
              <Button
                variant={mode === 'create' ? "solid" : "flat"}
                color="primary"
                onPress={() => setMode('create')}
                className="flex-1"
              >
                Create new list
              </Button>
            </div>
          )}

          {mode === 'create' ? (
            <>
              <Input
                label="List name"
                placeholder="E.g., VIP Prospects"
                value={newListName}
                onValueChange={setNewListName}
                variant="bordered"
                isRequired
                className="mb-4"
              />
              <Textarea
                label="Description (optional)"
                placeholder="Add notes about this list"
                value={newListDescription}
                onValueChange={setNewListDescription}
                variant="bordered"
                className="mb-4"
              />
            </>
          ) : (
            <Select
              label="Select list"
              placeholder="Choose a list"
              selectedKeys={[selectedListId]}
              onChange={e => setSelectedListId(e.target.value)}
              className="mb-4"
            >
              {lists.map((list) => (
                <SelectItem key={list.id} value={list.id}>
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-${list.color || 'default'}-500`}></div>
                    <span>{list.name}</span>
                    <span className="text-gray-500 text-xs">({list.prospects.length})</span>
                  </div>
                </SelectItem>
              ))}
            </Select>
          )}
        </ModalBody>
        <ModalFooter>
          <Button
            variant="flat"
            onPress={onClose}
          >
            Cancel
          </Button>
          <Button
            color="primary"
            onPress={handleSubmit}
            isDisabled={
              (mode === 'create' && !newListName.trim()) ||
              (mode === 'add' && !selectedListId) ||
              isSubmitting
            }
            isLoading={isSubmitting}
          >
            {mode === 'create' ? 'Create' : 'Add'}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SaveToListModal;
