import { createFileRoute, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { EmptyNote } from "@/components/company/ui";
import { Stamp, stampDate } from "@/components/company/stamp";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useCompanyStore } from "@/lib/company-store";
import { fmtDate } from "@/lib/dates";
import { supabase } from "@/lib/supabase";
import { OFFLINE } from "@/lib/offline";
import { Award } from "lucide-react";

export const Route = createFileRoute("/attestation/$internId")({
  head: () => ({ meta: [{ title: "Attestation de stage — StageManager" }] }),
  component: CertificatePage,
});

type Issuer = { name: string; address: string; city: string; representative_name: string; representative_role: string };

/**
 * Attestation de fin de stage, prête à imprimer (ou à enregistrer en PDF depuis l'impression).
 * L'étudiant la voit une fois validée ; l'entreprise et l'administrateur peuvent la relire avant.
 */
function CertificatePage() {
  const { internId } = Route.useParams();
  const router = useRouter();
  const role = useAuth((state) => state.session?.role);
  const intern = useCompanyStore((state) => state.interns.find((entry) => entry.id === internId));
  const offer = useCompanyStore((state) => state.offers.find((entry) => entry.id === intern?.offerId));
  const [remoteIssuer, setIssuer] = useState<Issuer | null>(null);
  const profile = useCompanyStore((state) => state.profile);
  // Hors ligne, l'entreprise est celle de l'espace gardé sur l'ordinateur.
  const issuer: Issuer | null = OFFLINE
    ? { name: profile.name, address: profile.address, city: profile.city, representative_name: profile.representativeName, representative_role: profile.representativeRole }
    : remoteIssuer;

  useEffect(() => {
    if (OFFLINE || !offer?.companyId) return;
    void supabase
      .from("companies")
      .select("name, address, city, representative_name, representative_role")
      .eq("id", offer.companyId)
      .maybeSingle()
      .then(({ data }) => setIssuer(data));
  }, [offer?.companyId]);

  const visible = intern && (intern.certificate === "validee" || (intern.certificate === "generee" && role !== "etudiant"));
  const back = (
    <Button variant="outline" onClick={() => router.history.back()}>
      <ArrowLeft className="mr-2 size-4" /> Retour
    </Button>
  );

  if (!visible) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="card-surface w-full max-w-md pb-6">
          <EmptyNote
            icon={Award}
            title="Attestation indisponible"
            desc="Elle apparaît ici une fois rédigée puis validée par l'entreprise, après l'évaluation finale."
            className="py-10"
          />
          <div className="flex justify-center">{back}</div>
        </div>
      </div>
    );
  }

  const validated = intern.certificate === "validee";
  const reference = `SM-${intern.id.slice(0, 8).toUpperCase()}`;
  const issuedOn = intern.certificateValidatedAt ?? intern.certificateGeneratedAt ?? new Date().toISOString();
  const companyName = issuer?.name ?? "L'entreprise";

  return (
    <div className="min-h-screen bg-background px-4 py-6 print:bg-card print:p-0 sm:py-10">
      <div className="mx-auto flex max-w-[760px] flex-wrap items-center justify-between gap-3 print:hidden">
        {back}
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 size-4" /> Imprimer ou enregistrer en PDF
        </Button>
      </div>

      {!validated && (
        <p role="status" className="mx-auto mt-4 max-w-[760px] rounded-lg border border-warning/40 bg-warning-soft px-4 py-2.5 text-[13px] text-foreground print:hidden">
          Projet : l'attestation n'est pas encore validée. Le stagiaire la verra après validation.
        </p>
      )}

      <article className="card-surface mx-auto mt-4 max-w-[760px] px-6 py-10 print:mt-0 print:border-0 print:shadow-none sm:px-14 sm:py-14">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="min-w-0">
            <p className="text-[15px] font-semibold">{companyName}</p>
            {issuer && <p className="mt-0.5 text-xs text-muted-foreground">{[issuer.address, issuer.city].filter(Boolean).join(" · ")}</p>}
          </div>
          <p className="text-xs tabular-nums text-muted-foreground">Référence {reference}</p>
        </header>

        <h1 className="mt-10 text-center text-[24px] font-semibold uppercase tracking-[0.12em]">Attestation de stage</h1>

        <div className="mt-10 space-y-5 text-pretty text-[15px] leading-relaxed">
          <p>
            {companyName} atteste que <strong className="font-semibold">{intern.name}</strong> a effectué un stage
            {intern.service && intern.service !== "À affecter" ? <> au sein du service <strong className="font-semibold">{intern.service}</strong></> : null}
            {offer ? <>, en qualité de « {offer.title} »</> : null}
            {intern.start && intern.end ? <>, du {fmtDate(intern.start)} au {fmtDate(intern.end)}</> : null}.
          </p>
          {intern.missions && (
            <p>
              <span className="font-semibold">Missions confiées : </span>
              {intern.missions
                .split(/\n+/)
                .map((line) => line.trim())
                .filter(Boolean)
                .join(" ; ")}
              .
            </p>
          )}
          {intern.evaluation?.comment && (
            <p>
              <span className="font-semibold">Appréciation : </span>
              {intern.evaluation.comment}
            </p>
          )}
          <p>La présente attestation est délivrée pour servir et valoir ce que de droit.</p>
        </div>

        <footer className="mt-14 flex flex-wrap items-end justify-between gap-6">
          <div className="text-[13px]">
            <p>
              Fait{issuer?.city ? ` à ${issuer.city}` : ""}, le {fmtDate(issuedOn.slice(0, 10))}
            </p>
            {issuer?.representative_name && (
              <p className="mt-6">
                <span className="font-semibold">{issuer.representative_name}</span>
                {issuer.representative_role && <span className="block text-muted-foreground">{issuer.representative_role}</span>}
              </p>
            )}
          </div>
          {validated && <Stamp label="Attestation validée" detail={stampDate(issuedOn)} />}
        </footer>

        <p className="mt-12 border-t pt-4 text-center text-[11px] text-muted-foreground">
          Document émis par StageManager · Référence {reference}
        </p>
      </article>
    </div>
  );
}
