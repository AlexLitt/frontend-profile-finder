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
  DropdownItem
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/auth-context";

interface MobileNavProps {
  title: string;
  toggleSidebar: () => void;
}

const ModernMobileNav: React.FC<MobileNavProps> = ({ title, toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = () => {
    logout();
    navigate("/login");
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
        <Dropdown placement="bottom-end">
          <DropdownTrigger>
            <Avatar 
              as="button"
              src={user?.avatar} 
              name={user?.name} 
              size="sm"
              className="cursor-pointer"
            />
          </DropdownTrigger>
          <DropdownMenu aria-label="User actions">
            <DropdownItem key="profile" className="h-14 gap-2">
              <p className="font-semibold">{user?.name}</p>
              <p className="text-small text-default-500">{user?.email}</p>
            </DropdownItem>
            <DropdownItem key="searches" className="text-primary">
              <div className="flex items-center gap-2">
                <Icon icon="lucide:zap" />
                <span>{user?.subscription.searchesRemaining} searches remaining</span>
              </div>
            </DropdownItem>
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
      </NavbarContent>
    </Navbar>
  );
};

export default ModernMobileNav;