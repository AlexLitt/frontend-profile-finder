import React, { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import ModernSidebar from "../components/ModernSidebar";
import ModernMobileNav from "../components/ModernMobileNav";
import ModernMobileSidebar from "../components/ModernMobileSidebar";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
  
  const navItems = [
    { path: "/", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { path: "/search", label: "Search", icon: "lucide:search" },
    { path: "/results", label: "Results", icon: "lucide:users" },
    { path: "/lists", label: "Lists", icon: "lucide:list" },
    { path: "/settings", label: "Settings", icon: "lucide:settings" }
  ];
  
  // Get current page title - MOVED BEFORE EARLY RETURNS
  const pageTitle = React.useMemo(() => {
    return navItems.find(item => item.path === location.pathname)?.label || "Dashboard";
  }, [location.pathname]);
  
  // LOGOUT-FIX 4 - Enhanced auth guard with loading state
  useEffect(() => {
    // Wait for auth to finish loading before making decisions
    if (isLoading) {
      return; // Still loading, don't redirect yet
    }
    
    // If not authenticated after loading is complete, redirect to login
    if (!isAuthenticated) {
      // Only log if we're not already on login page to reduce noise
      if (location.pathname !== '/login') {
        console.log('🚨 Auth guard: User not authenticated, redirecting to login');
      }
      // Use replace to prevent back navigation to protected routes
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate, location.pathname]);
  
  // Show loading spinner while auth is loading to prevent flash
  if (isLoading) {
    return (
      <div className="flex h-screen bg-gray-50 items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }
  
  // If not authenticated (and not loading), the useEffect will handle redirect
  // But we can also show a fallback here to prevent any content flash
  if (!isAuthenticated) {
    return null; // Don't render anything, redirect is in progress
  }
  
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