import { useRef, useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Upload, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface LogoUploadSectionProps {
  logoUrl: string | null;
  onUploaded: (url: string) => void;
  onRemoved: () => void;
}

export default function LogoUploadSection({ logoUrl, onUploaded, onRemoved }: LogoUploadSectionProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);

  const displayUrl = localPreview || logoUrl;

  const handleUpload = async (file: File) => {
    if (file.size > 2 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 2 MB");
      return;
    }
    setLocalPreview(URL.createObjectURL(file));
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() ?? "png";
      const path = `logo.${ext}`;
      await supabase.storage.from("company-assets").remove([path]);
      const { error } = await supabase.storage.from("company-assets").upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("company-assets").getPublicUrl(path);
      onUploaded(`${urlData.publicUrl}?t=${Date.now()}`);
    } catch (err: any) {
      console.error(err);
      toast.error("Error al subir el logotipo");
      setLocalPreview(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Logotipo</Label>
      <div className="flex items-start gap-4">
        <div
          className="w-32 h-32 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden shrink-0"
          style={{
            backgroundImage: 'linear-gradient(45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(-45deg, hsl(var(--muted)) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, hsl(var(--muted)) 75%), linear-gradient(-45deg, transparent 75%, hsl(var(--muted)) 75%)',
            backgroundSize: '16px 16px',
            backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0px',
          }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt="Logo de la empresa"
              className="w-full h-full object-contain p-2"
              onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="flex flex-col items-center gap-1 text-muted-foreground">
              <Upload className="w-6 h-6" />
              <span className="text-[10px]">Sin logo</span>
            </div>
          )}
        </div>
        <div className="pt-2 space-y-2">
          <input ref={fileRef} type="file" accept="image/png,image/svg+xml,image/jpeg,image/webp" className="hidden" onChange={(e) => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }} />
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 mr-1.5" />}
              {uploading ? "Subiendo..." : displayUrl ? "Cambiar logo" : "Subir logo"}
            </Button>
            {displayUrl && (
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => { setLocalPreview(null); onRemoved(); }}>
                <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Eliminar
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">PNG, SVG o JPG, máximo 2 MB</p>
        </div>
      </div>
    </div>
  );
}
