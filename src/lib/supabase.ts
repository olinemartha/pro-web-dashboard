/**
 * Client Supabase du navigateur.
 * La clé publique (publishable) est faite pour être exposée : ce sont les règles RLS
 * de la base qui protègent les données (chaque entreprise ne voit que les siennes).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

if (!url || !key) {
  throw new Error("Configuration Supabase manquante : copiez .env.example en .env.local et renseignez le projet.");
}

export const supabase = createClient<Database>(url, key, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});
