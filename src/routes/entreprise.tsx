import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/entreprise")({
  head: () => ({
    meta: [{ title: "Espace entreprise — StageManager" }],
  }),
  component: CompanyLayout,
});

function CompanyLayout() {
  return <Outlet />;
}
