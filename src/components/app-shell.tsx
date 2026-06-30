import { Link, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Home, Search, ShoppingBag, Package, User } from "lucide-react";
import { motion } from "framer-motion";
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
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  
  // Aumentamos o padding inferior em rotas com botões fixos para que o conteúdo não fique por baixo da BottomNav
  const hasExtraPadding = 
    pathname.startsWith("/produto/") || 
    pathname === "/carrinho" || 
    pathname === "/checkout";

  useEffect(() => {
    const handler = () =>
      qc.invalidateQueries({ queryKey: cartQuery.queryKey });
    window.addEventListener("local-cart-changed", handler);
    return () => window.removeEventListener("local-cart-changed", handler);
  }, [qc]);

  return (
    <div className={`min-h-dvh bg-background ${hasExtraPadding ? "pb-44" : "pb-24"}`}>
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
    <nav className="fixed bottom-0 inset-x-0 z-50 bg-zinc-950 border-t border-zinc-800 safe-bottom px-2 pt-1.5">
      <ul className="max-w-md mx-auto flex items-center justify-around">
        {items.map(({ to, label, icon: Icon, badge }) => {
          const active = pathname === to || (to === "/home" && pathname === "/");
          return (
            <li key={to} className="flex-1">
              <Link
                to={to}
                className={`relative flex flex-col items-center gap-1 py-2 transition-all active:scale-90 group ${
                  active ? "text-primary" : "text-zinc-400 hover:text-zinc-100"
                }`}
              >
                <div className={`relative transition-transform ${active ? "scale-110" : ""}`}>
                  <Icon
                    className="size-[22px]"
                    strokeWidth={active ? 2.5 : 2}
                  />
                  {badge && cartCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 size-4.5 bg-primary text-primary-foreground text-[9px] font-bold rounded-full grid place-items-center ring-2 ring-background shadow-sm">
                      {cartCount > 9 ? "9+" : cartCount}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-widest transition-opacity ${active ? "opacity-100" : "opacity-60 group-hover:opacity-100"}`}>
                  {label}
                </span>
                {active && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -bottom-1.5 size-1 bg-primary rounded-full"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
