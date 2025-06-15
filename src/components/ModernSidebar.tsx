import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { 
  Button, 
  Avatar, 
  Dropdown, 
  DropdownTrigger, 
  DropdownMenu, 
  DropdownItem,
  Badge
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { motion } from "framer-motion";
import { useAuth } from "../contexts/auth-context";

interface SidebarProps {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isOpen: boolean) => void;
}

const ModernSidebar: React.FC<SidebarProps> = ({ isSidebarOpen, setIsSidebarOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { path: "/search", label: "Search", icon: "lucide:search" },
    { path: "/results", label: "Results", icon: "lucide:users" },
    { path: "/settings", label: "Settings", icon: "lucide:settings" }
  ];

  return (
    <div 
      className={`${
        isSidebarOpen ? 'w-64' : 'w-20'
      } hidden md:flex flex-col h-screen bg-white border-r border-gray-100 shadow-sm transition-all duration-300 ease-in-out`}
    >
      {/* Logo and collapse button */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100">
        <div className={`flex items-center ${isSidebarOpen ? 'justify-between w-full' : 'justify-center'}`}>
          {isSidebarOpen && (
            <div className="flex items-center">
              <Icon icon="lucide:search" className="text-2xl text-primary-500 mr-2" />
              <span className="text-xl font-semibold text-gray-900">DecisionFindr</span>
            </div>
          )}
          <Button 
            isIconOnly 
            variant="light" 
            onPress={() => setIsSidebarOpen(!isSidebarOpen)}
            aria-label={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            className="rounded-full"
          >
            <Icon 
              icon={isSidebarOpen ? "lucide:chevron-left" : "lucide:chevron-right"} 
              className="text-lg text-gray-500" 
            />
          </Button>
        </div>
      </div>

      {/* Navigation links */}
      <div className="flex-1 overflow-y-auto p-3">
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
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-r-full"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                  )}
                  <Icon icon={item.icon} className={`text-xl ${isSidebarOpen ? 'mr-3' : ''}`} />
                  {isSidebarOpen && <span>{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User profile section */}
      {isSidebarOpen ? (
        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center">
            <Avatar 
              src={user?.avatar} 
              name={user?.name} 
              size="sm"
              className="mr-3"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <Dropdown placement="top-end">
              <DropdownTrigger>
                <Button isIconOnly variant="light" size="sm" className="rounded-full">
                  <Icon icon="lucide:more-vertical" className="text-lg" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="User actions">
                <DropdownItem key="settings" onPress={() => navigate("/settings")}>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:settings" />
                    <span>Settings</span>
                  </div>
                </DropdownItem>
                <DropdownItem key="logout" className="text-danger" color="danger" onPress={handleLogout}>
                  <div className="flex items-center gap-2">
                    <Icon icon="lucide:log-out" />
                    <span>Logout</span>
                  </div>
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
          
          {/* Subscription badge */}
          <div className="mt-3 flex items-center">
            <Badge content={user?.subscription.searchesRemaining} color="primary">
              <Button 
                variant="flat" 
                color="primary" 
                size="sm"
                startContent={<Icon icon="lucide:zap" />}
                onPress={() => navigate("/search")}
                fullWidth
                className="rounded-full"
              >
                New Search
              </Button>
            </Badge>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-gray-100 flex flex-col items-center">
          <Avatar 
            src={user?.avatar} 
            name={user?.name} 
            size="sm"
            className="mb-3"
          />
          <Badge content={user?.subscription.searchesRemaining} color="primary">
            <Button 
              isIconOnly
              variant="flat" 
              color="primary" 
              size="sm"
              onPress={() => navigate("/search")}
              className="rounded-full"
              aria-label="New search"
            >
              <Icon icon="lucide:zap" />
            </Button>
          </Badge>
        </div>
      )}
    </div>
  );
};

export default ModernSidebar;