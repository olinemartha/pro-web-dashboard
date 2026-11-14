import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useNavigate,
  useRouter,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState } from "react";

import "../index.css";
import { AppShell } from "../components/app/app-shell";
import { CompanyShell } from "../components/company/company-shell";
import { AdminShell } from "../components/admin/admin-shell";
import { ROLE_HOME, isPublicPath, roleForPath, useAuth } from "../lib/auth";
import { startRemote } from "../lib/remote";
import { Toaster } from "../components/ui/sonner";
import { queryClient } from "../lib/query-client";

function HomeLink() {
  const session = useAuth((state) => state.session);
  return (
    <Link
      to={session ? ROLE_HOME[session.role] : "/connexion"}
      className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
    >
      {session ? "Retour à l'accueil" : "Se connecter"}
    </Link>
  );
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page non trouvée</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <HomeLink />
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    router.invalidate();
    reset();
  }, [error, router, reset]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          Cette page n'a pas pu charger
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Une erreur est survenue. Vous pouvez rafraîchir ou revenir à l'accueil.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Réessayer
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Accueil
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { title: "StageManager — Plateforme de stages" },
      { name: "description", content: "Trouvez, suivez et réussissez votre stage avec StageManager." },
    ],
  }),
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

/**
 * Où doit aller la personne ? Sans session : connexion. Inscription inachevée : onboarding.
 * Connectée : uniquement l'espace de son rôle (le changement d'espace n'existe plus).
 */
function useRedirect(pathname: string) {
  const session = useAuth((state) => state.session);
  const isPublic = isPublicPath(pathname);
  if (!session) return isPublic ? null : "/connexion";
  if (!session.onboarded) return pathname === "/inscription" ? null : "/inscription";
  if (isPublic) return ROLE_HOME[session.role];
  if (roleForPath(pathname) !== session.role) return ROLE_HOME[session.role];
  return null;
}

/** Compte connecté et inscrit : données chargées depuis Supabase, enregistrées et suivies en temps réel. */
function useRemoteData() {
  const session = useAuth((state) => state.session);
  const [loaded, setLoaded] = useState<string | null>(null);
  const key = session?.onboarded ? `${session.userId}:${session.role}:${session.companyId ?? ""}` : null;
  useEffect(() => {
    if (!session || !key) return;
    return startRemote(session, () => setLoaded(key));
    // La session ne change de sens que si la clé change (rôle, entreprise, compte).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return !key || loaded === key;
}

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const ready = useAuth((state) => state.ready);
  const redirect = useRedirect(pathname);
  const dataReady = useRemoteData();

  useEffect(() => useAuth.getState().init(), []);

  useEffect(() => {
    if (ready && redirect) navigate({ to: redirect, replace: true });
  }, [ready, redirect, navigate]);

  const space = roleForPath(pathname);
  const content = !ready || redirect || (!isPublicPath(pathname) && !dataReady) ? (
    <div className="min-h-screen bg-background" aria-busy="true" />
  ) : isPublicPath(pathname) ? (
    <Outlet />
  ) : space === "admin" ? (
    <AdminShell>
      <Outlet />
    </AdminShell>
  ) : space === "entreprise" ? (
    <CompanyShell>
      <Outlet />
    </CompanyShell>
  ) : (
    <AppShell>
      <Outlet />
    </AppShell>
  );

  return (
    <QueryClientProvider client={queryClient}>
      {content}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
