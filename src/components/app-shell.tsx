import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Search, ShoppingBag, Package, User } from "lucide-react";
import { cartQuery } from "@/lib/queries";
import { useEffect, type ReactNode } from "react";

type NavItem = {
  to: "/home" | "/buscar" | "/carrinho" | "/pedidos" | "/perfil";
  label: string;
  icon: typeof Home;
  badge?: boolean;
};

const items: NavItem[] = [
  { to: "/home", label: "Início", icon: Home },
  { to: "/buscar", label: "Buscar", icon: Search },
  { to: "/carrinho", label: "Carrinho", icon: ShoppingBag, badge: true },
  { to: "/pedidos", label: "Pedidos", icon: Package },
  { to: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  useEffect(() => {
    const handler = () =>
      qc.invalidateQueries({ queryKey: cartQuery.queryKey });
    window.addEventListener("local-cart-changed", handler);
    return () => window.removeEventListener("local-cart-changed", handler);
  }, [qc]);

  return (
    <div className="min-h-dvh bg-background pb-24">
      {children}
      <BottomNav />
    </div>
  );
}

function BottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { data: cart = [] } = useQuery(cartQuery);
  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <nav className="fixed bottom-0 inset-x-0 z-30 bg-zinc-950 border-t border-zinc-800 safe-bottom">
      <ul className="max-w-md mx-auto px-4 pt-2 flex items-center justify-between">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = pathname === to || (to === "/home" && pathname === "/");
          return (
            <li key={to}>
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-colors ${
                active ? "text-white" : "text-white/60"
                }`}
              >
                <span className="relative">
                  <Icon
                    className="size-[22px]"
                    strokeWidth={active ? 2.4 : 1.8}
                  />
                  {badge && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 size-[18px] bg-destructive text-destructive-foreground text-[10px] font-bold rounded-full grid place-items-center ring-2 ring-background">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </span>
                <span className="text-[10px] font-medium tracking-tight">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
