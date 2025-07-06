import React from 'react'
import ReactDOM from 'react-dom/client'
import { HeroUIProvider, ToastProvider } from "@heroui/react"
import App from './App.tsx'
import './index.css'

// Disable focus-based reloads in development
if (import.meta.env.DEV) {
  import('./no-focus-reload.ts');
  // Remove old test imports that clutter console
  // import('./test-database.js');
  // import('./test-profile-creation.js');
  // import('./create-profile-for-current-user.js');
  // import('../debug-supabase-406.js');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  // <React.StrictMode>
    <HeroUIProvider>
      <ToastProvider />
      <App />
    </HeroUIProvider>
  // </React.StrictMode>,
)