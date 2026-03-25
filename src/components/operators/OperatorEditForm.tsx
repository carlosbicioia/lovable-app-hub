"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import type { Operator } from "@/types/urbango";

interface OperatorEditFormProps {
  operator: Operator;
  onSaved: () => void;
}

export default function OperatorEditForm({ operator, onSaved }: OperatorEditFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: operator.name || "",
    email: operator.email || "",
    phone: operator.phone || "",
    address: operator.address || "",
    city: operator.city || "",
    province: operator.province || "",
    dni: operator.dni || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase
        .from("operators")
        .update(formData)
        .eq("id", operator.id);
        
      if (error) throw error;
      
      toast({ title: "Guardado", description: "Operario actualizado correctamente" });
      onSaved();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl bg-card p-6 rounded-lg border">
      <h3 className="text-lg font-medium mb-4">Editar Operario</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Nombre completo</Label>
          <Input 
            value={formData.name} 
            onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Email</Label>
          <Input 
            type="email" 
            value={formData.email} 
            onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))} 
            required 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Teléfono</Label>
          <Input 
            value={formData.phone} 
            onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>DNI / NIE</Label>
          <Input 
            value={formData.dni} 
            onChange={(e) => setFormData(p => ({ ...p, dni: e.target.value }))} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Dirección</Label>
          <Input 
            value={formData.address} 
            onChange={(e) => setFormData(p => ({ ...p, address: e.target.value }))} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Ciudad</Label>
          <Input 
            value={formData.city} 
            onChange={(e) => setFormData(p => ({ ...p, city: e.target.value }))} 
          />
        </div>
        
        <div className="space-y-2">
          <Label>Provincia</Label>
          <Input 
            value={formData.province} 
            onChange={(e) => setFormData(p => ({ ...p, province: e.target.value }))} 
          />
        </div>
      </div>
      
      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" type="button" onClick={onSaved} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Guardar cambios"}
        </Button>
      </div>
    </form>
  );
}
