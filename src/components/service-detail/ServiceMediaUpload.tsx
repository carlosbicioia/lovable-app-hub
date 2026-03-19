import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Trash2, Loader2, X, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Checkbox } from "@/components/ui/checkbox";
import { useServices } from "@/hooks/useServices";
import type { Service } from "@/types/urbango";

interface MediaFile {
  id: string;
  service_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  caption: string;
  file_size: number;
  created_at: string;
  publicUrl: string;
}

interface Props {
  service: Service;
  readOnly?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export default function ServiceMediaUpload({ service, readOnly }: Props) {
  const serviceId = service.id;
  const { updateService } = useServices();
  const noMediaAvailable = service.noMediaAvailable ?? false;
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPublicUrl = (filePath: string) =>
    `${SUPABASE_URL}/storage/v1/object/public/service-media/${filePath}`;

  const fetchMedia = async () => {
    const { data } = await supabase
      .from("service_media")
      .select("*")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    if (data) {
      setMedia(
        data.map((m: any) => ({
          ...m,
          publicUrl: getPublicUrl(m.file_path),
        }))
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [serviceId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    let uploadedCount = 0;

    for (const file of Array.from(files)) {
      // Validate size (20MB)
      if (file.size > 20 * 1024 * 1024) {
        toast({ title: "Error", description: `${file.name} supera los 20MB`, variant: "destructive" });
        continue;
      }

      const isVideo = file.type.startsWith("video/");
      const isImage = file.type.startsWith("image/");
      if (!isVideo && !isImage) {
        toast({ title: "Error", description: `${file.name}: formato no soportado`, variant: "destructive" });
        continue;
      }

      const ext = file.name.split(".").pop();
      const filePath = `${serviceId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("service-media")
        .upload(filePath, file);

      if (uploadError) {
        toast({ title: "Error", description: `Error subiendo ${file.name}`, variant: "destructive" });
        continue;
      }

      // Save metadata
      await supabase.from("service_media").insert({
        service_id: serviceId,
        file_name: file.name,
        file_path: filePath,
        file_type: isVideo ? "video" : "photo",
        file_size: file.size,
      });

      uploadedCount++;
    }

    if (uploadedCount > 0) {
      toast({ title: `${uploadedCount} archivo(s) subido(s)` });
      await fetchMedia();
    }

    setUploading(false);
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDelete = async (item: MediaFile) => {
    await supabase.storage.from("service-media").remove([item.file_path]);
    await supabase.from("service_media").delete().eq("id", item.id);
    setMedia((prev) => prev.filter((m) => m.id !== item.id));
    toast({ title: "Archivo eliminado" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleToggleNoMedia = async () => {
    if (readOnly) return;
    await updateService(service.id, { no_media_available: !noMediaAvailable });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Camera className="w-4 h-4 text-muted-foreground" />
            Archivos Multimedia
          </CardTitle>
          <div
            className={cn(
              "flex items-center gap-2",
              !readOnly ? "cursor-pointer" : "opacity-60 cursor-default"
            )}
            onClick={handleToggleNoMedia}
          >
            <Checkbox
              checked={noMediaAvailable}
              onCheckedChange={handleToggleNoMedia}
              disabled={readOnly}
              className={cn(
                "h-3.5 w-3.5 transition-colors",
                noMediaAvailable ? "data-[state=checked]:bg-warning data-[state=checked]:border-warning" : ""
              )}
            />
            <span className="text-xs text-muted-foreground">
              No es posible obtener archivos multimedia
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload zone */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            uploading ? "border-primary/50 bg-primary/5" : "border-border hover:border-primary/50"
          )}
          onClick={() => !uploading && fileInputRef.current?.click()}
        >
          {uploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-7 h-7 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Subiendo archivos...</p>
            </div>
          ) : (
            <>
              <Camera className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
              <p className="text-sm text-muted-foreground">
                Arrastra archivos o{" "}
                <span className="text-primary font-medium">seleccionar</span>
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                JPG, PNG, MP4 · Máx. 20MB por archivo
              </p>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            className="hidden"
            onChange={handleUpload}
          />
        </div>

        {/* Media grid */}
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : media.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {media.map((item) => (
              <div
                key={item.id}
                className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square"
              >
                {item.file_type === "video" ? (
                  <div className="w-full h-full flex items-center justify-center bg-muted">
                    <Play className="w-10 h-10 text-muted-foreground" />
                  </div>
                ) : (
                  <img
                    src={item.publicUrl}
                    alt={item.file_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                )}
                {/* Overlay */}
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-end">
                  <div className="w-full p-2 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[11px] text-white truncate">{item.file_name}</p>
                    <p className="text-[10px] text-white/70">{formatSize(item.file_size)}</p>
                  </div>
                </div>
                {/* Delete button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item);
                  }}
                  className="absolute top-1.5 right-1.5 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Sin archivos multimedia adjuntos
          </p>
        )}
      </CardContent>
    </Card>
  );
}
