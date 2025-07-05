import React from "react";
import { Button, Tooltip } from "@heroui/react";
import { Icon } from "@iconify/react";
import { buttonStyles, tableStyles } from "../utils/styleTokens";

interface ActionButtonConfig {
  id: string;
  icon: string;
  tooltip: string;
  onClick: () => void;
  enabled: boolean;
}

interface SelectionToolbarProps {
  selectedCount: number;
  totalCount: number;
  onSelectAll: () => void;
  onClear: () => void;
  isAllSelected: boolean;
  isAnySelected: boolean;
}

const SelectionToolbar: React.FC<SelectionToolbarProps & {
  actions: ActionButtonConfig[];
}> = ({
  selectedCount,
  totalCount,
  onSelectAll,
  onClear,
  isAllSelected,
  isAnySelected,
  actions
}) => {
  return (
    <div className={`${tableStyles.selectionToolbar.bar} ${isAnySelected ? tableStyles.selectionToolbar.active : ''}`} aria-hidden={!isAnySelected}> {/* COPILOT FIX SCROLL: Added aria-hidden for accessibility */}
      {/* Left side: selection status and actions */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">
          {selectedCount} of {totalCount} selected
        </span>
        
        {/* Only show "Select All" when not everything is selected */}
        {!isAllSelected && isAnySelected && (
          <Button 
            variant="light" 
            size="sm"
            onPress={onSelectAll}
            className="rounded-lg px-3 h-8 flex items-center justify-center my-0"
          >
            Select All
          </Button>
        )}
        
        <Button 
          variant="light" 
          size="sm"
          onPress={onClear}
          className="rounded-lg px-3 h-8 flex items-center justify-center my-0"
          disabled={!isAnySelected}
        >
          Clear
        </Button>
      </div>
      
      {/* Right side: action buttons */}
      <div className={`${tableStyles.selectionToolbar.actionGroup} flex-wrap`}> {/* COPILOT FIX EXP-XLSX: Added flex-wrap to ensure buttons fit */}
        {/* Render all action buttons, always showing them but disabling as needed */}
        {actions.map(action => (
          <Tooltip key={action.id} content={action.tooltip}>
            <Button 
              isIconOnly
              variant="flat" 
              size="sm"
              onPress={action.onClick}
              className={buttonStyles.selectionIconButton}
              aria-label={action.tooltip}
              disabled={!action.enabled}
              aria-disabled={!action.enabled ? "true" : "false"}
              // Add reduced opacity styling for disabled buttons
              style={{ opacity: action.enabled ? 1 : 0.5 }}
            >
              <Icon icon={action.icon} className="text-lg" />
            </Button>
          </Tooltip>
        ))}
      </div>
    </div>
  );
};

export default SelectionToolbar;
