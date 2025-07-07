import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

// Define types for our user and subscription data
export type UserRole = 'user' | 'admin';

interface UserSubscription {
  plan: string;
  searchesRemaining: number;
  activeUntil: string;
}

export interface UserProfile {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  role: UserRole;
  subscription: UserSubscription;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: "google" | "linkedin") => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
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

// Helper function to convert database profile to app profile
const convertDbProfileToAppProfile = (dbProfile: any, subscription: any): UserProfile => {
  // Check if user is admin based on email
  const isAdminUser = dbProfile.email === import.meta.env.VITE_ADMIN_EMAIL;
  
  // Set default subscription based on user role
  const defaultSubscription = isAdminUser ? {
    plan: 'enterprise',
    searchesRemaining: 10000, // Admin gets high limit
    activeUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
  } : {
    plan: 'free',
    searchesRemaining: 10,
    activeUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
  };

  return {
    id: dbProfile.id,
    email: dbProfile.email,
    fullName: dbProfile.full_name || dbProfile.fullName || null, // Handle both column names
    avatarUrl: dbProfile.avatar_url || dbProfile.avatarUrl || null, // Handle both column names
    role: dbProfile.role || (isAdminUser ? 'admin' : 'user'), // Set admin role if admin email
    subscription: subscription || defaultSubscription
  };
};

// Helper functions for localStorage auth state persistence
const getPersistedAuthState = (): { isAuthenticated: boolean; userId: string | null } => {
  try {
    const stored = localStorage.getItem('auth_state_v1');
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.warn('[Auth] Failed to read persisted auth state:', error);
  }
  return { isAuthenticated: false, userId: null };
};

