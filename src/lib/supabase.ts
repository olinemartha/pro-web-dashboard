/**
 * Client Supabase du navigateur.
 * La clé publique (publishable) est faite pour être exposée : ce sont les règles RLS
 * de la base qui protègent les données (chaque entreprise ne voit que les siennes).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

// Valeurs nettoyées : une variable collée avec un retour à la ligne (hébergeur) ne doit pas casser le site.
const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined)?.trim();
const key = ((import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined)?.trim();

// Hors ligne (npm run hors-ligne), le client existe mais n'est jamais appelé : aucune clé n'est exigée.
const offline = import.meta.env.MODE === "offline";

if (!offline && (!url || !key)) {
  throw new Error("Configuration Supabase manquante : copiez .env.example en .env.local et renseignez le projet.");
}

export const supabase = createClient<Database>(url || "http://localhost", key || "hors-ligne", {
  auth: offline
    ? { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false }
    : { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
