"use client";

import { Construction } from "lucide-react";

export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <div className="p-4 rounded-2xl bg-primary/10 mb-4">
        <Construction className="w-10 h-10 text-primary" />
      </div>
      <h1 className="text-2xl font-display font-bold text-foreground">Próximamente</h1>
      <p className="text-muted-foreground mt-2 max-w-md">
        Este módulo está en desarrollo. Pronto estará disponible para gestionar tu operativa.
      </p>
    </div>
  );
}
