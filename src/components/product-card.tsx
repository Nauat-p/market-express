import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Minus, Heart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { cartQuery, type Product } from "@/lib/queries";
import { formatBRL, calcDiscount } from "@/lib/format";
import { useAddToCart, useUpdateCartQty } from "@/hooks/use-cart";

type Variant = "carousel" | "grid";

export function ProductCard({ product, variant = "grid" }: { product: Product; variant?: Variant }) {
  const { data: cart = [] } = useQuery(cartQuery);
  const inCart = cart.find((c) => c.product_id === product.id);
  const add = useAddToCart();
  const update = useUpdateCartQty();
  const discount = calcDiscount(product.price, product.sale_price);
  const finalPrice = product.sale_price ?? product.price;

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={`bg-card ring-1 ring-border rounded-3xl p-3 flex flex-col ${
        variant === "carousel" ? "w-40 shrink-0" : "w-full"
      }`}
    >
      <Link
        to="/produto/$slug"
        params={{ slug: product.slug }}
        className="block relative aspect-square rounded-2xl overflow-hidden bg-muted mb-3"
      >
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full grid place-items-center text-3xl">📦</div>
        )}
        {discount > 0 && (
          <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            -{discount}%
          </span>
        )}
        {product.is_new && discount === 0 && (
          <span className="absolute top-2 left-2 bg-accent text-accent-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
            NOVO
          </span>
        )}
      </Link>
      <div className="flex-1 min-w-0">
        {product.brand && (
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
            {product.brand}
          </p>
        )}
        <p className="text-sm font-medium text-foreground line-clamp-2 leading-tight mb-1">
          {product.name}
        </p>
      </div>
      <div className="mt-2 flex items-end justify-between gap-2">
        <div className="flex flex-col leading-tight">
          {discount > 0 && (
            <span className="text-[10px] text-muted-foreground line-through">
              {formatBRL(product.price)}
            </span>
          )}
          <span className="text-sm font-semibold text-foreground">
            {formatBRL(finalPrice)}
            {product.unit && (
              <span className="text-[10px] font-normal text-muted-foreground"> /{product.unit}</span>
            )}
          </span>
        </div>
        {inCart ? (
          <div className="flex items-center gap-1.5 bg-primary-soft rounded-xl px-1 py-1">
            <button
              type="button"
              aria-label="Diminuir"
              onClick={() =>
                update.mutate({ id: inCart.id, quantity: inCart.quantity - 1 })
              }
              className="size-6 rounded-lg grid place-items-center text-primary active:scale-95"
            >
              <Minus className="size-3.5" strokeWidth={2.5} />
            </button>
            <span className="text-xs font-bold text-primary min-w-[1ch] text-center">
              {inCart.quantity}
            </span>
            <button
              type="button"
              aria-label="Aumentar"
              onClick={() =>
                update.mutate({ id: inCart.id, quantity: inCart.quantity + 1 })
              }
              className="size-6 rounded-lg grid place-items-center text-primary active:scale-95"
            >
              <Plus className="size-3.5" strokeWidth={2.5} />
            </button>
          </div>
        ) : (
          <button
            type="button"
            aria-label="Adicionar ao carrinho"
            onClick={() => add.mutate({ product })}
            disabled={add.isPending}
            className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center shadow-sm active:scale-95 transition-transform"
          >
            <Plus className="size-4" strokeWidth={2.75} />
          </button>
        )}
      </div>
    </motion.div>
  );
}

export function ProductCardSkeleton({ variant = "grid" }: { variant?: Variant }) {
  return (
    <div
      className={`bg-card ring-1 ring-border rounded-3xl p-3 ${
        variant === "carousel" ? "w-40 shrink-0" : "w-full"
      }`}
    >
      <div className="aspect-square rounded-2xl bg-muted animate-pulse mb-3" />
      <div className="h-3 w-2/3 bg-muted rounded mb-2 animate-pulse" />
      <div className="h-4 w-1/2 bg-muted rounded animate-pulse" />
    </div>
  );
}

// Silence unused import (favorites coming soon)
export const _heart = Heart;
