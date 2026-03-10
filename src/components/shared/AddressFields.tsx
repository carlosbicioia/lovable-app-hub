import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AddressFieldsProps {
  address: string;
  onAddressChange: (v: string) => void;
  streetNumber: string;
  onStreetNumberChange: (v: string) => void;
  floor: string;
  onFloorChange: (v: string) => void;
  addressExtra: string;
  onAddressExtraChange: (v: string) => void;
  /** Span full width (col-span-2) — default true */
  fullWidth?: boolean;
}

export default function AddressFields({
  address, onAddressChange,
  streetNumber, onStreetNumberChange,
  floor, onFloorChange,
  addressExtra, onAddressExtraChange,
  fullWidth = true,
}: AddressFieldsProps) {
  return (
    <div className={fullWidth ? "col-span-2 grid grid-cols-12 gap-3" : "grid grid-cols-12 gap-3"}>
      <div className="col-span-6 space-y-1.5">
        <Label>Calle</Label>
        <Input value={address} onChange={(e) => onAddressChange(e.target.value)} placeholder="Nombre de la calle" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Número</Label>
        <Input value={streetNumber} onChange={(e) => onStreetNumberChange(e.target.value)} placeholder="Nº" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Piso</Label>
        <Input value={floor} onChange={(e) => onFloorChange(e.target.value)} placeholder="1ºA" />
      </div>
      <div className="col-span-2 space-y-1.5">
        <Label>Adicional</Label>
        <Input value={addressExtra} onChange={(e) => onAddressExtraChange(e.target.value)} placeholder="Esc, puerta..." />
      </div>
    </div>
  );
}

/** Compose full address string for display */
export function formatFullAddress(parts: {
  address?: string;
  streetNumber?: string;
  floor?: string;
  addressExtra?: string;
  city?: string;
}): string {
  const { address = "", streetNumber = "", floor = "", addressExtra = "", city = "" } = parts;
  const line = [address, streetNumber].filter(Boolean).join(" ");
  const detail = [floor, addressExtra].filter(Boolean).join(", ");
  const full = [line, detail].filter(Boolean).join(", ");
  return city ? `${full}, ${city}` : full;
}
