/**
 * Fichiers enregistrés dans Supabase Storage. Le CV de l'étudiant est privé :
 * lui-même, les entreprises où il a postulé et l'administrateur peuvent seulement le lire (règles en base).
 */
import { toast } from "sonner";
import { supabase } from "./supabase";
import { READ_ONLY_MESSAGE, useViewAs } from "./view-as";

const cvPath = (studentId: string) => `${studentId}/cv.pdf`;

/** Dépose (ou remplace) le CV du compte connecté. Renvoie un message d'erreur, sinon null. */
export async function uploadCv(studentId: string, file: File): Promise<string | null> {
  if (useViewAs.getState().target) return READ_ONLY_MESSAGE;
  if (file.size > 5 * 1024 * 1024) return "Le CV dépasse 5 Mo : réduisez-le avant de le déposer.";
  const { error } = await supabase.storage.from("cv").upload(cvPath(studentId), file, { upsert: true, contentType: "application/pdf" });
  return error ? error.message : null;
}

/** Télécharge le CV d'un étudiant (lien temporaire de 5 minutes, droits vérifiés par la base). */
export async function downloadCv(studentId: string, fileName: string) {
  const { data, error } = await supabase.storage.from("cv").createSignedUrl(cvPath(studentId), 300, { download: fileName || "CV.pdf" });
  if (error || !data) {
    toast.error("CV indisponible", { description: "Le fichier n'a pas été déposé en ligne : le CV doit être téléversé à nouveau depuis le profil." });
    return;
  }
  // Le lien force le téléchargement : la page reste ouverte.
  window.location.assign(data.signedUrl);
}
