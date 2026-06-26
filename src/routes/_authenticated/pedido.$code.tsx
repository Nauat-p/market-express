import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Check, Package, Bike, ShoppingBag } from "lucide-react";
import { orderByCodeQuery } from "@/lib/queries";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/pedido/$code")({
  ssr: false,
  loader: async ({ context, params }) => {
    const o = await context.queryClient.ensureQueryData(orderByCodeQuery(params.code));
    if (!o) throw notFound();
    return null;
  },
  component: OrderDetailPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="font-semibold">Pedido não encontrado</p>
      <Link to="/pedidos" className="text-primary text-sm mt-3 inline-block">
        Ver pedidos
      </Link>
    </div>
  ),
});

type OrderItem = {
  id: string;
  name: string;
  brand: string | null;
  image_url: string | null;
  quantity: number;
  line_total: number | string;
};

const steps = [
  { key: "received", label: "Recebido", icon: Check },
  { key: "preparing", label: "Preparando", icon: ShoppingBag },
  { key: "out_for_delivery", label: "A caminho", icon: Bike },
  { key: "delivered", label: "Entregue", icon: Package },
] as const;

const stepIndex = (status: string) =>
  steps.findIndex((s) => s.key === status);

function OrderDetailPage() {
  const { code } = Route.useParams();
  const { data } = useSuspenseQuery(orderByCodeQuery(code));
  if (!data) return null;
  const order = data;
  const items = (order.items as OrderItem[]) ?? [];
  const addr = order.address_snapshot as {
    label: string;
    street: string;
    number: string;
    complement?: string | null;
    neighborhood: string;
    city: string;
    state: string;
  };
  const idx = stepIndex(order.status);

  return (
    <div className="pb-12">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/pedidos" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Pedido {order.code}</h1>
      </header>

      <main className="px-5 py-5 space-y-6">
        <section className="bg-card ring-1 ring-border rounded-2xl p-5">
          <h2 className="text-sm font-semibold mb-4">Acompanhe seu pedido</h2>
          <ol className="space-y-4">
            {steps.map((s, i) => {
              const done = i <= idx;
              const active = i === idx;
              const Icon = s.icon;
              return (
                <li key={s.key} className="flex items-center gap-3">
                  <span
                    className={`size-9 rounded-full grid place-items-center transition-colors ${
                      done
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <Icon className="size-4" strokeWidth={2.5} />
                  </span>
                  <span
                    className={`text-sm ${
                      active
                        ? "font-bold text-foreground"
                        : done
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-2 px-1">Itens ({items.length})</h2>
          <ul className="space-y-2">
            {items.map((it) => (
              <li
                key={it.id}
                className="bg-card ring-1 ring-border rounded-2xl p-3 flex gap-3"
              >
                <div className="size-14 rounded-xl bg-muted overflow-hidden shrink-0">
                  {it.image_url && (
                    <img src={it.image_url} alt="" className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium line-clamp-1">{it.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {it.quantity}× · {formatBRL(Number(it.line_total))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h2 className="text-sm font-semibold mb-2 px-1">Entrega</h2>
          <div className="bg-card ring-1 ring-border rounded-2xl p-4">
            <p className="text-sm font-semibold">{addr.label}</p>
            <p className="text-xs text-muted-foreground leading-snug">
              {addr.street}, {addr.number}
              {addr.complement ? ` · ${addr.complement}` : ""}
              <br />
              {addr.neighborhood} · {addr.city}/{addr.state}
            </p>
          </div>
        </section>

        <section className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-2">
          <Row label="Subtotal" value={formatBRL(Number(order.subtotal))} />
          <Row
            label="Entrega"
            value={
              Number(order.delivery_fee) === 0
                ? "Grátis"
                : formatBRL(Number(order.delivery_fee))
            }
          />
          <div className="h-px bg-border my-2" />
          <Row
            label={<span className="font-semibold text-foreground">Total</span>}
            value={
              <span className="text-lg font-bold text-foreground">
                {formatBRL(Number(order.total))}
              </span>
            }
          />
          <Row label="Pagamento" value={paymentLabel(order.payment_method)} />
        </section>
      </main>
    </div>
  );
}

function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function paymentLabel(p: string) {
  return (
    {
      pix: "PIX",
      credit: "Cartão de crédito (entrega)",
      debit: "Cartão de débito (entrega)",
      cash: "Dinheiro (entrega)",
    } as Record<string, string>
  )[p] ?? p;
}
