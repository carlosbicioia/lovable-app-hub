import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Camera, Trash2, Loader2, X, Play, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { getSignedUrl } from "@/lib/storageUtils";
import { Checkbox } from "@/components/ui/checkbox";
import { useServices } from "@/hooks/useServices";
import { Dialog, DialogContent } from "@/components/ui/dialog";
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
  const [dragging, setDragging] = useState(false);
  const [lightboxItem, setLightboxItem] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const fetchMedia = async () => {
    const { data } = await supabase
      .from("service_media")
      .select("*")
      .eq("service_id", serviceId)
      .order("created_at", { ascending: false });

    if (data) {
      const withUrls = await Promise.all(
        data.map(async (m: any) => ({
          ...m,
          publicUrl: (await getSignedUrl("service-media", m.file_path)) || "",
        }))
      );
      setMedia(withUrls);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMedia();
  }, [serviceId]);

  const uploadFiles = async (files: File[]) => {
    if (!files.length) return;
    setUploading(true);
    let uploadedCount = 0;

    for (const file of files) {
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    await uploadFiles(Array.from(files));
  };

  // Drag & drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Only set false if leaving the drop zone entirely
    if (dropRef.current && !dropRef.current.contains(e.relatedTarget as Node)) {
      setDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await uploadFiles(files);
    }
  }, [serviceId]);

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

  const [optimisticNoMedia, setOptimisticNoMedia] = useState<boolean | null>(null);
  const effectiveNoMedia = optimisticNoMedia !== null ? optimisticNoMedia : noMediaAvailable;

  // Sync optimistic state when real data catches up
  useEffect(() => {
    if (optimisticNoMedia !== null && noMediaAvailable === optimisticNoMedia) {
      setOptimisticNoMedia(null);
    }
  }, [noMediaAvailable, optimisticNoMedia]);

  const handleToggleNoMedia = async () => {
    if (readOnly) return;
    const newValue = !effectiveNoMedia;
    setOptimisticNoMedia(newValue);
    await updateService(service.id, { no_media_available: newValue });
  };

  return (
    <>
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
                checked={effectiveNoMedia}
                onCheckedChange={handleToggleNoMedia}
                disabled={readOnly}
                className={cn(
                  "h-3.5 w-3.5 transition-colors",
                  effectiveNoMedia ? "data-[state=checked]:bg-warning data-[state=checked]:border-warning" : ""
                )}
              />
              <span className="text-xs text-muted-foreground">
                No es posible obtener archivos multimedia
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload / Drop zone */}
          <div
            ref={dropRef}
            className={cn(
              "border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
              dragging
                ? "border-primary bg-primary/10"
                : uploading
                  ? "border-primary/50 bg-primary/5"
                  : "border-border hover:border-primary/50"
            )}
            onClick={() => !uploading && fileInputRef.current?.click()}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
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
                  {dragging ? (
                    <span className="text-primary font-medium">Suelta los archivos aquí</span>
                  ) : (
                    <>
                      Arrastra archivos o{" "}
                      <span className="text-primary font-medium">seleccionar</span>
                    </>
                  )}
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

          {/* Media grid - thumbnails */}
          {loading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : media.length > 0 ? (
            <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 lg:grid-cols-11 gap-1.5">
              {media.map((item) => (
                <div
                  key={item.id}
                  className="relative group rounded-lg overflow-hidden border border-border bg-muted/30 aspect-square cursor-pointer"
                  onClick={() => setLightboxItem(item)}
                >
                  {item.file_type === "video" ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img
                      src={item.publicUrl}
                      alt={item.file_name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-end">
                    <div className="w-full p-1.5 bg-gradient-to-t from-foreground/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                      <p className="text-[10px] text-white truncate">{item.file_name}</p>
                    </div>
                  </div>
                  {/* Delete button */}
                  {!readOnly && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item);
                      }}
                      className="absolute top-1 right-1 p-1 rounded-full bg-destructive/80 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
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

      {/* Lightbox dialog */}
      <Dialog open={!!lightboxItem} onOpenChange={(open) => !open && setLightboxItem(null)}>
        <DialogContent className="max-w-4xl w-[95vw] p-2 sm:p-4">
          {lightboxItem && (
            <div className="flex flex-col items-center gap-3">
              {lightboxItem.file_type === "video" ? (
                <video
                  src={lightboxItem.publicUrl}
                  controls
                  className="max-h-[75vh] w-full rounded-lg"
                />
              ) : (
                <img
                  src={lightboxItem.publicUrl}
                  alt={lightboxItem.file_name}
                  className="max-h-[75vh] w-auto rounded-lg object-contain"
                />
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="font-medium text-foreground">{lightboxItem.file_name}</span>
                <span>{formatSize(lightboxItem.file_size)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