const setPersistedAuthState = (isAuthenticated: boolean, userId: string | null) => {
  try {
    localStorage.setItem('auth_state_v1', JSON.stringify({ isAuthenticated, userId }));
  } catch (error) {
    console.warn('[Auth] Failed to persist auth state:', error);
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  // Initialize with persisted auth state to prevent flash
  const persistedState = getPersistedAuthState();
  
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [appReady, setAppReady] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticatedState, setIsAuthenticatedState] = useState<boolean>(persistedState.isAuthenticated);
  const isMounted = useRef(true);
  const isLoadingProfile = useRef(false);
  const lastProcessedUserId = useRef<string | null>(null);

  // Immediately load cached profile if we have persisted auth state
  useEffect(() => {
    if (persistedState.isAuthenticated && persistedState.userId) {
      console.log('🔄 [IMMEDIATE] Loading cached profile for instant display...');
      
      // Try to load profile from cache immediately
      const cacheKey = `profile_${persistedState.userId}_v2`;
      try {
        const cachedProfile = localStorage.getItem(cacheKey);
        if (cachedProfile) {
          const parsed = JSON.parse(cachedProfile);
          if (parsed.profile) {
            const convertedProfile = convertDbProfileToAppProfile(parsed.profile, null);
            setProfile(convertedProfile);
            console.log('✅ [IMMEDIATE] Cached profile loaded instantly:', {
              email: convertedProfile.email,
              plan: convertedProfile.subscription.plan,
              searches: convertedProfile.subscription.searchesRemaining
            });
          }
        }
      } catch (error) {
        console.warn('⚠️ [IMMEDIATE] Failed to load cached profile:', error);
      }
    }
  }, []); // Run only once on mount

  // Cleanup on unmount
  useEffect(() => {
    return () => { 
      isMounted.current = false;
    };
  }, []);

  // Debug: Log app ready state changes
  const setAppReadyWithDebug = (ready: boolean, context: string = '') => {
    if (context) {
      console.log(`7️⃣ [REFRESH] App ready: ${ready} (${context})`);
    }
    if (isMounted.current) {
      setAppReady(ready);
    }
  };

  // Load user profile from database
  const loadProfile = useCallback(async (userId: string) => {
    if (!userId || !isMounted.current) {
      console.warn('⚠️ [REFRESH] loadProfile called without userId');
      setAppReadyWithDebug(true, 'loadProfile early exit - no userId');
      return;
    }

    // Prevent multiple simultaneous profile loads for the same user, but allow retries
    if (isLoadingProfile.current) {
      console.log('⏳ [REFRESH] Profile already loading, skipping duplicate request');
      return;
    }
    
    isLoadingProfile.current = true;
    lastProcessedUserId.current = userId;
    
    console.log('3️⃣ [REFRESH] Loading profile for userId:', userId);
    
    try {
      // Get current user info for fallback
      const { data: { user } } = await supabase.auth.getUser();
      const userEmail = user?.email || 'unknown@example.com';
      const isAdminUser = userEmail === import.meta.env.VITE_ADMIN_EMAIL;

      console.log('4️⃣ [REFRESH] Auth user verified:', {
        requestedUserId: userId,
        authUserId: user?.id,
        match: userId === user?.id
      });

      // Create a reliable fallback profile immediately
      const fallbackProfile = {
        id: userId,
        email: userEmail,
        role: (isAdminUser ? 'admin' : 'user') as UserRole,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const cacheKey = `profile_${userId}_v2`;
      let finalProfileData = fallbackProfile;

      // Try to get fresh data from auth.users first
      try {
        const { data: authUser, error: authError } = await supabase.auth.getUser();
        
        if (authUser?.user && !authError) {
          const userData = authUser.user;
          finalProfileData = {
            id: userData.id,
            email: userData.email || userEmail,
            role: isAdminUser ? 'admin' : 'user',
            created_at: userData.created_at,
            updated_at: userData.updated_at || userData.created_at,
            full_name: userData.user_metadata?.full_name || userData.user_metadata?.name || null,
            avatar_url: userData.user_metadata?.avatar_url || null
          };
          
          console.log('5️⃣ [REFRESH] Profile data ready:', {
            profileId: finalProfileData.id,
            match: userId === finalProfileData.id
          });
          
          // Update cache with fresh data
          try {
            localStorage.setItem(cacheKey, JSON.stringify({
              profile: finalProfileData,
              cached_at: new Date().toISOString()
            }));
          } catch (cacheError) {
            console.warn('⚠️ Cache write error:', cacheError);
          }
        } else {
          console.log('ℹ️ [REFRESH] Using fallback profile data');
        }
        
      } catch (dbError) {
        console.log('ℹ️ [REFRESH] Using fallback profile due to error');
      }

      // Convert and set profile
      const convertedProfile = convertDbProfileToAppProfile(finalProfileData, null);
      
      console.log('6️⃣ [REFRESH] Setting profile in React state');

      if (isMounted.current) {
        setProfile(convertedProfile);
        console.log('✅ [REFRESH] Profile set successfully');
      }

    } catch (error) {
      console.warn('⚠️ [REFRESH] Profile load error, using emergency fallback');
      
      if (isMounted.current && !profile) {
        const emergencyProfile = convertDbProfileToAppProfile({
          id: userId,
          email: 'fallback@example.com',
          role: 'user' as UserRole,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, null);
        
        setProfile(emergencyProfile);
      }
    } finally {
      isLoadingProfile.current = false;
      setAppReadyWithDebug(true, 'profile load complete');
    }
  }, [profile]);

  // Main auth initialization effect
  useEffect(() => {
    console.log('🚀 [REFRESH] Starting auth initialization...');
    
    // Initialize auth state
    const initializeAuth = async () => {
      let profileLoadTriggered = false;
      
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.warn('⚠️ [REFRESH] Session error:', sessionError.message);
          throw sessionError;
        }
        
        if (session?.user) {
          console.log('� [REFRESH] Session found, user ID:', session.user.id);
          if (isMounted.current) {
            setUser(session.user);
            updateAuthState(true, session.user.id);
            setError(null);
          }
          // ALWAYS load profile during initialization, even on refresh
          profileLoadTriggered = true;
          await loadProfile(session.user.id);
        } else {
          console.log('� [REFRESH] No session - anonymous access');
          if (isMounted.current) {
            setUser(null);
            setProfile(null);
            updateAuthState(false, null);
            setError(null);
            setAppReadyWithDebug(true, 'no session - anonymous ready');
          }
        }
      } catch (error) {
        console.warn('⚠️ [REFRESH] Auth initialization error:', error.message);
        if (isMounted.current) {
          setError('Failed to initialize authentication');
          setUser(null);
          setProfile(null);
          updateAuthState(false, null);
        }
      } finally {
        if (!profileLoadTriggered && isMounted.current && !appReady) {
          setAppReadyWithDebug(true, 'auth initialization complete - ensuring ready state');
        }
      }
    };
    
    // Fallback timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (!appReady && isMounted.current) {
        console.warn('⏰ [REFRESH] Timeout reached - forcing app ready');
        setAppReadyWithDebug(true, 'timeout fallback');
        setError('Authentication timeout - please try refreshing the page');
      }
    }, 10000); // 10 seconds timeout
    
    initializeAuth();
    
    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted.current) return;
        
        console.log('🔄 [REFRESH] Auth event:', event, session?.user?.id || 'no user');
        clearTimeout(timeoutId);
        
        try {
          if (event === 'SIGNED_IN' && session?.user) {
            if (isLoadingProfile.current) {
              console.log('⏳ [REFRESH] Profile loading, skipping duplicate SIGNED_IN');
              return;
            }
            
            setUser(session.user);
            updateAuthState(true, session.user.id);
            setError(null);
            
            // Reset tracking to force fresh load
            lastProcessedUserId.current = null;
            await loadProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            console.log('🔓 [REFRESH] User signed out');
            if (isMounted.current) {
              lastProcessedUserId.current = null;
              setUser(null);
              setProfile(null);
              updateAuthState(false, null);
              setError(null);
              setAppReadyWithDebug(true, 'signed out');
            }
          } else if (event === 'TOKEN_REFRESHED' && session?.user) {
            console.log('🔄 [REFRESH] Token refreshed');
            if (isMounted.current) {
              setUser(session.user);
              updateAuthState(true, session.user.id);
              setError(null);
              if (!appReady) {
                setAppReadyWithDebug(true, 'token refreshed - app ready');
              }
            }
          } else if (event === 'INITIAL_SESSION' && session?.user) {
            console.log('🆔 [REFRESH] Initial session event');
            if (user && user.id === session.user.id) {
              console.log('⏭️ [REFRESH] Skipping duplicate INITIAL_SESSION');
              return;
            }
            
            setUser(session.user);
            updateAuthState(true, session.user.id);
            setError(null);
            
            if (!isLoadingProfile.current) {
              await loadProfile(session.user.id);
            }
          }
        } catch (error) {
          console.error('❌ [REFRESH] Auth state change error:', error);
          if (isMounted.current) {
            setError('Authentication state change failed');
            setAppReadyWithDebug(true, 'auth state change error');
          }
        }
      }
    );

    return () => {
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Remove loadProfile from dependencies to prevent constant re-runs

  // Helper function to update authentication state and persist it
  const updateAuthState = (authenticated: boolean, userId: string | null = null) => {
    console.log(`2️⃣ [REFRESH] Auth state: ${authenticated ? 'AUTHENTICATED' : 'NOT_AUTHENTICATED'} (user: ${userId})`);
    setIsAuthenticatedState(authenticated);
    setPersistedAuthState(authenticated, userId);
  };

  // Effect to validate persisted auth state on mount
  useEffect(() => {
    const persistedState = getPersistedAuthState();
    if (persistedState.isAuthenticated && persistedState.userId) {
      console.log('1️⃣ [REFRESH] Found persisted auth for user:', persistedState.userId);
    } else if (persistedState.isAuthenticated && !persistedState.userId) {
      console.log('⚠️ [REFRESH] Clearing invalid persisted auth state');
      updateAuthState(false, null);
    }
  }, []);

  // Auth methods
  const login = async (email: string, password: string) => {
    setError(null);
    setAppReadyWithDebug(false, 'login start');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) {
      setError(error.message);
      setAppReadyWithDebug(true, 'login error');
      throw error;
    }

    // Successful login - clear any previous error state
    if (data.session) {
      setError(null);
    }
    // Don't set appReady here - let the auth state change handler do it
  };

  const loginWithProvider = async (provider: "google" | "linkedin") => {
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });
    
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    setError(null);
    setAppReadyWithDebug(false, 'signup start');
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`
        }
      });
      
      if (error) {
        setError(error.message);
        setAppReadyWithDebug(true, 'signup error');
        throw error;
      }

      // Check if email verification is required
      if (data?.user && !data.session) {
        return {
          message: "Please check your email for a verification link."
        };
      }

      // If we have a session, user is automatically logged in
      if (data?.session) {
        setUser(data.session.user);
        updateAuthState(true, data.session.user.id);
        await loadProfile(data.session.user.id);
      }

      return { data };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  };

  const logout = async () => {
    setError(null);
    
    // Clear profile cache for current user
    if (user?.id) {
      try {
        localStorage.removeItem(`profile_${user.id}_v2`);
        // Also remove old cache key format
        localStorage.removeItem(`profile_${user.id}`);
        console.log('[Auth] Profile cache cleared for user:', user.id);
      } catch (error) {
        console.warn('[Auth] Error clearing profile cache:', error);
      }
    }
    
    // Clear persisted auth state
    updateAuthState(false, null);
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  const updatePassword = async (newPassword: string) => {
    setError(null);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });
    
    if (error) {
      setError(error.message);
      throw error;
    }
  };

  // Refresh user session and profile data
  const refreshSession = async () => {
    if (!user || !isMounted.current) return;
    
    console.log('[Auth] Refreshing session...');
    setAppReadyWithDebug(false, 'refresh session start');
    
    try {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      
      if (error) throw error;
      
      if (session?.user && isMounted.current) {
        setUser(session.user);
        await loadProfile(session.user.id);
      }
    } catch (error) {
      console.error('[Auth] Session refresh failed:', error);
      if (isMounted.current) {
        setError('Failed to refresh session');
        setAppReadyWithDebug(true, 'refresh session error');
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated: isAuthenticatedState, // Use persistent auth state
        isLoading: !appReady, // Compatibility with existing code
        error,
        login,
        loginWithProvider,
        signup,
        logout,
        resetPassword,
        updatePassword,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};