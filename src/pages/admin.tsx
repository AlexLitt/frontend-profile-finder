// COPILOT FIX AUTH-ENDPOINT
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell,
  Button,
  Spinner,
  Card,
  CardHeader,
  CardBody,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
  Badge
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";
import { getAuthToken } from "../hooks/useMe";

interface User {
  id: string;
  email: string;
  role: string;
  full_name?: string;
  created_at: string;
}

const AdminPage: React.FC = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    
    if (!isAdmin) {
      navigate("/dashboard");
      return;
    }
    
    fetchUsers();
  }, [isAuthenticated, isAdmin, navigate]);
  
  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const token = await getAuthToken();
      
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching users:', err);
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <Button color="primary" onClick={fetchUsers} startContent={<Icon icon="lucide:refresh-cw" />}>
          Refresh
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex gap-3">
            <Icon icon="lucide:users" className="text-2xl" />
            <div className="flex flex-col">
              <p className="text-md">Total Users</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="flex gap-3">
            <Icon icon="lucide:shield" className="text-2xl" />
            <div className="flex flex-col">
              <p className="text-md">Admins</p>
              <p className="text-xl font-bold">
                {users.filter(user => user.role === 'admin').length}
              </p>
            </div>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="flex gap-3">
            <Icon icon="lucide:user" className="text-2xl" />
            <div className="flex flex-col">
              <p className="text-md">Regular Users</p>
              <p className="text-xl font-bold">
                {users.filter(user => user.role === 'user').length}
              </p>
            </div>
          </CardHeader>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <h2 className="text-xl font-semibold">User Management</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <div className="flex justify-center items-center h-48">
              <Spinner size="lg" />
            </div>
          ) : error ? (
            <div className="text-danger text-center p-4">
              <p>{error}</p>
              <Button variant="flat" color="primary" onClick={fetchUsers} className="mt-2">
                Try Again
              </Button>
            </div>
          ) : (
            <Table aria-label="Users table">
              <TableHeader>
                <TableColumn>NAME</TableColumn>
                <TableColumn>EMAIL</TableColumn>
                <TableColumn>ROLE</TableColumn>
                <TableColumn>CREATED AT</TableColumn>
                <TableColumn>ACTIONS</TableColumn>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.full_name || 'N/A'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge color={user.role === 'admin' ? 'secondary' : 'primary'}>
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell>
                      <Dropdown>
                        <DropdownTrigger>
                          <Button isIconOnly variant="light">
                            <Icon icon="lucide:more-vertical" />
                          </Button>
                        </DropdownTrigger>
                        <DropdownMenu aria-label="User actions">
                          <DropdownItem key="view">View Details</DropdownItem>
                          <DropdownItem key="edit">Edit User</DropdownItem>
                          <DropdownItem 
                            key="delete"
                            className="text-danger" 
                            color="danger"
                          >
                            Delete
                          </DropdownItem>
                        </DropdownMenu>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
};

export default AdminPage;
