/**
 * LOGOUT-FIX AUDIT SUMMARY
 * 
 * FOUND:
 * - Supabase authentication system with React Context
 * - Session management via supabase.auth (signInWithPassword, signOut, etc.)
 * - User profile and subscription data from Supabase database
 * - React Query for caching with localStorage persistence
 * - Global auth guard in dashboard-layout.tsx
 * - Logout functionality in multiple components (Sidebar, MobileNav)
 * 
 * IMPLEMENTED:
 * 1. Enhanced logout function with comprehensive cache clearing
 * 2. Improved auth guard with loading states and navigation protection  
 * 3. API logout endpoint for optional server-side cleanup
 * 4. Complete localStorage/sessionStorage clearing on logout
 * 5. React Query cache clearing integration
 * 6. Navigation with replace:true to prevent back button issues
 * 7. Error handling and fallback mechanisms
 */
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Profile, UserRole, Subscription } from '../lib/supabase';

// COPILOT FIX AUTH-CALLBACK
// Enhanced types for user and subscription data
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
  role: UserRole;
  isAdmin: boolean; // Convenience property
  subscription: UserSubscription;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  loginWithProvider: (provider: "google" | "linkedin") => Promise<{ error?: string }>;
  signup: (email: string, password: string) => Promise<{ error?: string; message?: string }>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
  updatePassword: (newPassword: string) => Promise<{ error?: string }>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Helper to convert database profile to application profile
