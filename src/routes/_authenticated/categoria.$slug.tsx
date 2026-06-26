import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { categoryBySlugQuery } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export const Route = createFileRoute("/_authenticated/categoria/$slug")({
  loader: async ({ context, params }) => {
    const q = categoryBySlugQuery(params.slug);
    const data = await context.queryClient.ensureQueryData(q);
    if (!data) throw notFound();
    return null;
  },
  component: CategoryPage,
  notFoundComponent: () => (
    <div className="p-10 text-center">
      <p className="font-semibold">Categoria não encontrada</p>
      <Link to="/home" className="text-primary text-sm mt-3 inline-block">
        Voltar
      </Link>
    </div>
  ),
});

function CategoryPage() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(categoryBySlugQuery(slug));
  if (!data) return null;
  const { category, products } = data;
  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span
            className="size-9 rounded-xl grid place-items-center text-lg"
            style={{ backgroundColor: category.bg_color ?? "var(--color-muted)" }}
          >
            {category.emoji}
          </span>
          <h1 className="text-base font-semibold truncate">{category.name}</h1>
        </div>
        <span className="text-xs text-muted-foreground">{products.length} itens</span>
      </header>
      <main className="px-5 py-5">
        {products.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-16">
            Nenhum produto nesta categoria ainda.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
