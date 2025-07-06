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
  const { profile, logout, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Create fallback profile data when authenticated but profile not yet loaded
  const displayProfile = React.useMemo(() => {
    if (profile) return profile;
    
    if (isAuthenticated && user) {
      // Try to get cached data for immediate display
      try {
        const cacheKey = `profile_${user.id}_v2`;
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.profile) {
            return {
              id: user.id,
              email: user.email || parsed.profile.email || 'user@example.com',
              fullName: user.user_metadata?.full_name || parsed.profile.full_name || null,
              avatarUrl: user.user_metadata?.avatar_url || parsed.profile.avatar_url || null,
              role: parsed.profile.role || 'user',
              subscription: {
                plan: 'FREE',
                searchesRemaining: 5,
                activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
              }
            };
          }
        }
      } catch (error) {
        console.warn('Failed to load cached profile for sidebar:', error);
      }
      
      // Return basic fallback if no cache
      return {
        id: user.id,
        email: user.email || 'user@example.com',
        fullName: user.user_metadata?.full_name || null,
        avatarUrl: user.user_metadata?.avatar_url || null,
        role: 'user' as const,
        subscription: {
          plan: 'FREE',
          searchesRemaining: 5,
          activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        }
      };
    }
    
    return null;
  }, [profile, isAuthenticated, user]);
  
  // LOGOUT-FIX 3 - Enhanced logout with navigation
  const handleLogout = async () => {
    try {
      // Call logout from auth context
      await logout();
      
      // Navigate to login with replace to prevent back button issues
      navigate("/login", { replace: true });
      
    } catch (error) {
      console.error('Logout error:', error);
      
      // Even if logout fails, navigate to login page for security
      navigate("/login", { replace: true });
    }
  };
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { path: "/search", label: "Search", icon: "lucide:search" },
    { path: "/results", label: "Results", icon: "lucide:users" },
    { path: "/lists", label: "Lists", icon: "lucide:list" },
    { path: "/settings", label: "Settings", icon: "lucide:settings" },
    ...(displayProfile?.role === 'admin' ? [{ path: "/admin", label: "Admin", icon: "lucide:shield" }] : [])
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
      {isSidebarOpen && (
        <div className="p-4 border-t border-gray-100">
          {displayProfile ? (
            <>
              <div className="flex items-center">
                <Avatar 
                  src={displayProfile.avatarUrl} 
                  name={displayProfile.fullName || displayProfile.email} 
                  size="sm"
                  className="mr-3"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {displayProfile.fullName || 'User'}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{displayProfile.email}</p>
                </div>
                <Dropdown placement="top-end">
                  <DropdownTrigger>
                    <Button isIconOnly variant="light" size="sm" className="rounded-full">
                      <Icon icon="lucide:more-vertical" className="text-lg" />
                    </Button>
                  </DropdownTrigger>
                  <DropdownMenu aria-label="User actions">
                    <DropdownItem key="settings" onPress={() => navigate("/settings")} textValue="Settings">
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:settings" />
                        <span>Settings</span>
                      </div>
                    </DropdownItem>
                    {displayProfile?.role === 'admin' && (
                      <DropdownItem key="admin" onPress={() => navigate("/admin")} textValue="Admin Dashboard">
                        <div className="flex items-center gap-2">
                          <Icon icon="lucide:shield" />
                          <span>Admin Dashboard</span>
                        </div>
                      </DropdownItem>
                    )}
                    <DropdownItem key="logout" className="text-danger" color="danger" onPress={handleLogout} textValue="Logout">
                      <div className="flex items-center gap-2">
                        <Icon icon="lucide:log-out" />
                        <span>Logout</span>
                      </div>
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </div>
              
              {/* Subscription badge - always show if we have profile */}
              <div className="mt-3 flex items-center">
                <Badge content={displayProfile.subscription?.searchesRemaining || 0} color="primary">
                  <Button 
                    variant="flat" 
                    color="primary" 
                    size="sm"
                    startContent={<Icon icon="lucide:zap" />}
                    onPress={() => navigate("/search")}
                    fullWidth
                    className="rounded-full"
                  >
                    {(displayProfile.subscription?.plan || 'FREE').toUpperCase()} Plan
                  </Button>
                </Badge>
              </div>
            </>
          ) : (
            // Only show minimal loading when not authenticated
            <div className="text-center p-2">
              <div className="text-xs text-gray-400">Not authenticated</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ModernSidebar;