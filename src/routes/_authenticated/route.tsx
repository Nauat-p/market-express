import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

// Layout do app: NÃO exige login. O login só é solicitado em ações
// específicas (checkout, perfil, pedidos, endereços).
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: () => (
    <AppShell>
      <Outlet />
    </AppShell>
  ),
});
