import { useState } from "react";
import { Download, Share, SquarePlus } from "lucide-react";
import { toast } from "sonner";
import { usePwaInstall } from "@/hooks/use-pwa-install";

export function InstallPwaCard() {
  const { canInstall, needsIosInstructions, isInstalled, promptInstall } = usePwaInstall();
  const [showIosSteps, setShowIosSteps] = useState(false);

  if (isInstalled || (!canInstall && !needsIosInstructions)) return null;

  const handleInstall = async () => {
    if (canInstall) {
      const accepted = await promptInstall();
      if (accepted) toast.success("App instalado com sucesso!");
      return;
    }
    setShowIosSteps((prev) => !prev);
  };

  return (
    <div className="bg-primary-soft ring-1 ring-primary/20 rounded-2xl p-4 space-y-3">
      <button type="button" onClick={handleInstall} className="w-full flex items-center gap-3 text-left">
        <span className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
          <Download className="size-4" />
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">Instalar aplicativo</p>
          <p className="text-[11px] text-muted-foreground">
            Adicione à tela inicial para abrir como um app
          </p>
        </div>
      </button>

      {needsIosInstructions && showIosSteps && (
        <div className="bg-card rounded-xl p-3 space-y-2 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Share className="size-3.5 text-primary shrink-0" />
            1. Toque no ícone de compartilhar do Safari
          </p>
          <p className="flex items-center gap-2">
            <SquarePlus className="size-3.5 text-primary shrink-0" />
            2. Escolha "Adicionar à Tela de Início"
          </p>
        </div>
      )}
    </div>
  );
}
