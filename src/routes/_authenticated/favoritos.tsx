import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { useFavorites } from "@/hooks/use-favorites";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";

export const Route = createFileRoute("/_authenticated/favoritos")({
  ssr: false,
  component: FavoritesPage,
});

function FavoritesPage() {
  const { user, loading } = useAuth();
  const { favorites } = useFavorites();

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

  return (
    <div className="pb-20">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/perfil" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Meus Favoritos</h1>
      </header>

      <main className="px-5 py-5">
        {favorites.length === 0 ? (
          <div className="text-center py-20">
            <div className="size-20 rounded-3xl bg-muted grid place-items-center mx-auto mb-6">
              <Heart className="size-10 text-muted-foreground" />
            </div>
            <h2 className="font-serif italic text-2xl mb-2">Sua lista está vazia</h2>
            <p className="text-sm text-muted-foreground mb-8">
              Toque no coração nos produtos para salvá-los aqui.
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
    </div>
  );
}
