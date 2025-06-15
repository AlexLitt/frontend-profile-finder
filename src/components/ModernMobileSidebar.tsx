import React from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  navItems: Array<{ path: string; label: string; icon: string }>;
}

const ModernMobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, navItems }) => {
  if (!isOpen) return null;

  // Animation variants
  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
  };

  const sidebarVariants = {
    hidden: { x: "-100%" },
    visible: { x: 0 }
  };

  return (
    <motion.div 
      className="md:hidden fixed inset-0 z-50 bg-black bg-opacity-50"
      initial="hidden"
      animate="visible"
      exit="hidden"
      variants={backdropVariants}
      transition={{ duration: 0.2 }}
      onClick={onClose}
    >
      <motion.div 
        className="absolute top-0 left-0 w-64 h-full bg-white"
        initial="hidden"
        animate="visible"
        exit="hidden"
        variants={sidebarVariants}
        transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Icon icon="lucide:search" className="text-2xl text-primary-500 mr-2" />
              <span className="text-xl font-semibold text-gray-900">DecisionFindr</span>
            </div>
            <Button 
              isIconOnly 
              variant="light" 
              onPress={onClose}
              aria-label="Close sidebar"
              className="rounded-full"
            >
              <Icon icon="lucide:x" className="text-lg" />
            </Button>
          </div>
        </div>
        <div className="p-4">
          <nav className="space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center px-4 py-3 rounded-xl transition-all relative ${
                    isActive 
                      ? 'text-primary-600 bg-primary-50 font-medium' 
                      : 'text-gray-600 hover:bg-gray-50'
                  }`
                }
                onClick={onClose}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full" />
                    )}
                    <Icon icon={item.icon} className="text-xl mr-3" />
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ModernMobileSidebar;