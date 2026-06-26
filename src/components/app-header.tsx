import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, MapPin, ChevronRight } from "lucide-react";
import { profileQuery, addressesQuery } from "@/lib/queries";
import { greetingPT } from "@/lib/format";

export function AppHeader({ showSearch = true }: { showSearch?: boolean }) {
  const { data: profile } = useQuery(profileQuery);
  const { data: addresses = [] } = useQuery(addressesQuery);
  const def = addresses.find((a) => a.is_default) ?? addresses[0];
  const name = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <header className="sticky top-0 z-20 glass px-5 pt-5 pb-3 border-b border-border/40">
      <div className="flex items-center justify-between mb-3">
        <Link to="/enderecos" className="flex flex-col items-start min-w-0">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-semibold">
            {greetingPT()}{name ? `, ${name}` : ""}
          </span>
          <span className="flex items-center gap-1 text-sm font-semibold text-foreground max-w-[240px] truncate">
            <MapPin className="size-3.5 text-primary shrink-0" />
            {def
              ? `${def.street}, ${def.number}`
              : "Adicionar endereço"}
            <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
          </span>
        </Link>
        <Link
          to="/perfil"
          className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center ring-1 ring-border overflow-hidden font-semibold text-sm"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="" className="size-full object-cover" />
          ) : (
            (name?.[0] ?? "T").toUpperCase()
          )}
        </Link>
      </div>
      {showSearch && (
        <Link
          to="/buscar"
          className="relative flex items-center w-full bg-muted/60 ring-1 ring-border rounded-2xl py-3 pl-11 pr-4 text-sm text-muted-foreground"
        >
          <Search className="size-4 absolute left-4 text-muted-foreground" strokeWidth={2} />
          <span>Buscar produto, marca, categoria…</span>
        </Link>
      )}
    </header>
  );
}