const convertDbProfileToAppProfile = (
  dbProfile: Profile | null, 
  dbSubscription: Subscription | null
): UserProfile | null => {
  if (!dbProfile) return null;
  
  // Provide default subscription if none exists
  const defaultSubscription = {
    plan: dbProfile.role === 'admin' ? 'enterprise' : 'free',
    searchesRemaining: dbProfile.role === 'admin' ? 999999 : 10,
    activeUntil: dbProfile.role === 'admin' ? '2030-12-31T23:59:59.000Z' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
  };
  
  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name,
    avatarUrl: dbProfile.avatar_url,
    role: dbProfile.role,
    isAdmin: dbProfile.role === 'admin',
    subscription: dbSubscription ? {
      plan: dbSubscription.plan || defaultSubscription.plan,
      searchesRemaining: dbSubscription.searches_remaining ?? defaultSubscription.searchesRemaining,
      activeUntil: dbSubscription.active_until || defaultSubscription.activeUntil
    } : defaultSubscription
  };
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authInitialized, setAuthInitialized] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Derive isAdmin from profile role
  const isAdmin = profile?.role === 'admin';
  
  // Load user on mount and set up auth state listener
  useEffect(() => {
    let isMounted = true; // Prevent state updates if component unmounts
    
    // Helper to fetch profile and subscription data
    const fetchProfileData = async (userId: string) => {
      if (!isMounted) return;
      
      try {
        // Query profiles using the primary key (id) which references auth.users(id)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        let finalProfileData = profileData;
        
        // If no profile found, try to create one (fallback for cases where trigger didn't work)
        if (!finalProfileData && userId) {
          // Get current user data from auth
          const { data: { user } } = await supabase.auth.getUser();
          
          if (user && user.email) {
            const isAdmin = user.email === import.meta.env.VITE_ADMIN_EMAIL;
            
            // Create a local profile first as fallback
            finalProfileData = {
              id: userId,
              email: user.email,
              role: (isAdmin ? 'admin' : 'user') as UserRole,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              full_name: null,
              avatar_url: null
            };
            
            // Try to create profile in database (but don't fail if it doesn't work)
            try {
              const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                  id: userId,
                  email: user.email,
                  role: (isAdmin ? 'admin' : 'user') as UserRole
                })
                .select()
                .single();
                
              if (newProfile && !createError) {
                finalProfileData = newProfile;
              } else if (createError) {
                // Profile creation failed - this is often due to RLS policies or duplicate keys
                console.warn('Profile creation failed (using fallback):', createError.message);
              }
              
              // Try to create subscription (optional)
              if (!createError) {
                const subscriptionData = isAdmin ? {
                  user_id: finalProfileData.id,
                  plan: 'enterprise',
                  searches_remaining: 999999,
                  active_until: '2030-12-31T23:59:59.000Z'
                } : {
                  user_id: finalProfileData.id,
                  plan: 'free',
                  searches_remaining: 10,
                  active_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
                };
                
                await supabase
                  .from('subscriptions')
                  .insert(subscriptionData)
                  .select()
                  .single();
              }
                
            } catch (dbError) {
              // Silently ignore database errors - we have a local fallback
              console.warn('Database operation failed (using fallback):', dbError);
            }
          }
        }
          
        if (!finalProfileData) {
          return;
        }
        
        // Get subscription using profile.id (the PK of profiles table)
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', finalProfileData.id) // Use profile.id (PK) for subscription lookup
          .single();
        
        // If no subscription found, create a default one based on user role
        let finalSubscriptionData = subscriptionData;
        if (!finalSubscriptionData) {
          const isAdmin = finalProfileData.role === 'admin';
          finalSubscriptionData = {
            user_id: finalProfileData.id,
            plan: isAdmin ? 'enterprise' : 'free',
            searches_remaining: isAdmin ? 999999 : 10,
            active_until: isAdmin ? '2030-12-31T23:59:59.000Z' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            id: 'temp-' + finalProfileData.id // temporary ID for local usage
          };
        }
        
        const convertedProfile = convertDbProfileToAppProfile(finalProfileData, finalSubscriptionData);
        if (isMounted) {
          setProfile(convertedProfile);
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.warn('Error fetching profile data:', error);
        setError('Failed to load profile data');
        
        // Emergency fallback - if we have a user but can't get profile, create minimal profile
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const emergencyProfile = {
            id: user.id,
            email: user.email || '',
            fullName: user.user_metadata?.full_name || null,
            avatarUrl: user.user_metadata?.avatar_url || null,
            role: (user.email === import.meta.env.VITE_ADMIN_EMAIL ? 'admin' : 'user') as UserRole,
            isAdmin: user.email === import.meta.env.VITE_ADMIN_EMAIL,
            subscription: {
              plan: user.email === import.meta.env.VITE_ADMIN_EMAIL ? 'enterprise' : 'free',
              searchesRemaining: user.email === import.meta.env.VITE_ADMIN_EMAIL ? 999999 : 10,
              activeUntil: user.email === import.meta.env.VITE_ADMIN_EMAIL ? '2030-12-31T23:59:59.000Z' : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            }
          };
          if (isMounted) {
            setProfile(emergencyProfile);
          }
        }
      }
    };

    // Get initial session
    const initializeAuth = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get current session - handle refresh token errors gracefully
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If there's a session error, it might be due to expired refresh token
        if (sessionError) {
          console.warn('Session error (likely expired token):', sessionError.message);
          // Clear any corrupted session data
          await supabase.auth.signOut({ scope: 'local' });
          return; // Exit early, user will need to login again
        }
        
        if (session?.user && isMounted) {
          setUser(session.user);
          
          // Fetch profile data
          await fetchProfileData(session.user.id);
        }
      } catch (error) {
        if (isMounted) {
          console.warn('Auth initialization error:', error);
          // Don't set error state for common auth issues
          if (error instanceof Error && error.message.includes('refresh')) {
            // Silent handling of refresh token issues
            await supabase.auth.signOut({ scope: 'local' });
          } else {
            setError('Failed to initialize authentication');
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setAuthInitialized(true);
        }
      }
    };
    
    initializeAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            setUser(session.user);
            setError(null); // Clear any previous errors
            await fetchProfileData(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setUser(null);
            setProfile(null);
            setError(null);
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            // Token was successfully refreshed
            setUser(session.user);
            setError(null);
          } else if (event === 'USER_UPDATED' && session?.user) {
            // User data was updated
            setUser(session.user);
          }
        } catch (error) {
          if (isMounted) {
            console.warn('Auth state change error:', error);
            // Don't show error for common auth issues
            if (!(error instanceof Error && error.message.includes('refresh'))) {
              setError('Authentication state change failed');
            }
          }
        }
      }
    );
    
    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);
  
  // Refresh user session and profile data
  const refreshSession = async () => {
    if (!user) return;
    
    setIsLoading(true);
    // Re-trigger the auth initialization to refresh profile data
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Create a simplified profile refresh function
      const refreshProfile = async (userId: string) => {
        try {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single();
          
          if (profileData) {
            const { data: subscriptionData } = await supabase
              .from('subscriptions')
              .select('*')
              .eq('user_id', profileData.id)
              .single();
            
            const convertedProfile = convertDbProfileToAppProfile(profileData, subscriptionData);
            setProfile(convertedProfile);
          }
        } catch (error) {
          console.warn('Failed to refresh profile:', error);
        }
      };
      
      await refreshProfile(session.user.id);
    }
    setIsLoading(false);
  };
  
  // Auth methods
  const login = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      setIsLoading(false);
      
      if (error) {
        console.error('Error logging in:', error.message);
        return { error: error.message };
      }
      
      // User will be set by the auth listener
      return {};
    } catch (networkError) {
      console.error('Network error during login:', networkError);
      setIsLoading(false);
      return { error: 'Network error: ' + (networkError as Error).message };
    }
  };
  
  const loginWithProvider = async (provider: "google" | "linkedin") => {
    setIsLoading(true);
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error(`Error signing in with ${provider}:`, error.message);
      return { error: error.message };
    }
    
    return {};
  };
  
  const signup = async (email: string, password: string) => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // Set email redirect URL for email confirmation
          emailRedirectTo: window.location.origin + '/login?confirmed=true',
          // Add user metadata
          data: {
            email: email,
          }
        }
      });
      
      setIsLoading(false);
      
      if (error) {
        console.error('Error signing up:', error.message);
        return { error: error.message };
      }
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        // User was created but needs email confirmation
        console.log('User created, email confirmation required');
        return { 
          message: 'Please check your email and click the confirmation link to complete registration.' 
        };
      } else if (data.session) {
        // User was created and is automatically signed in (email confirmation disabled)
        console.log('User created and signed in automatically');
        return {};
      }
      
      return {};
    } catch (networkError) {
      console.error('Network error during signup:', networkError);
      setIsLoading(false);
      return { error: 'Network error: ' + (networkError as Error).message };
    }
  };
  
  // LOGOUT-FIX 2 - Enhanced logout with better state management
  const logout = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear local state first to prevent race conditions
      setUser(null);
      setProfile(null);
      
      // Clear Supabase session - try both scopes to be thorough
      try {
        const { error } = await supabase.auth.signOut({ scope: 'global' });
        
        if (error) {
          console.warn('Global logout error, trying local logout:', error.message);
          // If global logout fails, try local logout
          await supabase.auth.signOut({ scope: 'local' });
        }
      } catch (signOutError) {
        console.warn('Supabase logout error (continuing with cleanup):', signOutError);
        // Continue with cleanup even if Supabase logout fails
      }
      
      // Clear ALL possible localStorage and sessionStorage data
      const keysToRemove = [
        'search-cache',
        'search-results', 
        'user-preferences',
        'df_search_templates',
        'df_search_history',
        'df_recent_searches',
        'df_accumulated_results',
        'df_prospect_lists',
        'lastResultsUrl',
        'lastAddedCount',
        'selectedProspect',
        'PROFILE_FINDER_QUERY_CACHE' // React Query persistence key
      ];
      
      keysToRemove.forEach(key => {
        try {
          localStorage.removeItem(key);
          sessionStorage.removeItem(key);
        } catch (e) {
          console.warn(`Failed to remove ${key}:`, e);
        }
      });
      
      // Clear all df_ prefixed keys and any results/search related keys
      const allKeys: string[] = [];
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (
            key.startsWith('df_') || 
            key.includes('search') || 
            key.includes('result') || 
            key.includes('profile') ||
            key.includes('cache') ||
            key.includes('query') ||
            key.includes('PROFILE_FINDER')
          )) {
            allKeys.push(key);
          }
        }
        allKeys.forEach(key => localStorage.removeItem(key));
      } catch (e) {
        console.warn('Failed to clear all keys:', e);
      }
      
      // Clear all session storage
      try {
        sessionStorage.clear();
      } catch (e) {
        console.warn('Failed to clear sessionStorage:', e);
      }
      
    } catch (error) {
      console.error('💥 Logout error:', error);
      setError('Logout failed');
      // Ensure state is cleared even if there's an error
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetPassword = async (email: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin + '/reset-password',
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error resetting password:', error.message);
      return { error: error.message };
    }
    
    return {};
  };
  
  const updatePassword = async (newPassword: string) => {
    setIsLoading(true);
    
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    
    setIsLoading(false);
    
    if (error) {
      console.error('Error updating password:', error.message);
      return { error: error.message };
    }
    
    return {};
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,  // Use the derived isAdmin value
        error,
        login,
        loginWithProvider,
        signup,
        logout,
        resetPassword,
        updatePassword,
        refreshSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};