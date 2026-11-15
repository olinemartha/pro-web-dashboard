/**
 * Consultation par l'administrateur : il ouvre l'espace d'une entreprise ou d'un étudiant et voit
 * exactement ce que voit le titulaire, en lecture seule (rien n'est enregistré en son nom).
 * L'inverse n'existe pas : un étudiant ou une entreprise n'ouvre jamais l'espace administrateur.
 */
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ViewTarget = {
  kind: "entreprise" | "etudiant";
  /** Identifiant de l'entreprise, ou du compte étudiant. */
  id: string;
  name: string;
  email: string;
};

type ViewAsState = {
  target: ViewTarget | null;
  open: (target: ViewTarget) => void;
  close: () => void;
};

/** Espace ouvert pour chaque type de consultation. */
export const VIEW_HOME: Record<ViewTarget["kind"], string> = { entreprise: "/entreprise", etudiant: "/" };

export const READ_ONLY_MESSAGE = "Consultation en lecture seule : rien n'est modifié au nom de ce compte.";

export const useViewAs = create<ViewAsState>()(
  persist(
    (set) => ({
      target: null,
      open: (target) => set({ target }),
      close: () => set({ target: null }),
    }),
    // Gardé le temps de l'onglet : un rechargement de page reste dans l'espace consulté.
    { name: "sm.view-as", storage: createJSONStorage(() => sessionStorage) }
  )
);
