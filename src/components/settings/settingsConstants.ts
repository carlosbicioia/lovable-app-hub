import {
  Droplets, Zap, Wind, Wrench, Flame, ThermometerSun,
  Paintbrush, Hammer, Cable, Lock, Pipette, Gauge, Cog, Fan, Plug, Construction,
} from "lucide-react";
import React from "react";

export const roles = [
  { value: "admin", label: "Administrador", desc: "Acceso total al sistema" },
  { value: "gestor", label: "Gestor", desc: "Gestión de servicios, presupuestos y clientes" },
  { value: "colaborador", label: "Colaborador", desc: "Consulta sus servicios y puede solicitar nuevos servicios" },
  { value: "operario", label: "Operario", desc: "Solo acceso a sus servicios asignados" },
  { value: "lectura", label: "Solo lectura", desc: "Visualización sin edición" },
  { value: "pantalla", label: "Pantalla TV", desc: "Solo ve el panel de KPIs en modo cine" },
];

export const iconMap: Record<string, React.ReactNode> = {
  Droplets: React.createElement(Droplets, { className: "w-4 h-4" }),
  Zap: React.createElement(Zap, { className: "w-4 h-4" }),
  Wind: React.createElement(Wind, { className: "w-4 h-4" }),
  Wrench: React.createElement(Wrench, { className: "w-4 h-4" }),
  Flame: React.createElement(Flame, { className: "w-4 h-4" }),
  ThermometerSun: React.createElement(ThermometerSun, { className: "w-4 h-4" }),
  Paintbrush: React.createElement(Paintbrush, { className: "w-4 h-4" }),
  Hammer: React.createElement(Hammer, { className: "w-4 h-4" }),
  Cable: React.createElement(Cable, { className: "w-4 h-4" }),
  Lock: React.createElement(Lock, { className: "w-4 h-4" }),
  Pipette: React.createElement(Pipette, { className: "w-4 h-4" }),
  Gauge: React.createElement(Gauge, { className: "w-4 h-4" }),
  Cog: React.createElement(Cog, { className: "w-4 h-4" }),
  Fan: React.createElement(Fan, { className: "w-4 h-4" }),
  Plug: React.createElement(Plug, { className: "w-4 h-4" }),
  Construction: React.createElement(Construction, { className: "w-4 h-4" }),
};

export const colorOptions = [
  { value: "bg-info/15 text-info border-info/30", label: "Azul (Info)" },
  { value: "bg-warning/15 text-warning border-warning/30", label: "Naranja (Warning)" },
  { value: "bg-success/15 text-success border-success/30", label: "Verde (Success)" },
  { value: "bg-destructive/15 text-destructive border-destructive/30", label: "Rojo (Destructive)" },
  { value: "bg-primary/15 text-primary border-primary/30", label: "Primario" },
  { value: "bg-muted text-muted-foreground border-border", label: "Neutro" },
];

export const iconOptions = [
  { value: "Droplets", label: "💧 Agua / Fontanería" },
  { value: "Zap", label: "⚡ Electricidad" },
  { value: "Wind", label: "🌀 Clima / Aire" },
  { value: "Flame", label: "🔥 Gas / Calefacción" },
  { value: "ThermometerSun", label: "🌡 Calor / Solar" },
  { value: "Fan", label: "🌬 Ventilación" },
  { value: "Plug", label: "🔌 Conexiones" },
  { value: "Cable", label: "🔗 Cableado" },
  { value: "Paintbrush", label: "🖌 Pintura / Acabados" },
  { value: "Hammer", label: "🔨 Albañilería" },
  { value: "Construction", label: "🏗 Obra civil" },
  { value: "Lock", label: "🔒 Cerrajería" },
  { value: "Pipette", label: "🧪 Químicos" },
  { value: "Gauge", label: "📊 Medición" },
  { value: "Cog", label: "⚙ Mecánica" },
  { value: "Wrench", label: "🔧 General" },
];
