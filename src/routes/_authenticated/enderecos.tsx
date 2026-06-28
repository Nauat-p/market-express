import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Plus, MapPin, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { addressesQuery, type Address } from "@/lib/queries";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";

export const Route = createFileRoute("/_authenticated/enderecos")({
  ssr: false,
  component: AddressesPage,
});

// Hook customizado para gerenciar mutações de endereço
function useAddressMutations() {
  const qc = useQueryClient();

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addresses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: addressesQuery.queryKey }),
    onError: (e: Error) => toast.error(`Erro ao remover: ${e.message}`),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      // Tenta usar RPC para atomicidade
      const { error } = await supabase.rpc('set_default_address', {
        p_user_id: user.id,
        p_address_id: id
      });

      // Fallback manual se RPC não existir
      if (error && error.code === 'PGRST501') {
        // Desativa todos e ativa o novo
        await supabase
          .from("addresses")
          .update({ is_default: false })
          .eq("user_id", user.id);
          
        const { error: upErr } = await supabase
          .from("addresses")
          .update({ is_default: true })
          .eq("id", id);
        if (upErr) throw upErr;
      } else if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressesQuery.queryKey });
      toast.success("Endereço padrão atualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { remove, setDefault };
}

function AddressesPage() {
  const { user, loading } = useAuth();
  const { data: addresses = [] } = useQuery({ ...addressesQuery, enabled: !!user });
  const [adding, setAdding] = useState(false);
  const { remove, setDefault } = useAddressMutations();

  if (!loading && !user) {
    return (
      <div>
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/home" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Endereços</h1>
        </header>
        <SignInRequired
          title="Entre para salvar endereços"
          description="Você precisa de uma conta para guardar endereços de entrega."
        />
      </div>
    );
  }

  return (
    <div className="pb-10">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/perfil" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold flex-1">Endereços</h1>
        <button
          type="button"
          onClick={() => setAdding((v) => !v)}
          className="size-10 grid place-items-center bg-primary text-primary-foreground rounded-xl"
          aria-label="Adicionar"
        >
          <Plus className="size-5" />
        </button>
      </header>

      <main className="px-5 py-5 space-y-3">
        {adding && <AddressForm onDone={() => setAdding(false)} isFirst={addresses.length === 0} />}
        {addresses.length === 0 && !adding && (
          <div className="text-center py-16">
            <div className="size-16 rounded-2xl bg-muted grid place-items-center mx-auto mb-4">
              <MapPin className="size-7 text-muted-foreground" />
            </div>
            <p className="font-serif italic text-xl mb-2">Nenhum endereço</p>
            <button
              type="button"
              onClick={() => setAdding(true)}
              className="bg-primary text-primary-foreground rounded-2xl px-5 py-2.5 text-sm font-semibold"
            >
              Adicionar agora
            </button>
          </div>
        )}
        {addresses.map((a) => (
          <div key={a.id} className="bg-card ring-1 ring-border rounded-2xl p-4">
            <div className="flex items-start gap-3">
              <span className="size-10 rounded-xl bg-muted grid place-items-center">
                <MapPin className="size-4" />
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{a.label}</p>
                  {a.is_default && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary px-2 py-0.5 rounded-full">
                      Padrão
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-snug mt-1">
                  {a.street}, {a.number}
                  {a.complement ? ` · ${a.complement}` : ""}
                  <br />
                  {a.neighborhood} · {a.city}/{a.state} · {a.zip}
                </p>
              </div>
              <button
                type="button"
                onClick={() => remove.mutate(a.id)}
                disabled={remove.isPending}
                aria-label="Remover"
                className="text-muted-foreground disabled:opacity-50"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            {!a.is_default && (
              <button
                type="button"
                onClick={() => setDefault.mutate(a.id)}
                disabled={setDefault.isPending}
                className="mt-3 text-xs font-semibold text-primary disabled:opacity-50"
              >
                Definir como padrão
              </button>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

function AddressForm({ onDone, isFirst }: { onDone: () => void; isFirst: boolean }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<Omit<Address, "id" | "is_default">>({
    label: "Casa",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "Sobral",
    state: "CE",
    zip: "",
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sessão expirada");
      
      const { error } = await supabase.from("addresses").insert({
        ...form,
        user_id: user.id,
        is_default: isFirst,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: addressesQuery.queryKey });
      toast.success("Endereço adicionado");
      onDone();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        create.mutate();
      }}
      className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-3"
    >
      <Field
        label="Apelido"
        value={form.label}
        onChange={(v) => setForm({ ...form, label: v })}
        placeholder="Casa, Trabalho…"
      />
      <div className="grid grid-cols-[1fr_100px] gap-3">
        <Field
          label="Rua"
          value={form.street}
          onChange={(v) => setForm({ ...form, street: v })}
          required
        />
        <Field
          label="Número"
          value={form.number}
          onChange={(v) => setForm({ ...form, number: v })}
          required
        />
      </div>
      <Field
        label="Complemento"
        value={form.complement ?? ""}
        onChange={(v) => setForm({ ...form, complement: v })}
        placeholder="Apto, bloco…"
      />
      <Field
        label="Bairro"
        value={form.neighborhood}
        onChange={(v) => setForm({ ...form, neighborhood: v })}
        required
      />
      <div className="grid grid-cols-2 gap-3">
        <Field
          label="Cidade"
          value={form.city}
          onChange={(v) => setForm({ ...form, city: v })}
          required
        />
        <Field
          label="CEP"
          value={form.zip}
          onChange={(v) => setForm({ ...form, zip: v })}
          required
        />
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 bg-muted text-foreground rounded-2xl py-3 text-sm font-semibold"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={create.isPending}
          className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2"
        >
          {create.isPending && <Loader2 className="size-4 animate-spin" />}
          Salvar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full bg-muted/60 ring-1 ring-border rounded-xl py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </label>
  );
}
