import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Divider, 
  Checkbox,
  Spinner,
  addToast
} from "@heroui/react";
import { Icon } from "@iconify/react";
import { useAuth } from "../contexts/auth-context";

export default function LoginPage() {
  const { login, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [rememberMe, setRememberMe] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{email?: string; password?: string}>({});
  
  React.useEffect(() => {
    // Automatically redirect to dashboard for development
    navigate('/dashboard');
  }, [navigate]);
  
  // Return empty div since we're redirecting
  return <div />;
  
  const validateForm = () => {
    const newErrors: {email?: string; password?: string} = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/search");
      addToast({
        title: "Login successful",
        description: "Welcome back to DecisionFindr!",
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Login failed",
        description: error instanceof Error ? error.message : "Please check your credentials",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProviderLogin = async (provider: "google" | "linkedin") => {
    try {
      await loginWithProvider(provider);
      navigate("/");
      addToast({
        title: "Login successful",
        description: `Welcome to DecisionFindr!`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Login failed",
        description: error instanceof Error ? error.message : `${provider} authentication failed`,
        color: "danger"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Log in to your account</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <Button
            variant="flat"
            startContent={<Icon icon="logos:google-icon" className="text-lg" />}
            onPress={() => handleProviderLogin("google")}
            fullWidth
          >
            Continue with Google
          </Button>
          <Button
            variant="flat"
            startContent={<Icon icon="logos:linkedin-icon" className="text-lg" />}
            onPress={() => handleProviderLogin("linkedin")}
            fullWidth
          >
            Continue with LinkedIn
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <Divider className="flex-1" />
          <span className="text-sm text-gray-500">OR</span>
          <Divider className="flex-1" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onValueChange={setEmail}
            isInvalid={!!errors.email}
            errorMessage={errors.email}
            startContent={<Icon icon="lucide:mail" className="text-default-400" />}
            isDisabled={isLoading}
          />
          
          <Input
            type="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onValueChange={setPassword}
            isInvalid={!!errors.password}
            errorMessage={errors.password}
            startContent={<Icon icon="lucide:lock" className="text-default-400" />}
            isDisabled={isLoading}
          />
          
          <div className="flex items-center justify-between">
            <Checkbox 
              isSelected={rememberMe} 
              onValueChange={setRememberMe}
              size="sm"
            >
              Remember me
            </Checkbox>
            <Link
              to="/reset-password"
              className="text-sm font-medium text-blue-600 hover:text-blue-500"
            >
              Forgot password?
            </Link>
          </div>
          
          <Button 
            type="submit" 
            color="primary" 
            fullWidth
            isLoading={isLoading}
            spinner={<Spinner size="sm" color="white" />}
          >
            Log in
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary-600 hover:underline">
              Sign up
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}