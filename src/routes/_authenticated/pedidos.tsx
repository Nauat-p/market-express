import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, ChevronRight } from "lucide-react";
import { ordersQuery } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";

export const Route = createFileRoute("/_authenticated/pedidos")({
  ssr: false,
  component: OrdersPage,
});

const statusLabel: Record<string, { label: string; color: string }> = {
  received: { label: "Recebido", color: "bg-accent/20 text-foreground" },
  preparing: { label: "Preparando", color: "bg-primary-soft text-primary" },
  out_for_delivery: { label: "Saiu p/ entrega", color: "bg-primary-soft text-primary" },
  delivered: { label: "Entregue", color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Cancelado", color: "bg-destructive/15 text-destructive" },
};

function OrdersPage() {
  const { user, loading } = useAuth();
  const { data: orders = [], isLoading } = useQuery({
    ...ordersQuery,
    enabled: !!user,
  });
  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Meus pedidos</h1>
      </header>
      {!loading && !user ? (
        <SignInRequired
          title="Entre para ver pedidos"
          description="Seus pedidos ficam vinculados à sua conta."
        />
      ) : (
  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Meus pedidos</h1>
      </header>
      <main className="px-5 py-5">
        {isLoading ? (
          <p className="text-center text-sm text-muted-foreground py-10">Carregando…</p>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
              <Package className="size-7 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-xl mb-2">Nenhum pedido ainda</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Seus pedidos aparecem aqui.
            </p>
            <Link
              to="/home"
              className="inline-block bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold"
            >
              Começar a comprar
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {orders.map((o) => {
              const s = statusLabel[o.status] ?? statusLabel.received;
              return (
                <li key={o.id}>
                  <Link
                    to="/pedido/$code"
                    params={{ code: o.code }}
                    className="block bg-card ring-1 ring-border rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-semibold text-foreground">
                        {o.code}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full ${s.color}`}
                      >
                        {s.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-foreground font-semibold">
                          {formatBRL(Number(o.total))}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {new Date(o.created_at).toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <ChevronRight className="size-4 text-muted-foreground" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
