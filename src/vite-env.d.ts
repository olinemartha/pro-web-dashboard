/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Adresse de l'administratrice reconnue hors ligne (fichier .env.offline.local). */
  readonly VITE_OFFLINE_ADMIN_EMAIL?: string;
}
