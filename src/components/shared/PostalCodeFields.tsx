import { useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SearchableSelect from "@/components/shared/SearchableSelect";
import { getProvinceFromPostalCode } from "@/data/spanishProvinces";
import { useMunicipalities } from "@/hooks/useMunicipalities";

interface PostalCodeFieldsProps {
  postalCode: string;
  onPostalCodeChange: (value: string) => void;
  province: string;
  onProvinceChange: (value: string) => void;
  city: string;
  onCityChange: (value: string) => void;
  /** Show all 3 fields in a single row (grid handled externally) */
  className?: string;
}

/**
 * Reusable component: Código postal → Provincia (auto) → Población (dropdown).
 * Renders 3 fields meant to sit in a CSS grid.
 */
export default function PostalCodeFields({
  postalCode,
  onPostalCodeChange,
  province,
  onProvinceChange,
  city,
  onCityChange,
  className,
}: PostalCodeFieldsProps) {
  const { data: municipalities = [] } = useMunicipalities(province);

  // Auto-fill province when postal code has at least 2 digits
  const handlePostalCodeChange = useCallback(
    (value: string) => {
      // Only allow digits, max 5 chars
      const clean = value.replace(/\D/g, "").slice(0, 5);
      onPostalCodeChange(clean);

      if (clean.length >= 2) {
        const prov = getProvinceFromPostalCode(clean);
        if (prov && prov !== province) {
          onProvinceChange(prov);
          // Reset city when province changes
          onCityChange("");
        }
      }
    },
    [onPostalCodeChange, onProvinceChange, onCityChange, province]
  );

  // Build options for the municipality dropdown
  const municipalityOptions = municipalities.map((m) => ({
    value: m.name,
    label: m.name,
  }));

  // If current city is not in the list, add it as an option so it stays selected
  if (city && !municipalityOptions.find((o) => o.value === city)) {
    municipalityOptions.unshift({ value: city, label: city });
  }

  return (
    <>
      <div className="space-y-2">
        <Label>Código postal *</Label>
        <Input
          value={postalCode}
          onChange={(e) => handlePostalCodeChange(e.target.value)}
          placeholder="28001"
          maxLength={5}
          inputMode="numeric"
        />
      </div>
      <div className="space-y-2">
        <Label>Provincia</Label>
        <Input
          value={province}
          readOnly
          className="bg-muted/50"
          placeholder="Se rellena automáticamente"
        />
      </div>
      <div className="space-y-2">
        <Label>Población *</Label>
        {municipalityOptions.length > 0 ? (
          <SearchableSelect
            options={municipalityOptions}
            value={city}
            onValueChange={onCityChange}
            placeholder="Seleccionar población…"
            searchPlaceholder="Buscar población…"
            emptyText="Sin resultados"
          />
        ) : (
          <Input
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
            placeholder={province ? "Cargando poblaciones…" : "Introduce el código postal primero"}
          />
        )}
      </div>
    </>
  );
}
