/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_N8N_WEBHOOK_BASE: string
  readonly VITE_N8N_WEBHOOK_PATH: string
  readonly VITE_N8N_BASIC_AUTH_USER: string
  readonly VITE_N8N_BASIC_AUTH_PASS: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
