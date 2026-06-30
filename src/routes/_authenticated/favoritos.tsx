import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, ShoppingCart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useFavorites } from "@/hooks/use-favorites";
import { useAddToCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/favoritos")({
  ssr: false,
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const { favorites } = useFavorites();
  const addToCart = useAddToCart();

  if (!loading && !user) {
    return (
      <div>
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/home" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Favoritos</h1>
        </header>
        <SignInRequired
          title="Entre para ver seus favoritos"
          description="Salve os produtos que você mais gosta para encontrá-los facilmente depois."
        />
      </div>
    );
  }

  const handleAddAllToCart = () => {
    favorites.forEach((product) => addToCart.mutate({ product }));
    toast.success("Todos os favoritos adicionados ao carrinho!");
  };

  return (
    <div className="pb-24">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/perfil" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold flex-1">Meus Favoritos</h1>
        {favorites.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {favorites.length} {favorites.length === 1 ? "produto" : "produtos"}
          </span>
        )}
      </header>

      <main className="px-5 py-5">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 rounded-3xl bg-muted grid place-items-center mx-auto mb-6">
              <Heart className="size-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-2xl mb-2">Sua lista está vazia</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Toque no bookmark nos produtos para salvá-los aqui.
            </p>
            <Link
              to="/home"
              className="bg-primary text-primary-foreground rounded-2xl px-8 py-3 font-semibold inline-block"
            >
              Explorar produtos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favorites.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>

      {favorites.length > 0 && (
        <div className="fixed bottom-20 inset-x-0 z-40 glass border-t border-border/40 px-5 pt-3 pb-3">
          <button
            onClick={handleAddAllToCart}
            disabled={addToCart.isPending}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-3.5 font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
          >
            <ShoppingCart className="size-5" />
            Adicionar tudo ao carrinho
          </button>
        </div>
      )}
    </div>
  );
}
