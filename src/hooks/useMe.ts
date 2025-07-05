// COPILOT FIX AUTH-ENDPOINT
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/auth-context';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  isAdmin: boolean;
  fullName?: string;
  avatarUrl?: string;
}

/**
 * Custom hook to fetch current user profile from /api/me
 * Currently disabled as API server is not running
 */
export function useMe() {
  const { isAuthenticated, user } = useAuth();
  const queryClient = useQueryClient();
  
  // Disabled for now - return auth context data instead
  return {
    data: null,
    isLoading: false,
    error: null,
    refetch: () => Promise.resolve()
  };
  
  /* DISABLED - Uncomment when API server is configured
  const fetchUserProfile = async (): Promise<UserProfile> => {
    if (!isAuthenticated || !user) {
      throw new Error('Not authenticated');
    }
    
    const token = await getAuthToken();
    
    const response = await fetch('/api/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    
    return response.json();
  };
  
  return useQuery({
    queryKey: ['me'],
    queryFn: fetchUserProfile,
    enabled: isAuthenticated && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: false
  });
  */
}

/**
 * LOGOUT-FIX 2 - Enhanced logout hook with comprehensive cleanup
 * Custom hook to log out the user with full cache clearing
 */
export function useLogout() {
  const { logout } = useAuth();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      try {
        // Try to call API logout endpoint (optional for Supabase, but good practice)
        // Only if API server is available
        try {
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include' // Include cookies if any
          });
        } catch (apiError) {
          // API server not available - continue anyway
          console.log('API logout not available, continuing with local logout');
        }
        
        // Clear React Query cache before auth logout to prevent race conditions
        queryClient.clear();
        
        // Call the auth context logout (this handles Supabase + localStorage)
        await logout();
        
        // Double-check cache is cleared
        queryClient.removeQueries();
        queryClient.invalidateQueries();
        
      } catch (error) {
        // Even on error, clear cache to prevent stale data
        queryClient.clear();
        throw error; // Re-throw to handle in UI
      }
    },
    onError: (error) => {
      console.error('Logout mutation failed:', error);
      // Final cache clear attempt
      queryClient.clear();
    }
  });
}

/**
 * Helper to get the current auth token
 */
export async function getAuthToken(): Promise<string> {
  try {
    // This assumes you're using Supabase, but the approach would be similar
    // for other auth providers
    const { data } = await import('../lib/supabase').then(
      module => module.supabase.auth.getSession()
    );
    
    return data.session?.access_token ?? '';
  } catch (error) {
    console.warn('Failed to get auth token:', error);
    return '';
  }
}
