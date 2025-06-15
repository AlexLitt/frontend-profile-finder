import React from "react";
import { Switch } from "@heroui/react";
import { motion } from "framer-motion";

interface ToggleSwitchProps {
  label: string;
  description?: string;
  isSelected: boolean;
  onValueChange: (value: boolean) => void;
}

const ModernToggleSwitch: React.FC<ToggleSwitchProps> = ({
  label,
  description,
  isSelected,
  onValueChange
}) => {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="font-medium text-gray-800">{label}</p>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <Switch 
        isSelected={isSelected} 
        onValueChange={onValueChange}
        classNames={{
          base: "inline-flex items-center cursor-pointer gap-2",
          wrapper: "p-0 h-6 overflow-visible",
          thumb: "w-5 h-5 shadow-lg data-[selected=true]:ml-6",
          startContent: "text-gray-500",
          endContent: "text-primary-500"
        }}
      />
    </div>
  );
};

export default ModernToggleSwitch;