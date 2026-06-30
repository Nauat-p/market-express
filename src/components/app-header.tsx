import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ChevronRight, Heart, ClipboardList } from "lucide-react";
import { profileQuery, addressesQuery } from "@/lib/queries";
import { greetingPT } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";

export function AppHeader({ showSearch = true }: { showSearch?: boolean }) {
  const { user } = useAuth();
  const { data: profile } = useQuery({ ...profileQuery, enabled: !!user });
  const { data: addresses = [] } = useQuery({ ...addressesQuery, enabled: !!user });
  const def = addresses.find((a) => a.is_default) ?? addresses[0];
  const name = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <header className="sticky top-0 z-20 bg-zinc-950 px-5 pt-5 pb-3 border-b border-zinc-800 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        {user ? (
          <Link to="/enderecos" className="flex flex-col items-start min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
              {greetingPT()}{name ? `, ${name}` : ""}
            </span>
            <span className="flex items-center gap-1 text-sm font-semibold text-zinc-100 max-w-[200px] truncate">
              <MapPin className="size-3.5 text-primary shrink-0" />
              {def ? `${def.street}, ${def.number}` : "Adicionar endereço"}
              <ChevronRight className="size-3.5 text-zinc-500 shrink-0" />
            </span>
          </Link>
        ) : (
          <div className="flex flex-col items-start min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">
              {greetingPT()}
            </span>
            <Link
              to="/auth"
              className="flex items-center gap-1 text-sm font-semibold text-zinc-100"
            >
              <MapPin className="size-3.5 text-primary shrink-0" />
              Entrar para entregar em casa
              <ChevronRight className="size-3.5 text-zinc-500 shrink-0" />
            </Link>
          </div>
        )}
        
        <div className="flex items-center gap-2.5">
          {user && (
            <>
              <Link to="/favoritos" className="size-9 rounded-full bg-zinc-900 ring-1 ring-zinc-800 grid place-items-center text-zinc-300 hover:text-primary transition-colors shadow-sm active:scale-90">
                <Heart className="size-4" />
              </Link>
              <Link to="/listas" className="size-9 rounded-full bg-zinc-900 ring-1 ring-zinc-800 grid place-items-center text-zinc-300 hover:text-primary transition-colors shadow-sm active:scale-90">
                <ClipboardList className="size-4" />
              </Link>
            </>
          )}
          <Link
            to={user ? "/perfil" : "/auth"}
            className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center ring-2 ring-primary/30 overflow-hidden font-semibold text-sm shadow-sm active:scale-95 transition-transform"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              (name?.[0] ?? "T").toUpperCase()
            )}
          </Link>
        </div>
      </div>
      {showSearch && (
        <Link
          to="/buscar"
          className="relative flex items-center w-full bg-zinc-900 ring-1 ring-zinc-800 rounded-2xl py-3 pl-11 pr-4 text-sm text-zinc-400"
        >
          <Search className="size-4 absolute left-4 text-zinc-400" strokeWidth={2} />
          <span>Buscar produto, marca, categoria…</span>
        </Link>
      )}
    </header>
  );
}
