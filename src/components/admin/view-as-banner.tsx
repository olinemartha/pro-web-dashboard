import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowLeft, Eye } from "lucide-react";
import { SECTION_LINK } from "@/components/company/ui";
import { roleForPath, useAuth } from "@/lib/auth";
import { useViewAs } from "@/lib/view-as";
import { cn } from "@/lib/utils";

/**
 * Bandeau de consultation : l'administrateur voit l'espace d'un autre compte, en lecture seule.
 * Rien ne s'affiche pour les étudiants et les entreprises.
 */
export function ViewAsBanner() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = useAuth((state) => state.session?.role === "admin");
  const target = useViewAs((state) => state.target);
  if (!isAdmin || !target || roleForPath(pathname) !== target.kind) return null;

  return (
    <div role="status" className="flex shrink-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b bg-primary-soft px-4 py-2.5 sm:px-6 xl:px-8">
      <p className="flex min-w-0 items-center gap-2 text-[13px] text-primary">
        <Eye className="size-4 shrink-0" aria-hidden />
        <span className="min-w-0">
          Consultation de l'espace {target.kind === "entreprise" ? "de l'entreprise" : "de l'étudiant"}{" "}
          <span className="font-semibold">{target.name}</span>
          <span className="text-primary/80"> · lecture seule</span>
        </span>
      </p>
      <Link to="/admin/utilisateurs" className={cn(SECTION_LINK, "group bg-card")}>
        <ArrowLeft className="size-3.5" /> Revenir à l'administration
      </Link>
    </div>
  );
}
