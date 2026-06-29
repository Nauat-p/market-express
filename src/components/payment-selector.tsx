import {
  CreditCard,
  Banknote,
  Smartphone,
  AlertCircle,
  DollarSign,
} from "lucide-react";
import { FormField } from "./form-field";
import { maskCurrency, unmaskCurrency } from "@/lib/masks";
import { formatBRL } from "@/lib/format";

type PaymentMethod = "pix" | "credit" | "debit" | "cash";

interface PaymentOption {
  value: PaymentMethod;
  label: string;
  desc: string;
  icon: typeof CreditCard;
}

const PAYMENT_OPTIONS: PaymentOption[] = [
  { value: "pix", label: "PIX", desc: "Aprovação instantânea", icon: Smartphone },
  {
    value: "credit",
    label: "Cartão de crédito",
    desc: "Maquininha na entrega",
    icon: CreditCard,
  },
  {
    value: "debit",
    label: "Cartão de débito",
    desc: "Maquininha na entrega",
    icon: CreditCard,
  },
  { value: "cash", label: "Dinheiro", desc: "Pague na entrega", icon: Banknote },
];

interface PaymentSelectorProps {
  selectedMethod: PaymentMethod;
  onSelectMethod: (method: PaymentMethod) => void;
  total: number;
  changeAmount: string;
  onChangeAmountChange: (amount: string) => void;
}

export function PaymentSelector({
  selectedMethod,
  onSelectMethod,
  total,
  changeAmount,
  onChangeAmountChange,
}: PaymentSelectorProps) {
  const changeValue = unmaskCurrency(changeAmount);
  const change = changeValue - total;
  const isChangeValid = changeValue >= total && changeValue > 0;

  return (
    <div className="space-y-4">
      {/* Métodos de pagamento */}
      <div className="space-y-2">
        {PAYMENT_OPTIONS.map(({ value, label, desc, icon: Icon }) => (
          <button
            key={value}
            type="button"
            onClick={() => onSelectMethod(value)}
            className={`w-full text-left bg-card rounded-2xl p-3 flex items-center gap-3 ring-1 transition-all ${
              selectedMethod === value
                ? "ring-primary bg-primary/5"
                : "ring-border hover:ring-border/80"
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
              className={`size-5 rounded-full grid place-items-center ring-2 transition-all ${
                selectedMethod === value
                  ? "bg-primary ring-primary"
                  : "bg-card ring-border"
              }`}
            >
              {selectedMethod === value && (
                <span className="size-1.5 bg-primary-foreground rounded-full" />
              )}
            </span>
          </button>
        ))}
      </div>

      {/* Campo de troco para dinheiro */}
      {selectedMethod === "cash" && (
        <div className="bg-card ring-1 ring-border rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm">
            <AlertCircle className="w-4 h-4 text-amber-500" />
            <p className="font-medium text-amber-700 dark:text-amber-400">
              Informe o valor em dinheiro para calcular o troco
            </p>
          </div>

          <FormField
            label="Valor em dinheiro"
            value={changeAmount}
            onChange={onChangeAmountChange}
            placeholder="R$ 0,00"
            type="text"
            mask={maskCurrency}
            validate={(value) => {
              if (!value) return { valid: false, error: "Informe o valor" };
              const numValue = unmaskCurrency(value);
              if (numValue < total) {
                return {
                  valid: false,
                  error: `Mínimo de ${formatBRL(total)}`,
                };
              }
              return { valid: true };
            }}
            icon={<DollarSign className="w-4 h-4" />}
            autoComplete="off"
          />

          {/* Resumo do troco */}
          {isChangeValid && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-xl p-3 space-y-1.5">
              <p className="text-xs text-muted-foreground font-medium">
                Resumo do pagamento
              </p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total da compra:</span>
                <span className="font-semibold">{formatBRL(total)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Valor recebido:</span>
                <span className="font-semibold">{formatBRL(changeValue)}</span>
              </div>
              <div className="h-px bg-border my-1" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-green-700 dark:text-green-400">
                  Troco:
                </span>
                <span className="text-lg font-bold text-green-700 dark:text-green-400">
                  {formatBRL(change)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
