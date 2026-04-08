import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Upload, FileText, Loader2, Trash2, ExternalLink } from "lucide-react";
import { getStorageUrl } from "@/lib/storageUtils";

interface PdfUploadProps {
  /** Current PDF URL if already uploaded */
  currentPdfUrl: string | null;
  /** Storage folder inside the bucket e.g. "orders", "delivery-notes", "invoices" */
  folder: string;
  /** Called after successful upload with the public URL */
  onUploaded: (publicUrl: string) => void;
  /** Called when user removes the PDF */
  onRemoved?: () => void;
  /** Bucket name, defaults to "purchase-docs" */
  bucket?: string;
  compact?: boolean;
}

export default function PdfUpload({
  currentPdfUrl,
  folder,
  onUploaded,
  onRemoved,
  bucket = "purchase-docs",
  compact = false,
}: PdfUploadProps) {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "pdf";
      const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (error) throw error;

      const url = await getStorageUrl(bucket, path);
      onUploaded(url);
      toast({ title: "PDF subido correctamente" });
    } catch (e: any) {
      toast({ title: "Error al subir PDF", description: e.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={fileRef}
          type="file"
          accept="application/pdf,image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFile(f);
          }}
        />
        {currentPdfUrl ? (
          <>
            <a
              href={currentPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs flex items-center gap-1"
            >
              <FileText className="w-3.5 h-3.5" /> Ver PDF
              <ExternalLink className="w-3 h-3" />
            </a>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
            </Button>
            {onRemoved && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemoved}>
                <Trash2 className="w-3.5 h-3.5 text-destructive" />
              </Button>
            )}
          </>
        ) : (
          <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs h-7">
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Upload className="w-3.5 h-3.5 mr-1" />}
            Subir PDF
          </Button>
        )}
      </div>
    );
  }

  return (
    <div
      className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
      onClick={() => fileRef.current?.click()}
    >
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf,image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
      {uploading ? (
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Subiendo…</p>
        </div>
      ) : currentPdfUrl ? (
        <div className="flex flex-col items-center gap-2">
          <FileText className="w-8 h-8 text-primary" />
          <a href={currentPdfUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm" onClick={(e) => e.stopPropagation()}>
            Ver PDF <ExternalLink className="w-3 h-3 inline" />
          </a>
          <p className="text-xs text-muted-foreground">Haz clic para reemplazar</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-2">
          <Upload className="w-8 h-8 text-muted-foreground" />
          <p className="text-sm font-medium text-card-foreground">Subir PDF o imagen</p>
          <p className="text-xs text-muted-foreground">PDF, JPG, PNG · Máx 20MB</p>
        </div>
      )}
    </div>
  );
}
