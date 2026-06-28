import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, MapPin, Package, LogOut, ChevronRight, User as UserIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery, addressesQuery, ordersQuery } from "@/lib/queries";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";

export const Route = createFileRoute("/_authenticated/perfil")({
  ssr: false,
  component: ProfilePage,
});

function ProfilePage() {
  const { user, loading } = useAuth();
  const { data: profile } = useQuery(profileQuery);
  const { data: addresses = [] } = useQuery(addressesQuery);
  const { data: orders = [] } = useQuery(ordersQuery);
  const navigate = useNavigate();
  const qc = useQueryClient();

  if (loading) return null;
  if (!user) {
    return (
      <div>
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/home" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Perfil</h1>
        </header>
        <SignInRequired
          title="Crie seu perfil"
          description="Entre para acompanhar pedidos, salvar endereços e finalizar suas compras."
        />
      </div>
    );
  }

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    toast.success("Até logo!");
    navigate({ to: "/home", replace: true });
  }

  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/home" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Perfil</h1>
      </header>

      <main className="px-5 py-5 space-y-6">
        <section className="flex items-center gap-4">
          <div className="size-16 rounded-full bg-primary-soft text-primary grid place-items-center overflow-hidden font-bold text-xl ring-1 ring-border">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              (profile?.full_name?.[0] ?? "T").toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif italic text-xl text-foreground leading-tight">
              {profile?.full_name ?? "Olá"}
            </h2>
            {profile?.phone && (
              <p className="text-xs text-muted-foreground">{profile.phone}</p>
            )}
          </div>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Stat label="Pedidos" value={orders.length} />
          <Stat label="Endereços" value={addresses.length} />
          <Stat label="Em rota" value={orders.filter((o) => o.status === "out_for_delivery").length} />
        </section>

        <section className="space-y-2">
          <ProfileLink
            to="/enderecos"
            icon={MapPin}
            label="Meus endereços"
            sub={
              addresses.length
                ? `${addresses.length} ${addresses.length === 1 ? "endereço" : "endereços"}`
                : "Adicionar um endereço"
            }
          />
          <ProfileLink
            to="/pedidos"
            icon={Package}
            label="Histórico de pedidos"
            sub={`${orders.length} no total`}
          />
          <ProfileLink
            to="/perfil-edit"
            icon={UserIcon}
            label="Dados pessoais"
            sub="Editar nome e telefone"
          />
        </section>

        <button
          type="button"
          onClick={signOut}
          className="w-full bg-card ring-1 ring-border rounded-2xl p-4 flex items-center justify-center gap-2 text-sm font-semibold text-destructive"
        >
          <LogOut className="size-4" />
          Sair da conta
        </button>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-card ring-1 ring-border rounded-2xl p-3 text-center">
      <p className="text-lg font-bold text-foreground">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}

function ProfileLink({
  to,
  icon: Icon,
  label,
  sub,
}: {
  to: "/enderecos" | "/pedidos" | "/perfil-edit";
  icon: typeof MapPin;
  label: string;
  sub: string;
}) {
  return (
    <Link
      to={to}
      className="bg-card ring-1 ring-border rounded-2xl p-4 flex items-center gap-3"
    >
      <span className="size-10 rounded-xl bg-muted grid place-items-center">
        <Icon className="size-4" />
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-[11px] text-muted-foreground">{sub}</p>
      </div>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
