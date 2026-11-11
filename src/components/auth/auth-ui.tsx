import { forwardRef, useState } from "react";
import { Check, Eye, EyeOff, Layers } from "lucide-react";
import { LogoMark } from "@/components/shell/space-shell";
import { EXPERT_BORDER, EXPERT_CARD, ExpertBadge, RuleMeter, inputClass } from "@/components/company/ui";
import { cn } from "@/lib/utils";

/** Logo et nom, en tête des pages d'authentification. */
export function AuthBrand({ className }: { className?: string }) {
  return (
    <span className={cn("group inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span className="text-[15px] font-semibold tracking-tight">StageManager</span>
    </span>
  );
}

/** Champ mot de passe avec bouton « afficher / masquer ». */
export const PasswordInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function PasswordInput(
  { className, ...props },
  ref
) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative">
      <input ref={ref} {...props} type={visible ? "text" : "password"} className={cn(inputClass, "pr-11", className)} />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        aria-pressed={visible}
        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
});
(PasswordInput as unknown as { acceptsFieldProps: boolean }).acceptsFieldProps = true;

/**
 * Panneau de droite (grand écran) : ce que l'on trouve dans StageManager,
 * montré avec les vrais éléments de l'application (recommandation du système expert).
 */
export function AuthPreview() {
  return (
    <div className="relative hidden overflow-hidden rounded-2xl border bg-gradient-to-br from-primary-soft via-primary-soft/60 to-card lg:flex lg:flex-col lg:justify-center lg:px-12 xl:px-16">
      <div className="max-w-md">
        <h2 className="text-pretty text-2xl font-semibold leading-snug tracking-tight">Le stage, de la candidature à l'attestation</h2>
        <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
          Les offres qui correspondent au profil, des affectations expliquées par le système expert et le suivi du stage, au même endroit.
        </p>
      </div>

      <div className="relative mt-10 max-w-md" aria-hidden>
        {/* Offre recommandée par le système expert */}
        <div className={cn("card-surface relative rotate-[-1.5deg] p-5 shadow-[0_24px_48px_-24px_hsl(224_64%_33%/0.35)]", EXPERT_CARD, EXPERT_BORDER)}>
          <ExpertBadge label="Recommandée pour vous par le système expert" className="-mt-1 mb-3" />
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-xs font-semibold text-primary-foreground">FR</span>
            <div className="min-w-0">
              <p className="text-[15px] font-semibold tracking-tight">Stagiaire Data Analyst</p>
              <p className="text-xs text-muted-foreground">FINCA RDC · Direction IT</p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["SQL", "Excel"].map((skill) => (
              <span key={skill} className="inline-flex items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                <Check className="size-3" /> {skill}
              </span>
            ))}
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">Python</span>
          </div>
          <div className="mt-4 flex items-center justify-between border-t pt-3.5">
            <RuleMeter met={3} total={4} />
            <span className="text-xs text-muted-foreground">Clôture dans 34 j</span>
          </div>
        </div>

        {/* Affectation validée */}
        <div className="card-surface relative -mt-3 ml-16 rotate-[1.5deg] p-4 shadow-[0_24px_48px_-24px_hsl(224_64%_33%/0.3)]">
          <p className="text-[11px] font-medium text-muted-foreground">Votre affectation</p>
          <p className="mt-1 flex items-center gap-2 text-sm font-semibold">
            <Layers className="size-4 text-primary" /> Direction Crédit
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-success/30 bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success-ink">
              Service retenu
            </span>
            <RuleMeter met={4} total={4} showLabel={false} />
          </div>
        </div>
      </div>
    </div>
  );
}
