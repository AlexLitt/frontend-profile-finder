import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Import pages and layouts
import DashboardLayout from "./layouts/dashboard-layout";
import AuthLayout from "./layouts/auth-layout";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import ResetPasswordPage from "./pages/reset-password";
import DashboardPage from "./pages/dashboard";
import SearchPage from "./pages/search";
import ResultsPage from "./pages/results";
import ListsPage from "./pages/lists";
import SettingsPage from "./pages/settings";
import AdminPage from "./pages/admin";
import { AuthProvider } from "./contexts/auth-context";
import { ErrorBoundary } from "./components/ErrorBoundary";

// Import error suppression for Supabase noise
import "./utils/suppressSupabaseErrors";

// Create a client with persistence and error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // Data is fresh for 10 minutes
      gcTime: 1000 * 60 * 60, // Cache is kept for 60 minutes
      retry: (failureCount, error) => {
        // Don't retry auth errors
        if (error && typeof error === 'object' && 'status' in error) {
          const status = (error as any).status;
          if (status === 401 || status === 403) {
            return false;
          }
        }
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on component mount if data exists
    },
    mutations: {
      retry: 1, // Retry mutations once
    }
  }
});

// Set up localStorage persistence with error handling
let localStoragePersister;
try {
  localStoragePersister = createSyncStoragePersister({
    storage: window.localStorage,
    key: 'PROFILE_FINDER_QUERY_CACHE', // Storage key prefix
    throttleTime: 1000, // Save to storage at max once per second
  });

  // Configure persistence with error handling
  try {
    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 1000 * 60 * 60 * 24, // 24 hours
      dehydrateOptions: {
        // Only cache search results to avoid issues with other query types
        shouldDehydrateQuery: (query) => {
          try {
            return query.queryKey[0] === 'searchResults';
          } catch (e) {
            console.warn('Query dehydration error:', e);
            return false;
          }
        }
      },
    });
  } catch (persistError) {
    console.warn('Failed to restore query cache:', persistError);
    // Clear potentially corrupted cache
    try {
      localStorage.removeItem('PROFILE_FINDER_QUERY_CACHE');
    } catch (e) {
      console.warn('Failed to clear corrupted cache:', e);
    }
  }
} catch (error) {
  console.warn('Failed to set up query persistence:', error);
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Auth routes - wrapped in AuthLayout which handles redirects */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
              </Route>
              
              {/* Main app routes - with auth check in DashboardLayout */}
              <Route path="/" element={<DashboardLayout />}>
                <Route index element={<DashboardPage />} />
                <Route path="search" element={<SearchPage />} />
                <Route path="results" element={<ResultsPage />} />
                <Route path="lists" element={<ListsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
            </Routes>
          </AuthProvider>
        </BrowserRouter>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}