import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { persistQueryClient } from '@tanstack/query-persist-client-core';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

// Import pages and layouts
import DashboardLayout from "./layouts/dashboard-layout";
import LoginPage from "./pages/login";
import SignupPage from "./pages/signup";
import DashboardPage from "./pages/dashboard";
import SearchPage from "./pages/search";
import ResultsPage from "./pages/results";
import ListsPage from "./pages/lists";
import SettingsPage from "./pages/settings";
import { AuthProvider } from "./contexts/auth-context";

// Create a client with persistence
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 10, // Data is fresh for 10 minutes
      gcTime: 1000 * 60 * 60, // Cache is kept for 60 minutes
      retry: 2,
      refetchOnWindowFocus: false,
      refetchOnMount: false, // Don't refetch on component mount if data exists
    },
  },
});

// Set up localStorage persistence
const localStoragePersister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'PROFILE_FINDER_QUERY_CACHE', // Storage key prefix
  throttleTime: 1000, // Save to storage at max once per second
});

// Configure persistence
persistQueryClient({
  queryClient,
  persister: localStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // 24 hours
  dehydrateOptions: {
    // Only cache search results to avoid issues with other query types
    shouldDehydrateQuery: (query) => 
      query.queryKey[0] === 'searchResults'
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Auth routes - will auto-redirect to dashboard */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Main app routes - no auth check */}
            <Route path="/" element={<DashboardLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="results" element={<ResultsPage />} />
              <Route path="lists" element={<ListsPage />} />
              <Route path="settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}