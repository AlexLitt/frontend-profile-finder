// Disable Vite's default focus-based reload behavior in development
if (import.meta.hot) {
  // Override the default focus event handler that triggers reloads
  const originalAddEventListener = window.addEventListener;
  window.addEventListener = function(type: string, listener: any, options?: any) {
    // Block focus events that might trigger dev server reloads
    if (type === 'focus' && typeof listener === 'function') {
      const listenerString = listener.toString();
      // Skip focus listeners that might be from Vite's dev client
      if (listenerString.includes('import.meta.hot') || 
          listenerString.includes('vite') || 
          listenerString.includes('__vite')) {
        console.log('[Dev] Blocked focus-based reload listener');
        return;
      }
    }
    return originalAddEventListener.call(this, type, listener, options);
  };

  // Disable automatic page refresh on visibility change
  const originalVisibilityChange = document.addEventListener;
  const blockVisibilityReload = (event: Event) => {
    if (document.visibilityState === 'visible') {
      console.log('[Dev] Tab focused, but reload blocked');
      event.stopImmediatePropagation();
    }
  };

  // Override visibility change events that might trigger reloads
  document.addEventListener('visibilitychange', blockVisibilityReload, { capture: true });
}
