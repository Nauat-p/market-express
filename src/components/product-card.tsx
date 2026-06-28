import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Plus, Minus, Bookmark } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { cartQuery, type Product } from "@/lib/queries";
import { formatBRL, calcDiscount } from "@/lib/format";
import { useAddToCart, useUpdateCartQty } from "@/hooks/use-cart";
import { SaveProductSheet } from "@/components/save-product-sheet";
import { useFavorites } from "@/hooks/use-favorites";
import { useShoppingLists } from "@/hooks/use-shopping-lists";
import { toast } from "sonner";

type Variant = "carousel" | "grid";

export function ProductCard({ product, variant = "grid" }: { product: Product; variant?: Variant }) {
  const { data: cart = [] } = useQuery(cartQuery);
  const inCart = cart.find((c) => c.product_id === product.id);
  const add = useAddToCart();
  const update = useUpdateCartQty();
  const { isFavorite } = useFavorites();
  const { lists } = useShoppingLists();
  const [sheetOpen, setSheetOpen] = useState(false);

  const discount = calcDiscount(product.price, product.sale_price);
  const finalPrice = product.sale_price ?? product.price;
  const outOfStock = product.stock <= 0;

  // Mostra o ícone marcado se o produto está em favoritos OU em alguma lista
  const isSaved =
    isFavorite(product.id) ||
    lists.some((l) => l.items.some((i) => i.product_id === product.id));

  return (
    <>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`bg-card ring-1 ring-border rounded-3xl p-3 flex flex-col relative ${
          variant === "carousel" ? "w-40 shrink-0" : "w-full"
        }`}
      >
        {/* Save button */}
        <button
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSheetOpen(true); }}
          className={`absolute top-4 right-4 z-10 size-8 rounded-full grid place-items-center shadow-sm transition-colors ${
            isSaved
              ? "bg-primary text-primary-foreground"
              : "bg-card/80 backdrop-blur-sm text-muted-foreground"
          }`}
        >
          <Bookmark className={`size-4 ${isSaved ? "fill-current" : ""}`} />
        </button>

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
              className={`w-full h-full object-cover ${outOfStock ? "grayscale opacity-60" : ""}`}
            />
          ) : (
            <div className="w-full h-full grid place-items-center text-3xl">📦</div>
          )}
          {outOfStock && (
            <div className="absolute inset-0 bg-black/40 grid place-items-center">
              <span className="bg-white text-foreground text-[11px] font-bold px-3 py-1 rounded-full">
                Esgotado
              </span>
            </div>
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
          {product.stock > 0 && product.stock < 5 && (
            <span className="absolute bottom-2 left-2 bg-zinc-900/85 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
              Últimas {product.stock} unid.
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
              <span className="text-[10px] text-muted-foreground/70 line-through">
                {formatBRL(product.price)}
              </span>
            )}
            <span className="text-base font-bold text-foreground tracking-tight">
              {formatBRL(finalPrice)}
              {product.unit && (
                <span className="text-[11px] font-medium text-muted-foreground"> /{product.unit}</span>
              )}
            </span>
          </div>

          {inCart ? (
            <div className="flex items-center gap-1.5 bg-primary-soft rounded-xl px-1 py-1">
              <button
                type="button"
                aria-label="Diminuir"
                onClick={() => update.mutate({ id: inCart.id, quantity: inCart.quantity - 1 })}
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
                onClick={() => update.mutate({ id: inCart.id, quantity: inCart.quantity + 1 })}
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
              disabled={add.isPending || outOfStock}
              className={`size-9 rounded-xl grid place-items-center shadow-sm active:scale-95 transition-transform ${
                outOfStock
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground"
              }`}
            >
              <Plus className="size-4" strokeWidth={2.75} />
            </button>
          )}
        </div>
      </motion.div>

      <SaveProductSheet
        product={product}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
      />
    </>
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
