import { cn } from "@/lib/utils";

type StampTone = "success" | "primary";

const TONE_CLASSES: Record<StampTone, string> = {
  success: "text-success",
  primary: "text-primary",
};

/**
 * Le tampon du guichet.
 *
 * Il ne marque que les actes qui engagent l'entreprise : l'affectation
 * validée et l'attestation validée. Le double filet, l'encre pleine et la
 * légère inclinaison reprennent le geste administratif ; la date rend l'acte
 * daté comme sur un document papier.
 *
 * La lisibilité ne dépend jamais du tampon : la même information reste
 * écrite en clair à côté (date, auteur, source). Il est donc décoratif pour
 * l'assistance technique, et purement visuel pour le reste.
 */
export function Stamp({
  label,
  detail,
  tone = "success",
  className,
}: {
  label: string;
  detail?: string;
  tone?: StampTone;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "stamp-press relative inline-flex shrink-0 rotate-[-2deg] flex-col items-center rounded-sm border-2 px-3 py-1.5 text-center",
        TONE_CLASSES[tone],
        className
      )}
      aria-hidden="true"
    >
      <span className="pointer-events-none absolute inset-[3px] rounded-[2px] border border-current opacity-30" />
      {/* design-ok: lettrage de tampon officiel, volontairement gras */}
      <span className="relative text-[11px] font-bold uppercase leading-none tracking-[0.14em]">
        {label}
      </span>
      {detail && (
        <span className="relative mt-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] tabular-nums">
          {detail}
        </span>
      )}
    </span>
  );
}

/** Date courte pour le tampon : « 03 nov. 2026 ». */
export function stampDate(value: string) {
  return new Date(value).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
