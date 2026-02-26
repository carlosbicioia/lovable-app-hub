import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Video, FileText, Upload, Camera, CheckCircle } from "lucide-react";
import type { Service } from "@/types/urbango";
import { Button } from "@/components/ui/button";

interface Props {
  service: Service;
}

function MediaSection({
  title,
  icon: Icon,
  photos,
  videos,
  emptyText,
}: {
  title: string;
  icon: React.ElementType;
  photos: any[];
  videos: any[];
  emptyText: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-sm font-medium text-foreground">{title}</h4>
          <span className="text-xs text-muted-foreground">
            {photos.length} fotos · {videos.length} vídeos
          </span>
        </div>
        <Button variant="outline" size="sm">
          <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir
        </Button>
      </div>
      {photos.length === 0 && videos.length === 0 ? (
        <div className="py-6 text-center border border-dashed border-border rounded-lg">
          <Icon className="w-7 h-7 text-muted-foreground mx-auto mb-1.5" />
          <p className="text-sm text-muted-foreground">{emptyText}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((m) => (
            <div key={m.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-video">
              <img
                src={m.url}
                alt={m.caption || "Foto"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
              />
              {m.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">{m.caption}</p>
                </div>
              )}
            </div>
          ))}
          {videos.map((m) => (
            <div key={m.id} className="relative flex items-center justify-center rounded-lg border border-border bg-muted aspect-video">
              <Video className="w-8 h-8 text-muted-foreground" />
              {m.caption && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                  <p className="text-xs text-white truncate">{m.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ServiceMedia({ service }: Props) {
  // TODO: filter by media category (before/after) when field is available
  const allPhotos = service.media?.filter((m) => m.type === "photo") ?? [];
  const allVideos = service.media?.filter((m) => m.type === "video") ?? [];

  return (
    <div className="space-y-6">
      {/* Before & After media */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" /> Fotos y Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <MediaSection
            title="Estado actual (antes)"
            icon={Camera}
            photos={allPhotos}
            videos={allVideos}
            emptyText="Sin fotos ni vídeos del estado actual"
          />
          <div className="border-t border-border" />
          <MediaSection
            title="Estado reparado (después)"
            icon={CheckCircle}
            photos={[]}
            videos={[]}
            emptyText="Sin fotos ni vídeos del estado reparado"
          />
        </CardContent>
      </Card>

      {/* Documents */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" /> Documentos
          </CardTitle>
          <Button variant="outline" size="sm">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir documento
          </Button>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center">
            <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Sin documentos adjuntos</p>
            <p className="text-xs text-muted-foreground mt-1">PDF, DOC, XLS — partes de trabajo, informes, certificados</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}