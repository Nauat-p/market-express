import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useAddToCart } from "@/hooks/use-cart";
import { ArrowLeft, ShoppingBag, Trash2, Plus, Minus, ShoppingCart } from "lucide-react";
import { useShoppingLists } from "@/hooks/use-shopping-lists";

import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/lista/$id")({
  ssr: false,
  component: ListDetailPage,
});

function ListDetailPage() {
  const { id } = Route.useParams();
  const { lists, removeItem, updateItemQuantity, deleteList } = useShoppingLists();
  const addItem = useAddToCart();
  const router = useRouter();

  const list = lists.find((l) => l.id === id);

  if (!list) {
    return (
      <div className="pb-20">
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/listas" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Lista não encontrada</h1>
        </header>
        <div className="text-center py-20 text-muted-foreground text-sm">
          Esta lista não existe ou foi removida.
        </div>
      </div>
    );
  }

  const handleAddAllToCart = () => {
    list.items.forEach((item) => {
      addItem.mutate({ product: item.product, quantity: item.quantity });
    });
    toast.success("Todos os itens adicionados ao carrinho!");
  };

  const handleDeleteList = () => {
    deleteList.mutate(id, {
      onSuccess: () => router.navigate({ to: "/listas" }),
    });
  };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/listas" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <div>
            <h1 className="text-base font-semibold leading-tight">{list.name}</h1>
            <p className="text-xs text-muted-foreground">
              {list.items.length} {list.items.length === 1 ? "item" : "itens"}
            </p>
          </div>
        </div>
        <button
          onClick={handleDeleteList}
          className="size-10 grid place-items-center text-destructive"
        >
          <Trash2 className="size-5" />
        </button>
      </header>

      <main className="px-4 py-5 space-y-3">
        {list.items.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 rounded-3xl bg-muted grid place-items-center mx-auto mb-6">
              <ShoppingBag className="size-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-2xl mb-2">Lista vazia</h2>
            <p className="text-sm text-muted-foreground">
              Adicione produtos a esta lista a partir da loja.
            </p>
          </div>
        ) : (
          <>
            {list.items.map((item) => {
              const p = item.product;
              const price = p.sale_price ?? p.price;
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 bg-card ring-1 ring-border rounded-2xl p-3"
                >
                  {p.image_url ? (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      className="size-14 rounded-xl object-cover shrink-0 bg-muted"
                    />
                  ) : (
                    <div className="size-14 rounded-xl bg-muted shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.name}</p>
                    <p className="text-xs text-primary font-bold">
                      R$ {price.toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() =>
                        item.quantity > 1
                          ? updateItemQuantity.mutate({ itemId: item.id, quantity: item.quantity - 1 })
                          : removeItem.mutate(item.id)
                      }
                      className="size-7 rounded-lg bg-muted grid place-items-center"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="text-sm font-semibold w-5 text-center">{item.quantity}</span>
                    <button
                      onClick={() =>
                        updateItemQuantity.mutate({ itemId: item.id, quantity: item.quantity + 1 })
                      }
                      className="size-7 rounded-lg bg-muted grid place-items-center"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </main>

      {list.items.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 glass border-t border-border/40">
          <button
            onClick={handleAddAllToCart}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2"
          >
            <ShoppingCart className="size-5" />
            Adicionar tudo ao carrinho
          </button>
        </div>
      )}
    </div>
  );
}
