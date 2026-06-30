import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import {
  ArrowLeft,
  Package,
  ChevronRight,
  Search,
  X,
  ArrowUpDown,
  SlidersHorizontal,
  RefreshCw,
} from "lucide-react";
import { ordersQuery } from "@/lib/queries";
import { formatBRL } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const sortValues = ["date_desc", "date_asc", "total_desc", "total_asc"] as const;

const searchSchema = z.object({
  q: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  status: z.string().optional(),
  sort: z.enum(sortValues).optional(),
});

export const Route = createFileRoute("/_authenticated/pedidos")({
  ssr: false,
  validateSearch: searchSchema,
  component: OrdersPage,
});

const statusLabel: Record<string, { label: string; color: string }> = {
  received: { label: "Recebido", color: "bg-accent/20 text-foreground" },
  preparing: { label: "Preparando", color: "bg-primary-soft text-primary" },
  out_for_delivery: { label: "Saiu p/ entrega", color: "bg-primary-soft text-primary" },
  delivered: { label: "Entregue", color: "bg-primary text-primary-foreground" },
  cancelled: { label: "Cancelado", color: "bg-destructive/15 text-destructive" },
};

type SortOption = (typeof sortValues)[number];

const sortOptions: { value: SortOption; label: string }[] = [
  { value: "date_desc", label: "Mais recentes" },
  { value: "date_asc", label: "Mais antigos" },
  { value: "total_desc", label: "Maior valor" },
  { value: "total_asc", label: "Menor valor" },
];

function OrderCardSkeleton() {
  return (
    <div className="bg-card ring-1 ring-border rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="h-3 w-20 bg-muted rounded animate-pulse" />
        <div className="h-5 w-16 bg-muted rounded-full animate-pulse" />
      </div>
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
          <div className="h-3 w-28 bg-muted rounded animate-pulse" />
        </div>
        <div className="size-4 bg-muted rounded animate-pulse" />
      </div>
    </div>
  );
}

function OrdersPage() {
  const { user, loading } = useAuth();
  const {
    data: orders = [],
    isLoading,
    isFetching,
    refetch,
  } = useQuery({
    ...ordersQuery,
    enabled: !!user,
  });

  const search = useSearch({ from: "/_authenticated/pedidos" });
  const navigate = useNavigate({ from: "/_authenticated/pedidos" });

  const [term, setTerm] = useState(search.q ?? "");
  const [debouncedTerm, setDebouncedTerm] = useState(search.q ?? "");
  const [dateFrom, setDateFrom] = useState(search.from ?? "");
  const [dateTo, setDateTo] = useState(search.to ?? "");
  const [statusFilter, setStatusFilter] = useState<string | null>(search.status ?? null);
  const [sort, setSort] = useState<SortOption>(search.sort ?? "date_desc");
  const [showFilters, setShowFilters] = useState(
    !!(search.q || search.from || search.to || search.status),
  );

  useEffect(() => {
    const id = setTimeout(() => setDebouncedTerm(term.trim()), 250);
    return () => clearTimeout(id);
  }, [term]);

  // Reflect filters in the URL so they survive refresh/back navigation.
  useEffect(() => {
    navigate({
      search: {
        q: debouncedTerm || undefined,
        from: dateFrom || undefined,
        to: dateTo || undefined,
        status: statusFilter ?? undefined,
        sort: sort !== "date_desc" ? sort : undefined,
      },
      replace: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTerm, dateFrom, dateTo, statusFilter, sort]);

  const filteredOrders = useMemo(() => {
    const q = debouncedTerm.toLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    let result = orders.filter((o) => {
      const matchesText = !q || o.code.toLowerCase().includes(q);
      const matchesStatus = !statusFilter || o.status === statusFilter;
      const createdAt = new Date(o.created_at);
      const matchesFrom = !from || createdAt >= from;
      const matchesTo = !to || createdAt <= to;
      return matchesText && matchesStatus && matchesFrom && matchesTo;
    });

    result = [...result].sort((a, b) => {
      switch (sort) {
        case "date_asc":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "total_desc":
          return Number(b.total) - Number(a.total);
        case "total_asc":
          return Number(a.total) - Number(b.total);
        case "date_desc":
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [orders, debouncedTerm, dateFrom, dateTo, statusFilter, sort]);

  const hasActiveFilters = !!term || !!dateFrom || !!dateTo || !!statusFilter;

  function clearFilters() {
    setTerm("");
    setDebouncedTerm("");
    setDateFrom("");
    setDateTo("");
    setStatusFilter(null);
    setSort("date_desc");
  }

  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold flex-1">Meus pedidos</h1>
        {user && (
          <button
            type="button"
            onClick={() => refetch()}
            disabled={isFetching}
            className="size-9 grid place-items-center text-muted-foreground disabled:opacity-50"
            aria-label="Atualizar pedidos"
          >
            <RefreshCw className={`size-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>
        )}
      </header>

      {!loading && !user ? (
        <SignInRequired
          title="Entre para ver pedidos"
          description="Seus pedidos ficam vinculados à sua conta."
        />
      ) : (
        <main className="px-5 py-5">
          {!isLoading && orders.length > 0 && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="size-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    value={term}
                    onChange={(e) => setTerm(e.target.value)}
                    placeholder="Buscar pelo código do pedido"
                    className="w-full bg-muted/60 ring-1 ring-border rounded-2xl py-2.5 pl-10 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                  {term && (
                    <button
                      type="button"
                      onClick={() => setTerm("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 size-6 grid place-items-center text-muted-foreground"
                    >
                      <X className="size-4" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`shrink-0 size-10 rounded-2xl ring-1 grid place-items-center ${
                    showFilters || dateFrom || dateTo || statusFilter
                      ? "bg-primary-soft ring-primary/30 text-primary"
                      : "bg-muted/60 ring-border text-foreground"
                  }`}
                  aria-label="Filtros"
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              </div>

              {showFilters && (
                <div className="bg-card ring-1 ring-border rounded-2xl p-3 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block">
                      <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                        De
                      </span>
                      <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-2 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] text-muted-foreground font-medium block mb-1">
                        Até
                      </span>
                      <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-2 px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      />
                    </label>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground font-medium block mb-1.5">
                      Status
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(statusLabel).map(([key, { label }]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setStatusFilter((prev) => (prev === key ? null : key))}
                          className={`text-xs font-semibold px-3 py-1.5 rounded-full ring-1 ${
                            statusFilter === key
                              ? "bg-primary text-primary-foreground ring-primary"
                              : "bg-muted/60 ring-border text-foreground"
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[11px] text-muted-foreground font-medium flex items-center gap-1 mb-1">
                      <ArrowUpDown className="size-3" /> Ordenar por
                    </span>
                    <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
                      <SelectTrigger className="bg-muted/60 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {sortOptions.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </label>

                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="text-xs font-semibold text-primary"
                    >
                      Limpar filtros
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {!isLoading && orders.length > 0 && hasActiveFilters && (
            <p className="text-xs text-muted-foreground mb-3">
              {filteredOrders.length}{" "}
              {filteredOrders.length === 1 ? "pedido encontrado" : "pedidos encontrados"}
            </p>
          )}

          {isLoading ? (
            <ul className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <li key={i}>
                  <OrderCardSkeleton />
                </li>
              ))}
            </ul>
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
          ) : filteredOrders.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-foreground font-semibold mb-1">Nenhum pedido encontrado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Tente ajustar os filtros aplicados.
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm font-semibold text-primary"
              >
                Limpar filtros
              </button>
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredOrders.map((o) => {
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
      )}
    </div>
  );
}
