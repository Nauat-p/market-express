import { MapPin, Plus } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { type Address } from "@/lib/queries";

interface AddressSelectorProps {
  addresses: Address[];
  selectedId?: string;
  onSelect: (id: string) => void;
  canAddNew?: boolean;
}

export function AddressSelector({
  addresses,
  selectedId,
  onSelect,
  canAddNew = true,
}: AddressSelectorProps) {
  if (addresses.length === 0) {
    return (
      <Link
        to="/enderecos"
        className="block bg-card ring-1 ring-dashed ring-border rounded-2xl p-4 text-center hover:ring-primary/50 transition-colors"
      >
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="size-5 text-muted-foreground" />
          <Plus className="size-4 text-muted-foreground" />
        </div>
        <p className="text-sm font-semibold">Adicionar endereço de entrega</p>
      </Link>
    );
  }

  return (
    <div className="space-y-2">
      {addresses.map((address) => (
        <button
          key={address.id}
          type="button"
          onClick={() => onSelect(address.id)}
          className={`w-full text-left bg-card rounded-2xl p-3 flex gap-3 ring-1 transition-all ${
            address.id === selectedId
              ? "ring-primary bg-primary/5"
              : "ring-border hover:ring-border/80"
          }`}
        >
          <span
            className={`size-5 rounded-full mt-0.5 grid place-items-center shrink-0 ring-2 transition-all ${
              address.id === selectedId
                ? "bg-primary ring-primary"
                : "bg-card ring-border"
            }`}
          >
            {address.id === selectedId && (
              <span className="size-1.5 bg-primary-foreground rounded-full" />
            )}
          </span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold">{address.label}</p>
              {address.is_default && (
                <span className="text-[10px] font-bold uppercase tracking-wider bg-primary-soft text-primary px-1.5 py-0.5 rounded-full">
                  Padrão
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-snug mt-0.5">
              {address.street}, {address.number}
              {address.complement ? ` · ${address.complement}` : ""}
              <br />
              {address.neighborhood} · {address.city}/{address.state}
            </p>
          </div>
        </button>
      ))}

      {canAddNew && (
        <Link
          to="/enderecos"
          className="text-xs font-semibold text-primary block px-1 pt-2 hover:underline"
        >
          + Adicionar novo endereço
        </Link>
      )}
    </div>
  );
}
