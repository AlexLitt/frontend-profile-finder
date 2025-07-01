import React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Card, 
  CardBody, 
  Input, 
  Button, 
  Spinner,
  addToast
} from "@heroui/react";
import { useAuth } from "../contexts/auth-context";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();
  const { resetPassword, updatePassword } = useAuth();
  
  const [email, setEmail] = React.useState("");
  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState<{
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  const validateResetForm = () => {
    const newErrors: typeof errors = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Invalid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewPasswordForm = () => {
    const newErrors: typeof errors = {};
    
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (newPassword.length < 8) {
      newErrors.newPassword = "Password must be at least 8 characters";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (confirmPassword !== newPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateResetForm()) return;

    setIsLoading(true);
    try {
      await resetPassword(email);
      addToast({
        title: "Reset link sent",
        description: "Check your email for the password reset link",
        color: "success"
      });
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send reset link",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateNewPasswordForm()) return;

    setIsLoading(true);
    try {
      await updatePassword(newPassword);
      addToast({
        title: "Success",
        description: "Your password has been reset",
        color: "success"
      });
      navigate("/login");
    } catch (error) {
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to reset password",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // If we have a token, show the new password form
  if (token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="max-w-md w-full space-y-8">
          <CardBody className="space-y-6">
            <div>
              <h2 className="text-center text-3xl font-extrabold text-gray-900">
                Reset your password
              </h2>
            </div>
            <form className="mt-8 space-y-6" onSubmit={handlePasswordReset}>
              <div className="space-y-4">
                <div>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password"
                    errorMessage={errors.newPassword}
                  />
                </div>
                <div>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    errorMessage={errors.confirmPassword}
                  />
                </div>
              </div>

              <Button
                type="submit"
                fullWidth
                color="primary"
                isLoading={isLoading}
                spinner={<Spinner size="sm" color="current" />}
              >
                Reset Password
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    );
  }

  // Show the request reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="max-w-md w-full space-y-8">
        <CardBody className="space-y-6">
          <div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900">
              Reset your password
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleRequestReset}>
            <div>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email address"
                errorMessage={errors.email}
              />
            </div>

            <Button
              type="submit"
              fullWidth
              color="primary"
              isLoading={isLoading}
              spinner={<Spinner size="sm" color="current" />}
            >
              Send Reset Link
            </Button>

            <div className="text-sm text-center">
              <Link
                to="/login"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to login
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
