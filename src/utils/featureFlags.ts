/**
 * Feature flags for toggling functionality across the application
 */

// COPILOT FIX INT-HIDE: Flag to control visibility of CRM integration buttons
export const INTEGRATIONS_ENABLED = import.meta.env.VITE_INTEGRATIONS_ENABLED === 'true';

// Helper function to check if a feature is enabled
export function isFeatureEnabled(feature: string): boolean {
  switch (feature) {
    case 'integrations':
      return INTEGRATIONS_ENABLED;
    default:
      return false;
  }
}
