import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ArrowLeft, X } from "lucide-react";
import { ProductCard, ProductCardSkeleton } from "@/components/product-card";
import { searchProductsQuery, categoriesQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/buscar")({
  ssr: false,
  component: SearchPage,
});

const RECENT_KEY = "mtp:recent_searches";

function SearchPage() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    const raw = localStorage.getItem(RECENT_KEY);
    if (raw) setRecent(JSON.parse(raw) as string[]);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  const { data: results, isFetching } = useQuery(searchProductsQuery(debounced));
  const { data: categories = [] } = useQuery(categoriesQuery);

  function commitSearch(q: string) {
    if (!q) return;
    const next = [q, ...recent.filter((r) => r !== q)].slice(0, 8);
    setRecent(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <div className="relative flex-1">
          <Search className="size-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            onBlur={() => commitSearch(term.trim())}
            placeholder="Buscar produto, marca…"
            className="w-full bg-muted/60 ring-1 ring-border rounded-2xl py-3 pl-11 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          {term && (
            <button
              type="button"
              onClick={() => setTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 size-6 grid place-items-center text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      </header>

      <main className="px-5 py-5">
        {!debounced ? (
          <div className="space-y-6">
            {recent.length > 0 && (
              <section>
                <h2 className="text-sm font-semibold mb-3">Buscas recentes</h2>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => setTerm(r)}
                      className="bg-muted/60 ring-1 ring-border rounded-full px-3 py-1.5 text-xs font-medium"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </section>
            )}
            <section>
              <h2 className="text-sm font-semibold mb-3">Categorias</h2>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((c) => (
                  <Link
                    key={c.id}
                    to="/categoria/$slug"
                    params={{ slug: c.slug }}
                    className="flex items-center gap-3 bg-card ring-1 ring-border rounded-2xl p-3"
                  >
                    <span
                      className="size-10 rounded-xl grid place-items-center text-xl"
                      style={{ backgroundColor: c.bg_color ?? "var(--color-muted)" }}
                    >
                      {c.emoji}
                    </span>
                    <span className="text-sm font-medium">{c.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        ) : isFetching ? (
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : !results || results.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-foreground font-semibold mb-1">Nada encontrado</p>
            <p className="text-sm text-muted-foreground">
              Tente outra palavra ou marca
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {results.length} {results.length === 1 ? "resultado" : "resultados"}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
