import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { motion } from "framer-motion";
import { Clock, Truck, ChevronRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { CategoriesStrip } from "@/components/categories-strip";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import {
  offersQuery,
  featuredProductsQuery,
  bestSellersQuery,
  newProductsQuery,
} from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/home")({
  loader: ({ context }) => {
    void context.queryClient.prefetchQuery(offersQuery);
    void context.queryClient.prefetchQuery(featuredProductsQuery);
    void context.queryClient.prefetchQuery(bestSellersQuery);
    void context.queryClient.prefetchQuery(newProductsQuery);
  },
  component: HomePage,
});

function HomePage() {
  return (
    <>
      <AppHeader />
      <main className="space-y-8 pt-4">
        <PromoBanner />
        <Suspense fallback={<CarouselSkeleton />}>
          <CategoriesStrip />
        </Suspense>
        <DeliveryBar />
        <Suspense fallback={<CarouselSkeleton />}>
          <ProductCarousel title="Ofertas do dia" query={offersQuery} viewAll="oferta" />
        </Suspense>
        <Suspense fallback={<CarouselSkeleton />}>
          <ProductCarousel title="Mais vendidos" query={bestSellersQuery} />
        </Suspense>
        <Suspense fallback={<GridSkeleton />}>
          <FeaturedGrid />
        </Suspense>
        <Suspense fallback={<CarouselSkeleton />}>
          <ProductCarousel title="Novidades" query={newProductsQuery} />
        </Suspense>
      </main>
    </>
  );
}

function PromoBanner() {
  return (
    <section className="px-5">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl bg-primary h-44 flex items-center"
      >
        <div className="absolute inset-0 opacity-50">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&q=70"
            alt=""
            className="w-full h-full object-cover mix-blend-overlay"
          />
        </div>
        <div className="relative z-10 px-6 max-w-[68%]">
          <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-primary-foreground/80 mb-1 block">
            Colheita da semana
          </span>
          <h2 className="font-serif italic text-2xl text-primary-foreground leading-tight mb-3">
            Frescor que vem da feira
          </h2>
          <Link
            to="/categoria/$slug"
            params={{ slug: "hortifruti" }}
            className="inline-block bg-accent text-accent-foreground text-xs font-bold py-2 px-4 rounded-full active:scale-95 transition-transform"
          >
            Até 40% OFF
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

function DeliveryBar() {
  return (
    <section className="px-5">
      <div className="bg-primary-soft ring-1 ring-primary/10 rounded-2xl p-4 flex items-center gap-3">
        <div className="size-10 rounded-full bg-primary/10 text-primary grid place-items-center">
          <Truck className="size-5" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-primary">Mercado mais próximo</p>
          <p className="text-[11px] text-foreground/70 flex items-center gap-1.5">
            <Clock className="size-3" /> 25-35 min · Frete grátis acima de R$ 50
          </p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </div>
    </section>
  );
}

function ProductCarousel({
  title,
  query,
  viewAll,
}: {
  title: string;
  query: typeof offersQuery;
  viewAll?: string;
}) {
  const { data } = useSuspenseQuery(query);
  if (!data || data.length === 0) return null;
  return (
    <section>
      <div className="px-5 mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {viewAll && (
          <Link to="/buscar" className="text-xs font-semibold text-primary">
            Ver todas
          </Link>
        )}
      </div>
      <div className="flex gap-3 overflow-x-auto px-5 pb-1 no-scrollbar">
        {data.map((p) => (
          <ProductCard key={p.id} product={p} variant="carousel" />
        ))}
      </div>
    </section>
  );
}

function FeaturedGrid() {
  const { data } = useSuspenseQuery(featuredProductsQuery);
  if (!data || data.length === 0) return null;
  return (
    <section className="px-5">
      <h2 className="text-base font-semibold tracking-tight mb-3">Em destaque</h2>
      <div className="grid grid-cols-2 gap-3">
        {data.slice(0, 6).map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </section>
  );
}

function CarouselSkeleton() {
  return (
    <section>
      <div className="px-5 mb-3 h-5 w-32 bg-muted rounded animate-pulse" />
      <div className="flex gap-3 overflow-x-auto px-5 no-scrollbar">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} variant="carousel" />
        ))}
      </div>
    </section>
  );
}

function GridSkeleton() {
  return (
    <section className="px-5">
      <div className="h-5 w-32 bg-muted rounded animate-pulse mb-3" />
      <div className="grid grid-cols-2 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </section>
  );
}
