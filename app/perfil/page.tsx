"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, User, Mail, Camera } from "lucide-react";

export default function Profile() {
  const { user, session } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      getProfile();
    }
  }, [user]);

  async function getProfile() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user!.id)
        .single();

      if (error) {
        console.error("Error loading profile:", error);
        return;
      }

      if (data) {
        setFullName(data.full_name || "");
        setAvatarUrl(data.avatar_url);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  }

  async function updateProfile() {
    try {
      setSaving(true);
      const { error } = await supabase
        .from("profiles")
        .upsert({
          id: user!.id,
          full_name: fullName,
          avatar_url: avatarUrl,
          email: user!.email!,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;

      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: fullName, avatar_url: avatarUrl }
      });

      if (authError) throw authError;

      toast.success("Perfil actualizado correctamente");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Error al actualizar el perfil");
    } finally {
      setSaving(false);
    }
  }

  async function uploadAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    try {
      setUploading(true);
      
      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("Debes seleccionar una imagen para subir.");
      }

      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const filePath = `${user!.id}/${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        if (uploadError.message.includes("Bucket not found")) {
            throw new Error("El bucket de avatares no existe. Contacta al administrador.");
        }
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(filePath);
      
      setAvatarUrl(data.publicUrl);
      
      const { error: updateError } = await supabase
        .from("profiles")
        .upsert({
          id: user!.id,
          avatar_url: data.publicUrl,
          updated_at: new Date().toISOString(),
        });

      if (updateError) throw updateError;
      
      const { error: authError } = await supabase.auth.updateUser({
        data: { avatar_url: data.publicUrl }
      });

      if (authError) throw authError;

      toast.success("Avatar actualizado");
    } catch (error: any) {
      console.error("Error uploading avatar:", error);
      toast.error(error.message || "Error al subir el avatar");
    } finally {
      setUploading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : user?.email?.substring(0, 2).toUpperCase() || "KV";

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Mi Perfil</h1>
      
      <div className="grid gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Información Personal</CardTitle>
            <CardDescription>
              Gestiona tu información personal y cómo te ven los demás usuarios.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-col items-center sm:flex-row gap-6">
              <div className="relative group">
                <Avatar className="h-24 w-24 cursor-pointer ring-2 ring-background shadow-sm">
                  <AvatarImage src={avatarUrl || ""} alt={fullName} />
                  <AvatarFallback className="text-xl bg-primary/10 text-primary">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <label 
                  htmlFor="avatar-upload" 
                  className="absolute inset-0 flex items-center justify-center bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                >
                  <Camera className="h-6 w-6" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={uploadAvatar}
                    disabled={uploading}
                    className="hidden"
                  />
                </label>
                {uploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full">
                    <Loader2 className="h-6 w-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="font-medium text-lg">{fullName || "Sin nombre"}</h3>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Haz clic en la imagen para cambiar tu avatar
                </p>
              </div>
            </div>

            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="email" 
                    value={user?.email || ""} 
                    disabled 
                    className="pl-9 bg-muted" 
                  />
                </div>
                <p className="text-[0.8rem] text-muted-foreground">
                  Tu email no se puede cambiar ya que se usa para iniciar sesión.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fullName">Nombre Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="fullName" 
                    placeholder="Tu nombre completo" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={updateProfile} disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
