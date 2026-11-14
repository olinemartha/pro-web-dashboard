import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { AuthBrand, AuthPreview, PasswordInput } from "@/components/auth/auth-ui";
import { ARROW_NUDGE, Field, inputClass } from "@/components/company/ui";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui/motion";
import { ROLE_HOME, useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — StageManager" },
      { name: "description", content: "Connectez-vous à votre espace StageManager : étudiant, entreprise ou administrateur." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [pending, setPending] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const next: typeof errors = {};
    if (!email.trim()) next.email = "Saisissez votre adresse e-mail.";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Saisissez une adresse e-mail valide.";
    if (!password) next.password = "Saisissez votre mot de passe.";
    setErrors(next);
    if (next.email || next.password) {
      document.getElementById(next.email ? "login-email" : "login-password")?.focus();
      return;
    }
    setPending(true);
    const result = await signIn(email, password);
    setPending(false);
    if (!result.ok) {
      const field = result.field ?? "email";
      setErrors({ [field]: result.error });
      document.getElementById(field === "email" ? "login-email" : "login-password")?.focus();
      return;
    }
    const session = useAuth.getState().session;
    if (session) navigate({ to: session.onboarded ? ROLE_HOME[session.role] : "/inscription" });
  };

  return (
    <div className="min-h-screen bg-background p-3 sm:p-4">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1360px] gap-4 sm:min-h-[calc(100vh-2rem)] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        {/* ============================ Formulaire ============================ */}
        <main className="flex flex-col rounded-2xl bg-card px-5 py-6 sm:px-10 sm:py-8">
          <AuthBrand />
          <Reveal className="mx-auto flex w-full max-w-[400px] flex-1 flex-col justify-center py-10">
            <h1 className="text-pretty text-2xl font-semibold tracking-tight sm:text-[28px] sm:leading-tight">
              Bon retour sur <span className="text-primary">StageManager</span>
            </h1>
            <p className="mt-2 text-pretty text-sm leading-relaxed text-muted-foreground">
              Connectez-vous avec votre adresse e-mail et le mot de passe créé à l'inscription sur StageManager. Votre espace s'ouvre selon votre profil.
            </p>

            <form className="mt-8 space-y-4" onSubmit={submit} noValidate>
              <Field label="E-mail" htmlFor="login-email" error={errors.email}>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  className={inputClass}
                  placeholder="Ex. prenom.nom@exemple.cd"
                  value={email}
                  onChange={(event) => {
                    setEmail(event.target.value);
                    setErrors((current) => ({ ...current, email: undefined }));
                  }}
                />
              </Field>
              <Field label="Mot de passe StageManager" htmlFor="login-password" error={errors.password}>
                <PasswordInput
                  id="login-password"
                  autoComplete="current-password"
                  placeholder="Votre mot de passe"
                  value={password}
                  onChange={(event) => {
                    setPassword(event.target.value);
                    setErrors((current) => ({ ...current, password: undefined }));
                  }}
                />
              </Field>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setForgotOpen((value) => !value)}
                  aria-expanded={forgotOpen}
                  className="-my-2 py-2 text-[13px] font-medium text-primary underline-offset-2 hover:underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              {forgotOpen && (
                <p className="animate-fade-in rounded-lg border bg-muted/40 px-3.5 py-2.5 text-pretty text-xs leading-relaxed text-muted-foreground">
                  La réinitialisation par e-mail sera active avec la connexion au serveur (Supabase). En attendant, contactez l'administrateur de la plateforme.
                </p>
              )}
              <Button type="submit" className="group h-11 w-full" disabled={pending}>
                {pending ? "Connexion…" : "Se connecter"}
                {!pending && <ArrowRight className={cn("ml-2 size-4", ARROW_NUDGE)} />}
              </Button>
            </form>

            <p className="mt-8 text-center text-[13px] text-muted-foreground">
              Pas encore de compte ?{" "}
              <Link to="/inscription" className="-my-2 py-2 font-semibold text-primary underline-offset-2 hover:underline">
                Créer un compte
              </Link>
            </p>
          </Reveal>
          <p className="text-center text-xs text-muted-foreground">StageManager · FINCA RDC</p>
        </main>

        {/* ============================ Aperçu ============================ */}
        <AuthPreview />
      </div>
    </div>
  );
}
