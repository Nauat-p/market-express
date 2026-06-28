import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, MapPin, CreditCard, Loader2, Banknote, Smartphone } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cartQuery, addressesQuery, ordersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useClearCart } from "@/hooks/use-cart";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";

export const Route = createFileRoute("/_authenticated/checkout")({
  ssr: false,
  component: CheckoutPage,
});

const FREE_DELIVERY_OVER = 50;
const DELIVERY_FEE = 5.99;

type PaymentMethod = "pix" | "credit" | "debit" | "cash";

const methods: { value: PaymentMethod; label: string; desc: string; icon: typeof CreditCard }[] = [
  { value: "pix", label: "PIX", desc: "Aprovação instantânea", icon: Smartphone },
  { value: "credit", label: "Cartão de crédito", desc: "Maquininha na entrega", icon: CreditCard },
  { value: "debit", label: "Cartão de débito", desc: "Maquininha na entrega", icon: CreditCard },
  { value: "cash", label: "Dinheiro", desc: "Pague na entrega", icon: Banknote },
];

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { data: cart = [] } = useQuery(cartQuery);
  const { data: addresses = [] } = useQuery({ ...addressesQuery, enabled: !!user });
  const clearCart = useClearCart();

  const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
  const [addressId, setAddressId] = useState<string | undefined>(defaultAddr?.id);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");

  const selectedAddr = addresses.find((a) => a.id === addressId) ?? defaultAddr;

  const subtotal = cart.reduce(
    (sum, i) => sum + (i.product.sale_price ?? i.product.price) * i.quantity,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  const placeOrder = useMutation({
    mutationFn: async () => {
      if (!selectedAddr) throw new Error("Adicione um endereço de entrega");
      if (cart.length === 0) throw new Error("Carrinho vazio");

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) throw new Error("Sessão expirada");

      // Prepara os itens para inserção
      const orderItems = cart.map((c) => {
        const unit_price = c.product.sale_price ?? c.product.price;
        return {
          product_id: c.product.id,
          name: c.product.name,
          brand: c.product.brand,
          image_url: c.product.image_url,
          unit: c.product.unit,
          unit_price,
          quantity: c.quantity,
          line_total: unit_price * c.quantity,
        };
      });

      // Tenta usar RPC para garantir atomicidade total (Pedido + Itens + Limpar Carrinho)
      const { data: order, error } = await supabase.rpc('place_order_v1', {
        p_user_id: authUser.id,
        p_address_snapshot: selectedAddr,
        p_subtotal: subtotal,
        p_delivery_fee: deliveryFee,
        p_total: total,
        p_payment_method: payment,
        p_notes: notes || null,
        p_items: orderItems
      });

      // Fallback manual se RPC não existir
      if (error && error.code === 'PGRST501') {
        const { data: newOrder, error: orderErr } = await supabase
          .from("orders")
          .insert({
            user_id: authUser.id,
            address_snapshot: selectedAddr,
            subtotal,
            delivery_fee: deliveryFee,
            total,
            payment_method: payment,
            status: "received",
            notes: notes || null,
          })
          .select()
          .single();
        
        if (orderErr) throw orderErr;

        const itemsWithId = orderItems.map(item => ({
          ...item,
          order_id: newOrder.id
        }));

        const { error: itemsErr } = await supabase.from("order_items").insert(itemsWithId);
        if (itemsErr) {
          // Tenta remover o pedido órfão se os itens falharem
          await supabase.from("orders").delete().eq("id", newOrder.id);
          throw itemsErr;
        }

        await clearCart.mutateAsync();
        return newOrder;
      } else if (error) {
        throw error;
      }

      // Se o RPC funcionou, ele já deve ter limpado o carrinho no banco
      // Mas precisamos limpar o local se houver
      const { clearLocal } = await import("@/lib/local-cart");
      clearLocal();
      
      return order;
    },
    onSuccess: (order) => {
      qc.invalidateQueries({ queryKey: ordersQuery.queryKey });
      qc.invalidateQueries({ queryKey: cartQuery.queryKey });
      toast.success("Pedido confirmado!");
      navigate({ to: "/pedido/$code", params: { code: order.code } });
    },
    onError: (e: Error) => {
      console.error("Erro ao finalizar pedido:", e);
      toast.error(e.message || "Erro ao processar o pedido. Tente novamente.");
    },
  });

  if (!loading && !user) {
    return (
      <div>
        <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
          <Link to="/carrinho" className="size-10 grid place-items-center -ml-1">
            <ArrowLeft className="size-5" />
          </Link>
          <h1 className="text-base font-semibold">Finalizar pedido</h1>
        </header>
        <SignInRequired
          title="Entre para finalizar"
          description="Crie sua conta em poucos segundos para concluir o pedido. Seu carrinho continua salvo."
        />
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-foreground font-semibold mb-3">Seu carrinho está vazio</p>
        <Link to="/home" className="text-primary text-sm">
          Voltar às compras
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <header className="sticky top-0 z-20 glass px-4 pt-5 pb-3 border-b border-border/40 flex items-center gap-3">
        <Link to="/carrinho" className="size-10 grid place-items-center -ml-1">
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-base font-semibold">Finalizar pedido</h1>
      </header>

      <motion.main
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 py-5 space-y-6"
      >
        <section>
          <SectionTitle>Endereço de entrega</SectionTitle>
          {addresses.length === 0 ? (
            <Link
              to="/enderecos"
              className="block bg-card ring-1 ring-dashed ring-border rounded-2xl p-4 text-center"
            >
              <MapPin className="size-5 mx-auto text-muted-foreground mb-1" />
              <p className="text-sm font-semibold">Adicionar endereço</p>
            </Link>
          ) : (
            <div className="space-y-2">
              {addresses.map((a) => (
                <button
                  type="button"
                  key={a.id}
                  onClick={() => setAddressId(a.id)}
                  className={`w-full text-left bg-card rounded-2xl p-3 flex gap-3 ring-1 transition-colors ${
                    a.id === addressId
                      ? "ring-primary"
                      : "ring-border"
                  }`}
                >
                  <span
                    className={`size-5 rounded-full mt-0.5 grid place-items-center shrink-0 ring-2 ${
                      a.id === addressId
                        ? "bg-primary ring-primary"
                        : "bg-card ring-border"
                    }`}
                  >
                    {a.id === addressId && (
                      <span className="size-1.5 bg-primary-foreground rounded-full" />
                    )}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{a.label}</p>
                    <p className="text-xs text-muted-foreground leading-snug">
                      {a.street}, {a.number}
                      {a.complement ? ` · ${a.complement}` : ""}
                      <br />
                      {a.neighborhood} · {a.city}/{a.state}
                    </p>
                  </div>
                </button>
              ))}
              <Link
                to="/enderecos"
                className="text-xs font-semibold text-primary block px-1 pt-1"
              >
                Adicionar novo endereço
              </Link>
            </div>
          )}
        </section>

        <section>
          <SectionTitle>Forma de pagamento</SectionTitle>
          <div className="space-y-2">
            {methods.map(({ value, label, desc, icon: Icon }) => (
              <button
                type="button"
                key={value}
                onClick={() => setPayment(value)}
                className={`w-full text-left bg-card rounded-2xl p-3 flex items-center gap-3 ring-1 transition-colors ${
                  payment === value ? "ring-primary" : "ring-border"
                }`}
              >
                <span className="size-10 rounded-xl bg-muted grid place-items-center">
                  <Icon className="size-5" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold">{label}</p>
                  <p className="text-[11px] text-muted-foreground">{desc}</p>
                </div>
                <span
                  className={`size-5 rounded-full grid place-items-center ring-2 ${
                    payment === value
                      ? "bg-primary ring-primary"
                      : "bg-card ring-border"
                  }`}
                >
                  {payment === value && (
                    <span className="size-1.5 bg-primary-foreground rounded-full" />
                  )}
                </span>
              </button>
            ))}
          </div>
        </section>

        <section>
          <SectionTitle>Observações (opcional)</SectionTitle>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Ex: Sem cebola, troco pra R$ 100…"
            className="w-full bg-card ring-1 ring-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
          />
        </section>

        <section className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-2">
          <Row label="Subtotal" value={formatBRL(subtotal)} />
          <Row
            label="Entrega"
            value={
              deliveryFee === 0 ? (
                <span className="text-primary font-semibold">Grátis</span>
              ) : (
                formatBRL(deliveryFee)
              )
            }
          />
          <div className="h-px bg-border my-2" />
          <Row
            label={<span className="font-semibold text-foreground">Total</span>}
            value={
              <span className="text-lg font-bold text-foreground">
                {formatBRL(total)}
              </span>
            }
          />
        </section>
      </motion.main>

      <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border safe-bottom px-5 pt-3 pb-3">
        <div className="max-w-md mx-auto">
          <button
            type="button"
            disabled={placeOrder.isPending || !addressId}
            onClick={() => placeOrder.mutate()}
            className="w-full bg-primary text-primary-foreground rounded-2xl py-4 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-60"
          >
            {placeOrder.isPending && <Loader2 className="size-4 animate-spin" />}
            Confirmar pedido · {formatBRL(total)}
          </button>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold mb-2 px-1">{children}</h2>;
}
function Row({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
