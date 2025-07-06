import { createClient } from '@supabase/supabase-js';
import { SearchResult } from '../api/profileSearch';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for our database tables
export interface DBSearchResult extends SearchResult {
  user_id: string;
  created_at: string;
  search_query: {
    titles: string;
    companies: string;
  };
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  titles: string;
  companies: string;
  created_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  default_export_format: 'csv' | 'excel';
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// Auth helper functions
export const getCurrentUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

// Cache management functions
export const cacheSearchResults = async (
  results: SearchResult[],
  searchParams: { titles: string; companies: string }
) => {
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('profiles')
    .insert(
      results.map(result => ({
        ...result,
        user_id: user.id,
        search_query: searchParams
      }))
    );

  if (error) {
    console.error('Error caching search results:', error);
    throw error;
  }

  return data;
};

export const getRecentSearches = async () => {
  const user = await getCurrentUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('Error fetching recent searches:', error);
    throw error;
  }

  return data;
};

export const saveSearch = async (
  name: string,
  searchParams: { titles: string; companies: string }
) => {
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('saved_searches')
    .insert({
      user_id: user.id,
      name,
      ...searchParams
    });

  if (error) {
    console.error('Error saving search:', error);
    throw error;
  }

  return data;
};

export const getUserPreferences = async () => {
  const user = await getCurrentUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('user_preferences')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle(); // Use maybeSingle to avoid 406 errors

  if (error && error.code !== 'PGNF') { // PGNF = not found
    console.error('Error fetching user preferences:', error);
    throw error;
  }

  return data;
};

export const updateUserPreferences = async (preferences: Partial<UserPreferences>) => {
  const user = await getCurrentUser();
  if (!user) return;

  const { data, error } = await supabase
    .from('user_preferences')
    .upsert({
      user_id: user.id,
      ...preferences,
      updated_at: new Date().toISOString()
    });

  if (error) {
    console.error('Error updating user preferences:', error);
    throw error;
  }

  return data;
};
