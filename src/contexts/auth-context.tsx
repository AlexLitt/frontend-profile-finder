import React, { createContext, useContext, useState } from 'react';
import { User } from '@supabase/supabase-js';

// Define types for our user and subscription data
interface UserSubscription {
  plan: string;
  searchesRemaining: number;
  activeUntil: string;
}

interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  subscription: UserSubscription;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: "google" | "linkedin") => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // For development, create a mock authenticated state
  const [user] = useState<User | null>({
    id: 'test-user-id',
    email: 'test@example.com',
    role: 'authenticated',
    aud: 'authenticated',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    identities: []
  });

  const [profile] = useState<UserProfile>({
    id: 'test-user-id',
    email: 'test@example.com',
    fullName: 'Test User',
    subscription: {
      plan: 'enterprise',
      searchesRemaining: 500,
      activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // Set to expire in 1 year
    }
  });

  const [isLoading] = useState(false);

  // Mock auth methods
  const login = async () => {/* Mock implementation */};
  const loginWithProvider = async () => {/* Mock implementation */};
  const signup = async () => {/* Mock implementation */};
  const logout = async () => {/* Mock implementation */};
  const resetPassword = async () => {/* Mock implementation */};
  const updatePassword = async () => {/* Mock implementation */};

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginWithProvider,
        signup,
        logout,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};