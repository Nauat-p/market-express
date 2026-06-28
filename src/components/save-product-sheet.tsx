import { useState } from "react";
import { Heart, ListPlus, Plus, Check, X } from "lucide-react";
import { useShoppingLists } from "@/hooks/use-shopping-lists";
import { useFavorites } from "@/hooks/use-favorites";
import { type Product } from "@/lib/queries";

interface SaveProductSheetProps {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export function SaveProductSheet({ product, open, onClose }: SaveProductSheetProps) {
  const { lists, createListWithProduct, addItemToList } = useShoppingLists();
  const { isFavorite, toggle } = useFavorites();
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");

  const isFav = isFavorite(product.id);

  // Listas que já contêm esse produto
  const listsWithProduct = new Set(
    lists
      .filter((l) => l.items.some((i) => i.product_id === product.id))
      .map((l) => l.id)
  );

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    createListWithProduct.mutate(
      { name: newListName, productId: product.id, quantity: 1 },
      { onSuccess: () => { setNewListName(""); setIsCreating(false); } }
    );
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 inset-x-0 z-50 bg-card rounded-t-3xl p-5 space-y-4 shadow-2xl">
        {/* Handle */}
        <div className="w-10 h-1 rounded-full bg-border mx-auto -mt-1" />

        {/* Product preview */}
        <div className="flex items-center gap-3">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="size-12 rounded-xl object-cover bg-muted shrink-0"
            />
          ) : (
            <div className="size-12 rounded-xl bg-muted shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate">{product.name}</p>
            <p className="text-xs text-muted-foreground">Salvar produto</p>
          </div>
          <button
            onClick={onClose}
            className="size-8 grid place-items-center text-muted-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Favorite toggle */}
        <button
          onClick={() => toggle.mutate(product.id)}
          className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors ${
            isFav
              ? "bg-primary/10 ring-primary/30 text-primary"
              : "bg-muted/60 ring-border text-foreground"
          }`}
        >
          <Heart className={`size-5 ${isFav ? "fill-current" : ""}`} />
          <span className="text-sm font-semibold flex-1 text-left">
            {isFav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          </span>
          {isFav && <Check className="size-4" />}
        </button>

        {/* Lists section */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Listas de compras
          </p>

          {lists.length === 0 && !isCreating && (
            <p className="text-sm text-muted-foreground py-1">
              Você ainda não tem nenhuma lista.
            </p>
          )}

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {lists.map((list) => {
              const inList = listsWithProduct.has(list.id);
              return (
                <button
                  key={list.id}
                  onClick={() =>
                    !inList &&
                    addItemToList.mutate({ listId: list.id, productId: product.id, quantity: 1 })
                  }
                  disabled={inList || addItemToList.isPending}
                  className={`w-full flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors text-left ${
                    inList
                      ? "bg-primary/10 ring-primary/30 text-primary"
                      : "bg-muted/60 ring-border text-foreground active:bg-muted"
                  }`}
                >
                  <ListPlus className="size-5 shrink-0" />
                  <span className="text-sm font-semibold flex-1 truncate">{list.name}</span>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {list.items.length} {list.items.length === 1 ? "item" : "itens"}
                  </span>
                  {inList && <Check className="size-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          {isCreating ? (
            <form onSubmit={handleCreateAndAdd} className="space-y-2 pt-1">
              <input
                autoFocus
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Nome da nova lista…"
                className="w-full bg-muted/60 ring-1 ring-border rounded-xl py-2.5 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setIsCreating(false); setNewListName(""); }}
                  className="flex-1 py-2.5 text-sm font-semibold text-muted-foreground"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newListName.trim() || createListWithProduct.isPending}
                  className="flex-1 bg-primary text-primary-foreground rounded-xl py-2.5 text-sm font-semibold disabled:opacity-50"
                >
                  Criar e adicionar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setIsCreating(true)}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 ring-dashed ring-border text-muted-foreground"
            >
              <Plus className="size-5" />
              <span className="text-sm font-semibold">Nova lista</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
