import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ListPlus, ShoppingBag, ChevronRight, Plus } from "lucide-react";
import { useShoppingLists } from "@/hooks/use-shopping-lists";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export const Route = createFileRoute("/_authenticated/listas")({
  ssr: false,
  component: ListsPage,
});

function ListsPage() {
  const { user, loading } = useAuth();
  const { lists, createList } = useShoppingLists();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  if (!loading && !user) {
    return (
      <div>
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/home" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Listas de Compras</h1>
        </header>
        <SignInRequired
          title="Entre para criar listas"
          description="Organize suas compras recorrentes e economize tempo."
        />
      </div>
    );
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createList.mutate(newListName);
    setNewListName("");
    setIsCreating(false);
  };

  return (
    <div className="pb-20">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/perfil" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Minhas Listas</h1>
        </div>
        <button
          onClick={() => setIsCreating(true)}
          className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-xl shadow-sm"
        >
          <Plus className="size-5" />
        </button>
      </header>

      <main className="px-5 py-5">
        <AnimatePresence>
          {isCreating && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreate}
              className="mb-6 overflow-hidden"
            >
              <div className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-3">
                <label className="block text-xs font-semibold text-muted-foreground uppercase">Nome da lista</label>
                <input
                  autoFocus
                  value={newListName}
                  onChange={(e) => setNewListName(e.target.value)}
                  placeholder="Ex: Compras do Mês, Churrasco…"
                  className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="flex-1 py-2.5 text-sm font-semibold text-muted-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!newListName.trim() || createList.isPending}
                    className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                  >
                    Criar Lista
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {lists.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 rounded-3xl bg-muted grid place-items-center mx-auto mb-6">
              <ListPlus className="size-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-2xl mb-2">Nenhuma lista ainda</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Crie listas para facilitar suas compras frequentes.
            </p>
            <button
              onClick={() => setIsCreating(true)}
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-semibold"
            >
              Criar minha primeira lista
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {lists.map((list) => (
              <Link
                key={list.id}
                to="/lista/$id"
                params={{ id: list.id }}
                className="flex items-center gap-4 bg-card ring-1 ring-border rounded-2xl p-4 active:scale-[0.99] transition-transform"
              >
                <div className="size-12 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                  <ShoppingBag className="size-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">{list.name}</h3>
                  <p className="text-xs text-muted-foreground">
                    {list.items.length} {list.items.length === 1 ? "item" : "itens"}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground/50" />
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
