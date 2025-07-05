import React from "react";
import { 
  Navbar, 
  NavbarBrand, 
  NavbarContent, 
  Button, 
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

interface MobileNavProps {
  title: string;
  toggleSidebar: () => void;
}

const ModernMobileNav: React.FC<MobileNavProps> = ({ title, toggleSidebar }) => {
  const { profile, logout } = useAuth();
  const navigate = useNavigate();
  
  // LOGOUT-FIX 3 - Enhanced mobile logout with navigation  
  const handleLogout = async () => {
    try {
      // Call logout from auth context
      await logout();
      
      // Navigate to login with replace to prevent back button issues
      navigate("/login", { replace: true });
      
    } catch (error) {
      console.error('Mobile logout error:', error);
      
      // Even if logout fails, navigate to login page for security
      navigate("/login", { replace: true });
    }
  };

  return (
    <Navbar className="md:hidden border-b border-gray-100 shadow-sm">
      <NavbarContent>
        <Button 
          isIconOnly 
          variant="light" 
          onPress={toggleSidebar}
          aria-label="Toggle navigation menu"
          className="rounded-full"
        >
          <Icon icon="lucide:menu" className="text-lg" />
        </Button>
        <NavbarBrand>
          <Icon icon="lucide:search" className="text-xl text-primary-500 mr-2" />
          <p className="font-semibold text-inherit">DecisionFindr</p>
        </NavbarBrand>
      </NavbarContent>
      
      <NavbarContent justify="end">
        {profile && (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar 
                src={profile.avatarUrl}
                name={profile.fullName}
                size="sm"
                className="cursor-pointer"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="User actions">
              <DropdownItem key="profile" className="h-14 gap-2">
                <p className="font-semibold">{profile.fullName}</p>
                <p className="text-sm text-gray-500">{profile.email}</p>
              </DropdownItem>
              <DropdownItem key="subscription">
                <Badge content={profile.subscription.searchesRemaining} color="primary">
                  <span className="text-sm font-medium">{profile.subscription.plan.toUpperCase()} Plan</span>
                </Badge>
              </DropdownItem>
              <DropdownItem key="settings" onPress={() => navigate("/settings")}>
                Settings
              </DropdownItem>
              <DropdownItem key="logout" className="text-danger" color="danger" onPress={handleLogout}>
                Logout
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </Navbar>
  );
};

export default ModernMobileNav;