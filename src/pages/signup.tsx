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

export default function SignupPage() {
  const { signup, loginWithProvider } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    agreeTerms?: string;
  }>({});
  
  const validateForm = () => {
    const newErrors: {
      name?: string;
      email?: string;
      password?: string;
      confirmPassword?: string;
      agreeTerms?: string;
    } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    }
    
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
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    
    if (!agreeTerms) {
      newErrors.agreeTerms = "You must agree to the terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      await signup(email, password, name);
      navigate("/");
      addToast({
        title: "Account created",
        description: "Welcome to DecisionFindr!",
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Please try again",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleProviderSignup = async (provider: "google" | "linkedin") => {
    try {
      await loginWithProvider(provider);
      navigate("/");
      addToast({
        title: "Account created",
        description: `Welcome to DecisionFindr!`,
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Signup failed",
        description: error instanceof Error ? error.message : `${provider} authentication failed`,
        color: "danger"
      });
    }
  };
  
  return (
    <Card className="w-full">
      <CardBody className="p-6">
        <h2 className="text-2xl font-bold text-center mb-6">Create your account</h2>
        
        <div className="flex flex-col gap-4 mb-6">
          <Button
            variant="flat"
            startContent={<Icon icon="logos:google-icon" className="text-lg" />}
            onPress={() => handleProviderSignup("google")}
            fullWidth
          >
            Sign up with Google
          </Button>
          <Button
            variant="flat"
            startContent={<Icon icon="logos:linkedin-icon" className="text-lg" />}
            onPress={() => handleProviderSignup("linkedin")}
            fullWidth
          >
            Sign up with LinkedIn
          </Button>
        </div>
        
        <div className="flex items-center gap-4 mb-6">
          <Divider className="flex-1" />
          <span className="text-sm text-gray-500">OR</span>
          <Divider className="flex-1" />
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Enter your name"
            value={name}
            onValueChange={setName}
            isInvalid={!!errors.name}
            errorMessage={errors.name}
            startContent={<Icon icon="lucide:user" className="text-default-400" />}
            isDisabled={isLoading}
          />
          
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
            placeholder="Create a password"
            value={password}
            onValueChange={setPassword}
            isInvalid={!!errors.password}
            errorMessage={errors.password}
            startContent={<Icon icon="lucide:lock" className="text-default-400" />}
            isDisabled={isLoading}
          />
          
          <Input
            type="password"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onValueChange={setConfirmPassword}
            isInvalid={!!errors.confirmPassword}
            errorMessage={errors.confirmPassword}
            startContent={<Icon icon="lucide:lock" className="text-default-400" />}
            isDisabled={isLoading}
          />
          
          <Checkbox 
            isSelected={agreeTerms} 
            onValueChange={setAgreeTerms}
            isInvalid={!!errors.agreeTerms}
            size="sm"
          >
            <span className="text-sm">
              I agree to the{" "}
              <Link to="#" className="text-primary-600 hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="#" className="text-primary-600 hover:underline">
                Privacy Policy
              </Link>
            </span>
          </Checkbox>
          {errors.agreeTerms && (
            <p className="text-xs text-danger">{errors.agreeTerms}</p>
          )}
          
          <Button 
            type="submit" 
            color="primary" 
            fullWidth
            isLoading={isLoading}
            spinner={<Spinner size="sm" color="white" />}
          >
            Create Account
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="text-primary-600 hover:underline">
              Log in
            </Link>
          </p>
        </form>
      </CardBody>
    </Card>
  );
}