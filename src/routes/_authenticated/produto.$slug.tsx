import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Plus, Minus } from "lucide-react";
import { motion } from "framer-motion";
import { productBySlugQuery, cartQuery } from "@/lib/queries";
import { formatBRL, calcDiscount } from "@/lib/format";
import { useAddToCart, useUpdateCartQty } from "@/hooks/use-cart";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/produto/$slug")({
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      productBySlugQuery(params.slug)
    );
    if (!data) throw notFound();
    return null;
  },
  component: ProductPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="font-semibold">Produto não encontrado</p>
      <Link to="/home" className="text-primary text-sm mt-3 inline-block">
        Voltar
      </Link>
    </div>
  ),
});

function ProductPage() {
  const { slug } = Route.useParams();
  const { data: product } = useSuspenseQuery(productBySlugQuery(slug));
  const { data: cart = [] } = useQuery(cartQuery);
  const add = useAddToCart();
  const update = useUpdateCartQty();

  if (!product) return null;

  const inCart = cart.find((c) => c.product_id === product.id);
  const discount = calcDiscount(product.price, product.sale_price);
  const finalPrice = product.sale_price ?? product.price;

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center bg-card ring-1 ring-border rounded-full -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
      </header>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5"
      >
        <div className="aspect-square rounded-3xl overflow-hidden bg-muted mb-5">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-6xl">📦</div>
          )}
        </div>

        {product.brand && (
          <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-1">
            {product.brand}
          </p>
        )}
        <h1 className="text-2xl font-serif italic text-foreground leading-tight mb-2">
          {product.name}
        </h1>
        {product.unit && (
          <p className="text-sm text-muted-foreground mb-4">Vendido por {product.unit}</p>
        )}

        <div className="flex items-baseline gap-3 mb-5">
          <span className="text-3xl font-semibold text-foreground">
            {formatBRL(finalPrice)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-sm text-muted-foreground line-through">
                {formatBRL(product.price)}
              </span>
              <span className="bg-destructive text-destructive-foreground text-[11px] font-bold px-2 py-0.5 rounded-full">
                -{discount}%
              </span>
            </>
          )}
        </div>

        {product.description && (
          <section className="mb-6">
            <h2 className="text-sm font-semibold mb-2">Sobre o produto</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          </section>
        )}

        <section className="bg-primary-soft rounded-2xl p-4">
          <h3 className="text-xs font-bold text-primary mb-1">Entrega rápida</h3>
          <p className="text-[11px] text-foreground/70">
            Entrega em até 35 minutos no seu bairro · Frete grátis acima de R$ 50
          </p>
        </section>
      </motion.div>

      <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border safe-bottom px-5 pt-3 pb-3">
        <div className="max-w-md mx-auto">
          {inCart ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-primary-soft rounded-2xl p-1.5">
                <button
                  type="button"
                  aria-label="Diminuir"
                  onClick={() =>
                    update.mutate({ id: inCart.id, quantity: inCart.quantity - 1 })
                  }
                  className="size-10 rounded-xl grid place-items-center text-primary bg-card active:scale-95"
                >
                  <Minus className="size-4" strokeWidth={2.5} />
                </button>
                <span className="text-base font-bold text-primary min-w-[2ch] text-center">
                  {inCart.quantity}
                </span>
                <button
                  type="button"
                  aria-label="Aumentar"
                  onClick={() =>
                    update.mutate({ id: inCart.id, quantity: inCart.quantity + 1 })
                  }
                  className="size-10 rounded-xl grid place-items-center text-primary bg-card active:scale-95"
                >
                  <Plus className="size-4" strokeWidth={2.5} />
                </button>
              </div>
              <Link
                to="/carrinho"
                className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3.5 text-center text-sm font-semibold active:scale-[.98] transition-transform"
              >
                Ver carrinho · {formatBRL(finalPrice * inCart.quantity)}
              </Link>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => add.mutate({ product })}
              disabled={add.isPending}
              className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-60"
            >
              <Plus className="size-4" strokeWidth={2.5} />
              Adicionar ao carrinho
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
