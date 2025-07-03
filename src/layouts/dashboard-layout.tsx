import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ModernSidebar from "../components/ModernSidebar";
import ModernMobileNav from "../components/ModernMobileNav";
import ModernMobileSidebar from "../components/ModernMobileSidebar";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

export default function DashboardLayout() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { path: "/search", label: "Search", icon: "lucide:search" },
    { path: "/results", label: "Results", icon: "lucide:users" },
    { path: "/lists", label: "Lists", icon: "lucide:list" },
    { path: "/settings", label: "Settings", icon: "lucide:settings" }
  ];
  
  // Get current page title
  const pageTitle = React.useMemo(() => {
    return navItems.find(item => item.path === location.pathname)?.label || "Dashboard";
  }, [location.pathname]);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <ModernSidebar 
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      {/* Mobile sidebar (animated) */}
      <AnimatePresence>
        {isMobileSidebarOpen && (
          <ModernMobileSidebar 
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            navItems={navItems}
          />
        )}
      </AnimatePresence>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile navbar */}
        <ModernMobileNav 
          title={pageTitle}
          toggleSidebar={() => setIsMobileSidebarOpen(true)}
        />
        
        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}