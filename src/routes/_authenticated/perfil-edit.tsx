import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { profileQuery } from "@/lib/queries";

export const Route = createFileRoute("/_authenticated/perfil-edit")({
  ssr: false,
  component: ProfileEditPage,
});

function ProfileEditPage() {
  const { data: profile } = useQuery(profileQuery);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const qc = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name ?? "");
      setPhone(profile.phone ?? "");
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone })
        .eq("id", auth.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: profileQuery.queryKey });
      toast.success("Perfil atualizado");
      navigate({ to: "/perfil" });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div>
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/perfil" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Dados pessoais</h1>
      </header>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate();
        }}
        className="px-5 py-5 space-y-4"
      >
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Nome completo
          </span>
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-1 w-full bg-card ring-1 ring-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <label className="block">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
            Telefone
          </span>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(85) 99999-0000"
            className="mt-1 w-full bg-card ring-1 ring-border rounded-xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </label>
        <button
          type="submit"
          disabled={save.isPending}
          className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-2"
        >
          {save.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </button>
      </form>
    </div>
  );
}
