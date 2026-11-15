import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { AuthBrand, AuthPreview, PasswordInput } from "@/components/auth/auth-ui";
import { ARROW_NUDGE, Field } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reinitialiser")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — StageManager" },
      { name: "description", content: "Choisissez un nouveau mot de passe pour votre compte StageManager." },
    ],
  }),
  component: ResetPage,
});

/** Page ouverte depuis le lien « mot de passe oublié » reçu par e-mail. */
function ResetPage() {
  const navigate = useNavigate();
  const session = useAuth((state) => state.session);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<{ password?: string; confirm?: string }>({});
  const [pending, setPending] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (password.length < 8) next.password = "8 caractères minimum.";
    if (confirm !== password) next.confirm = "Les deux saisies ne correspondent pas.";
    setErrors(next);
    if (next.password || next.confirm) {
      document.getElementById(next.password ? "reset-password" : "reset-confirm")?.focus();
      return;
    }
    setPending(true);
    const result = await useAuth.getState().updatePassword(password);
    setPending(false);
    if (!result.ok) {
      setErrors({ password: result.error });
      document.getElementById("reset-password")?.focus();
      return;
    }
    toast.success("Mot de passe modifié", { description: "Utilisez-le désormais pour vous connecter." });
    const current = useAuth.getState().session;
    navigate({ to: current ? (current.onboarded ? ROLE_HOME[current.role] : "/inscription") : "/connexion" });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1360px] gap-4 sm:min-h-[calc(100vh-2rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <main className="flex flex-col rounded-2xl bg-card px-5 py-6 sm:px-10 sm:py-8">
          <AuthBrand />
          <Reveal className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
            {session ? (
              <>
                <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-[28px] sm:leading-tight">
                  Nouveau mot de passe
                </h1>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  Choisissez le mot de passe StageManager du compte <span className="font-medium text-foreground">{session.email}</span>. Il remplace l'ancien.
                </p>
                <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
                  <Field label="Nouveau mot de passe" htmlFor="reset-password" required error={errors.password} hint="Propre à StageManager : pas celui de votre messagerie. 8 caractères minimum.">
                    <PasswordInput
                      id="reset-password"
                      autoComplete="new-password"
                      placeholder="Créez un mot de passe"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setErrors((current) => ({ ...current, password: undefined }));
                      }}
                    />
                  </Field>
                  <Field label="Confirmer le mot de passe" htmlFor="reset-confirm" required error={errors.confirm}>
                    <PasswordInput
                      id="reset-confirm"
                      autoComplete="new-password"
                      placeholder="Saisissez-le à nouveau"
                      value={confirm}
                      onChange={(event) => {
                        setConfirm(event.target.value);
                        setErrors((current) => ({ ...current, confirm: undefined }));
                      }}
                    />
                  </Field>
                  <Button type="submit" className="group h-11 w-full" disabled={pending}>
                    {pending ? "Enregistrement…" : "Enregistrer le mot de passe"}
                    {!pending && <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />}
                  </Button>
                </form>
              </>
            ) : (
              <>
                <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-[28px] sm:leading-tight">Lien expiré ou déjà utilisé</h1>
                <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
                  Demandez un nouveau lien depuis la page de connexion, avec « Mot de passe oublié ? ».
                </p>
                <Button asChild className="group mt-8 h-11 w-full">
                  <Link to="/connexion">
                    Aller à la connexion
                    <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />
                  </Link>
                </Button>
              </>
            )}
          </Reveal>
          <p className="text-center text-xs text-muted-foreground">StageManager · FINCA RDC</p>
        </main>
        <AuthPreview />
      </div>
    </div>
  );
}
