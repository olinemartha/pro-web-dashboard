import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect } from "react";

import "../index.css";
import { AppShell } from "../components/app/app-shell";
import { CompanyShell } from "../components/company/company-shell";
import { Toaster } from "../components/ui/sonner";
import { queryClient } from "../lib/query-client";

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
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Espace étudiant
          </Link>
          <Link
            to="/entreprise"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Espace entreprise
          </Link>
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

function RootComponent() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isCompanySpace = pathname.startsWith("/entreprise");

  return (
    <QueryClientProvider client={queryClient}>
      {isCompanySpace ? (
        <CompanyShell>
          <Outlet />
        </CompanyShell>
      ) : (
        <AppShell>
          <Outlet />
        </AppShell>
      )}
      <Toaster position="top-right" />
    </QueryClientProvider>
  );
}
