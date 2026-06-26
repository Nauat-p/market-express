import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { cartQuery } from "@/lib/queries";
import { useUpdateCartQty } from "@/hooks/use-cart";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/carrinho")({
  ssr: false,
  component: CartPage,
});

const FREE_DELIVERY_OVER = 50;
const DELIVERY_FEE = 5.99;

function CartPage() {
  const { data: cart = [], isLoading } = useQuery(cartQuery);
  const update = useUpdateCartQty();

  const subtotal = cart.reduce(
    (sum, i) => sum + (i.product.sale_price ?? i.product.price) * i.quantity,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Carrinho</h1>
      </header>

      {isLoading ? (
        <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>
      ) : cart.length === 0 ? (
        <div className="px-6 py-20 text-center">
          <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
            <ShoppingBag className="size-7 text-muted-foreground" />
          </div>
          <h2 className="font-serif italic text-xl mb-2">Carrinho vazio</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Adicione produtos para começar suas compras.
          </p>
          <Link
            to="/home"
            className="inline-block bg-primary text-primary-foreground rounded-2xl px-6 py-3 text-sm font-semibold"
          >
            Ver produtos
          </Link>
        </div>
      ) : (
        <>
          <main className="px-5 py-5 space-y-3">
            {cart.map((item) => {
              const price = item.product.sale_price ?? item.product.price;
              return (
                <div
                  key={item.id}
                  className="bg-card ring-1 ring-border rounded-2xl p-3 flex gap-3"
                >
                  <Link
                    to="/produto/$slug"
                    params={{ slug: item.product.slug }}
                    className="size-20 rounded-xl overflow-hidden bg-muted shrink-0"
                  >
                    {item.product.image_url ? (
                      <img
                        src={item.product.image_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </Link>
                  <div className="flex-1 min-w-0 flex flex-col">
                    {item.product.brand && (
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {item.product.brand}
                      </p>
                    )}
                    <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight">
                      {item.product.name}
                    </p>
                    <p className="text-sm font-semibold text-foreground mt-auto">
                      {formatBRL(price * item.quantity)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button
                      type="button"
                      aria-label="Remover"
                      onClick={() => update.mutate({ id: item.id, quantity: 0 })}
                      className="text-muted-foreground"
                    >
                      <Trash2 className="size-4" />
                    </button>
                    <div className="flex items-center gap-1.5 bg-primary-soft rounded-xl p-1">
                      <button
                        type="button"
                        aria-label="Diminuir"
                        onClick={() =>
                          update.mutate({ id: item.id, quantity: item.quantity - 1 })
                        }
                        className="size-7 rounded-lg grid place-items-center text-primary"
                      >
                        <Minus className="size-3.5" strokeWidth={2.5} />
                      </button>
                      <span className="text-xs font-bold text-primary min-w-[1ch] text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Aumentar"
                        onClick={() =>
                          update.mutate({ id: item.id, quantity: item.quantity + 1 })
                        }
                        className="size-7 rounded-lg grid place-items-center text-primary"
                      >
                        <Plus className="size-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            <section className="bg-card ring-1 ring-border rounded-2xl p-4 mt-5 space-y-2">
              <Row label="Subtotal" value={formatBRL(subtotal)} />
              <Row
                label="Entrega"
                value={
                  deliveryFee === 0 ? (
                    <span className="text-primary font-semibold">Grátis</span>
                  ) : (
                    formatBRL(deliveryFee)
                  )
                }
              />
              {subtotal > 0 && subtotal < FREE_DELIVERY_OVER && (
                <p className="text-[11px] text-muted-foreground">
                  Faltam {formatBRL(FREE_DELIVERY_OVER - subtotal)} para frete grátis
                </p>
              )}
              <div className="h-px bg-border my-2" />
              <Row
                label={<span className="text-foreground font-semibold">Total</span>}
                value={
                  <span className="text-lg font-bold text-foreground">
                    {formatBRL(total)}
                  </span>
                }
              />
            </section>
          </main>

          <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border safe-bottom px-5 pt-3 pb-3">
            <div className="max-w-md mx-auto">
              <Link
                to="/checkout"
                className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform"
              >
                Finalizar pedido · {formatBRL(total)}
              </Link>
            </div>
          </div>
        </>
      )}
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
