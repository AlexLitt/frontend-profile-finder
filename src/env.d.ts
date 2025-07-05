/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_BASE: string
  readonly VITE_N8N_WEBHOOK_PATH: string
  readonly VITE_N8N_BASIC_AUTH_USER: string
  readonly VITE_N8N_BASIC_AUTH_PASS: string
  readonly VITE_USE_CORS_PROXY: string
  readonly VITE_INTEGRATIONS_ENABLED: string // COPILOT FIX INT-HIDE: Flag to control visibility of CRM integration buttons
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
