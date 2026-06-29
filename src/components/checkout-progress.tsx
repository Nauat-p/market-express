import { Check } from "lucide-react";

export interface CheckoutStep {
  id: string;
  label: string;
  completed: boolean;
}

interface CheckoutProgressProps {
  steps: CheckoutStep[];
  currentStep: string;
}

export function CheckoutProgress({ steps, currentStep }: CheckoutProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentIndex + 1) / steps.length) * 100;

  return (
    <div className="px-5 py-4 bg-card/50 backdrop-blur-sm border-b border-border/50">
      {/* Barra de progresso */}
      <div className="mb-4">
        <div className="h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Etapas */}
      <div className="flex items-center justify-between gap-2">
        {steps.map((step, index) => {
          const isCompleted = step.completed;
          const isCurrent = step.id === currentStep;
          const isPast = index < currentIndex;

          return (
            <div key={step.id} className="flex-1">
              <div className="flex items-center gap-2">
                {/* Círculo do passo */}
                <div
                  className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs transition-all ${
                    isCompleted || isPast
                      ? "bg-primary text-primary-foreground"
                      : isCurrent
                        ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted || isPast ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Linha conectora */}
                {index < steps.length - 1 && (
                  <div
                    className={`flex-1 h-1 rounded-full transition-all ${
                      isCompleted || isPast ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <p
                className={`text-[11px] font-semibold mt-1.5 text-center transition-colors ${
                  isCurrent || isCompleted
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
