import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { cartQuery, addressesQuery, ordersQuery } from "@/lib/queries";
import { supabase } from "@/integrations/supabase/client";
import { formatBRL } from "@/lib/format";
import { useClearCart } from "@/hooks/use-cart";
import { useFavorites } from "@/hooks/use-favorites";
import { useShoppingLists } from "@/hooks/use-shopping-lists";
import { useAuth } from "@/hooks/use-auth";
import { SignInRequired } from "@/components/sign-in-required";
import { CheckoutProgress, type CheckoutStep } from "@/components/checkout-progress";
import { AddressSelector } from "@/components/address-selector";
import { PaymentSelector } from "@/components/payment-selector";
import { OrderSummary } from "@/components/order-summary";
import { FormField } from "@/components/form-field";

export const Route = createFileRoute("/_authenticated/checkout")({
  ssr: false,
  component: CheckoutPage,
});

const FREE_DELIVERY_OVER = 50;
const DELIVERY_FEE = 5.99;

type PaymentMethod = "pix" | "credit" | "debit" | "cash";
type CheckoutStepId = "address" | "payment" | "notes" | "confirm";

function CheckoutPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { user, loading } = useAuth();
  const { data: cart = [] } = useQuery(cartQuery);
  const { data: addresses = [] } = useQuery({ ...addressesQuery, enabled: !!user });
  const clearCart = useClearCart();
  const { clearAll: clearFavorites } = useFavorites();
  const { deleteList, lists } = useShoppingLists();

  // Estados do checkout
  const defaultAddr = addresses.find((a) => a.is_default) ?? addresses[0];
  const [currentStep, setCurrentStep] = useState<CheckoutStepId>("address");
  const [addressId, setAddressId] = useState<string | undefined>(defaultAddr?.id);
  const [payment, setPayment] = useState<PaymentMethod>("pix");
  const [notes, setNotes] = useState("");
  const [changeAmount, setChangeAmount] = useState("");

  const selectedAddr = addresses.find((a) => a.id === addressId) ?? defaultAddr;

  // Cálculos
  const subtotal = cart.reduce(
    (sum, i) => sum + (i.product.sale_price ?? i.product.price) * i.quantity,
    0
  );
  const deliveryFee = subtotal >= FREE_DELIVERY_OVER ? 0 : DELIVERY_FEE;
  const total = subtotal + deliveryFee;

  // Etapas do checkout
  const steps: CheckoutStep[] = [
    {
      id: "address",
      label: "Endereço",
      completed: !!addressId && !!selectedAddr,
    },
    {
      id: "payment",
      label: "Pagamento",
      completed: !!payment && (payment !== "cash" || changeAmount),
    },
    {
      id: "notes",
      label: "Observações",
      completed: true, // Sempre opcional
    },
    {
      id: "confirm",
      label: "Confirmação",
      completed: false,
    },
  ];

  // Validações por etapa
  const isAddressValid = !!addressId && !!selectedAddr;
  const isPaymentValid = payment && (payment !== "cash" || changeAmount);
  const canProceed = {
    address: isAddressValid,
    payment: isPaymentValid,
    notes: true,
    confirm: true,
  };

  // Navegar entre etapas
  const goToStep = (step: CheckoutStepId) => {
    if (step === "address" || canProceed[step]) {
      setCurrentStep(step);
    }
  };

  const goToNextStep = () => {
    const stepOrder: CheckoutStepId[] = ["address", "payment", "notes", "confirm"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex < stepOrder.length - 1) {
      setCurrentStep(stepOrder[currentIndex + 1]);
    }
  };

  const goToPreviousStep = () => {
    const stepOrder: CheckoutStepId[] = ["address", "payment", "notes", "confirm"];
    const currentIndex = stepOrder.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(stepOrder[currentIndex - 1]);
    }
  };

  // Mutation para confirmar pedido
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
      // Limpa favoritos e todas as listas após pedido confirmado
      clearFavorites.mutate();
      lists.forEach((list) => deleteList.mutate(list.id));
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

      {/* Barra de progresso */}
      <CheckoutProgress steps={steps} currentStep={currentStep} />

      {/* Conteúdo das etapas */}
      <motion.main className="px-5 py-5 space-y-6">
        <AnimatePresence mode="wait">
          {/* Etapa 1: Endereço */}
          {currentStep === "address" && (
            <motion.section
              key="address"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-sm font-semibold mb-3 px-1">
                Endereço de entrega
              </h2>
              <AddressSelector
                addresses={addresses}
                selectedId={addressId}
                onSelect={setAddressId}
              />
            </motion.section>
          )}

          {/* Etapa 2: Pagamento */}
          {currentStep === "payment" && (
            <motion.section
              key="payment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-sm font-semibold mb-3 px-1">
                Forma de pagamento
              </h2>
              <PaymentSelector
                selectedMethod={payment}
                onSelectMethod={setPayment}
                total={total}
                changeAmount={changeAmount}
                onChangeAmountChange={setChangeAmount}
              />
            </motion.section>
          )}

          {/* Etapa 3: Observações */}
          {currentStep === "notes" && (
            <motion.section
              key="notes"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-sm font-semibold mb-3 px-1">
                Observações (opcional)
              </h2>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Ex: Sem cebola, troco pra R$ 100…"
                className="w-full bg-card ring-1 ring-border rounded-2xl py-3 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
              />
            </motion.section>
          )}

          {/* Etapa 4: Confirmação */}
          {currentStep === "confirm" && (
            <motion.section
              key="confirm"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-4"
            >
              <h2 className="text-sm font-semibold mb-3 px-1">
                Resumo do pedido
              </h2>

              {/* Resumo do endereço */}
              <div className="bg-card ring-1 ring-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Entrega em
                </p>
                <p className="text-sm font-semibold">{selectedAddr?.label}</p>
                <p className="text-xs text-muted-foreground leading-snug mt-1">
                  {selectedAddr?.street}, {selectedAddr?.number}
                  {selectedAddr?.complement ? ` · ${selectedAddr.complement}` : ""}
                  <br />
                  {selectedAddr?.neighborhood} · {selectedAddr?.city}/{selectedAddr?.state}
                </p>
              </div>

              {/* Resumo do pagamento */}
              <div className="bg-card ring-1 ring-border rounded-2xl p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  Forma de pagamento
                </p>
                <p className="text-sm font-semibold capitalize">
                  {payment === "pix" && "PIX"}
                  {payment === "credit" && "Cartão de crédito"}
                  {payment === "debit" && "Cartão de débito"}
                  {payment === "cash" && "Dinheiro"}
                </p>
              </div>

              {/* Resumo de observações */}
              {notes && (
                <div className="bg-card ring-1 ring-border rounded-2xl p-4">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Observações
                  </p>
                  <p className="text-sm text-foreground">{notes}</p>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Resumo do pedido (sempre visível) */}
        <OrderSummary
          subtotal={subtotal}
          deliveryFee={deliveryFee}
          total={total}
        />
      </motion.main>

      {/* Botões de navegação */}
      <div className="fixed bottom-0 inset-x-0 z-40 glass border-t border-border safe-bottom px-5 pt-3 pb-3">
        <div className="max-w-md mx-auto space-y-2">
          <div className="flex gap-2">
            {currentStep !== "address" && (
              <button
                type="button"
                onClick={goToPreviousStep}
                className="flex-1 bg-muted text-foreground rounded-2xl py-3 text-sm font-semibold active:scale-[.98] transition-transform"
              >
                Voltar
              </button>
            )}

            {currentStep !== "confirm" ? (
              <button
                type="button"
                disabled={!canProceed[currentStep]}
                onClick={goToNextStep}
                className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold active:scale-[.98] transition-transform disabled:opacity-60"
              >
                Próximo
              </button>
            ) : (
              <button
                type="button"
                disabled={placeOrder.isPending || !isPaymentValid}
                onClick={() => placeOrder.mutate()}
                className="flex-1 bg-primary text-primary-foreground rounded-2xl py-3 text-sm font-semibold flex items-center justify-center gap-2 active:scale-[.98] transition-transform disabled:opacity-60"
              >
                {placeOrder.isPending && <Loader2 className="size-4 animate-spin" />}
                Confirmar · {formatBRL(total)}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
