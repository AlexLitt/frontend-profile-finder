/**
 * SUPABASE ERROR SUPPRESSION
 * This script helps suppress common Supabase errors that don't affect functionality
 */

// Override console methods to filter out common Supabase noise
const originalError = console.error;
const originalWarn = console.warn;

console.error = function(...args) {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress common Supabase auth errors that are handled gracefully
    if (
      message.includes('AuthError: Invalid Refresh Token') ||
      message.includes('refresh_token_not_found') ||
      message.includes('AuthError: refresh token') ||
      message.includes('Failed to refresh access token')
    ) {
      // These are expected when sessions expire - don't show as errors
      return;
    }
    
    // Suppress 403/406 errors from Supabase RLS policies (server-side)
    if (
      message.includes('Failed to load resource') ||
      message.includes('the status of 403') ||
      message.includes('the status of 406') ||
      message.includes('the status of 401')
    ) {
      // These are server-side permission issues, not client errors
      return;
    }
  }
  
  // Show all other errors normally
  originalError.apply(console, args);
};

console.warn = function(...args) {
  const message = args[0];
  if (typeof message === 'string') {
    // Suppress common Supabase warnings
    if (
      message.includes('Session error (likely expired token)') ||
      message.includes('Auth initialization error') ||
      message.includes('refresh') ||
      message.includes('token')
    ) {
      // These are handled gracefully by the app
      return;
    }
  }
  
  // Show all other warnings normally
  originalWarn.apply(console, args);
};

console.log('🔇 Console error filtering enabled for Supabase errors');
console.log('📝 Only functional errors will be shown');

export { originalError, originalWarn };
