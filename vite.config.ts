import react from "@vitejs/plugin-react";
import {defineConfig} from "vite";

import vitePluginInjectDataLocator from "./plugins/vite-plugin-inject-data-locator";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    hmr: {
      // Disable overlay errors that can trigger reloads
      overlay: false,
      // Prevent client-side reload on focus
      clientPort: undefined,
    },
    watch: {
      // Reduce aggressive file watching that can trigger reloads
      usePolling: false,
      interval: 1000,
      binaryInterval: 2000,
      ignored: ['**/node_modules/**', '**/.git/**'],
      // Disable focus-based file system checks
      followSymlinks: false,
      disableGlobbing: false,
    }
  },
  // Configure client-side settings
  define: {
    // Disable automatic refresh on window focus
    '__VITE_IS_MODERN__': true,
  },
  optimizeDeps: {
    // Prevent dependency re-bundling on focus
    force: false,
  },
  // Ensure HMR works properly without full page reloads
  build: {
    rollupOptions: {
      // Preserve module state during development
      preserveEntrySignatures: 'strict'
    }
  }
});
