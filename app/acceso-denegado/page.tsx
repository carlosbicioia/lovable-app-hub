"use client";

import { ShieldX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function AccessDenied() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center">
        <ShieldX className="w-10 h-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-display font-bold text-foreground">Acceso denegado</h1>
        <p className="text-muted-foreground max-w-md">
          No tienes permisos para acceder a esta sección. Contacta con un administrador si crees que esto es un error.
        </p>
      </div>
      <Button variant="outline" onClick={() => router.push("/")}>
        Volver al inicio
      </Button>
    </div>
  );
}
