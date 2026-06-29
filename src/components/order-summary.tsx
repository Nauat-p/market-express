import { formatBRL } from "@/lib/format";

interface OrderSummaryProps {
  subtotal: number;
  deliveryFee: number;
  total: number;
  freeDeliveryThreshold?: number;
}

export function OrderSummary({
  subtotal,
  deliveryFee,
  total,
  freeDeliveryThreshold = 50,
}: OrderSummaryProps) {
  const remainingForFreeDelivery = Math.max(0, freeDeliveryThreshold - subtotal);

  return (
    <section className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-3">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="font-medium">{formatBRL(subtotal)}</span>
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Entrega</span>
          {deliveryFee === 0 ? (
            <span className="text-green-600 dark:text-green-400 font-semibold">
              Grátis
            </span>
          ) : (
            <span className="font-medium">{formatBRL(deliveryFee)}</span>
          )}
        </div>

        {/* Aviso de frete grátis */}
        {remainingForFreeDelivery > 0 && deliveryFee > 0 && (
          <div className="bg-amber-50 dark:bg-amber-950/30 rounded-lg p-2 mt-2">
            <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium">
              Faltam {formatBRL(remainingForFreeDelivery)} para frete grátis
            </p>
          </div>
        )}
      </div>

      <div className="h-px bg-border" />

      <div className="flex items-center justify-between">
        <span className="font-semibold text-foreground">Total</span>
        <span className="text-2xl font-bold text-primary">{formatBRL(total)}</span>
      </div>
    </section>
  );
}
