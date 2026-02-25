import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Video, FileText, Upload } from "lucide-react";
import type { Service } from "@/types/urbango";
import { Button } from "@/components/ui/button";

interface Props {
  service: Service;
}

export default function ServiceMedia({ service }: Props) {
  const photos = service.media?.filter((m) => m.type === "photo") ?? [];
  const videos = service.media?.filter((m) => m.type === "video") ?? [];

  return (
    <div className="space-y-6">
      {/* Photos & Videos */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Image className="w-4 h-4 text-muted-foreground" /> Fotos y Vídeos
            <span className="text-xs text-muted-foreground font-normal ml-2">
              {photos.length} fotos · {videos.length} vídeos
            </span>
          </CardTitle>
          <Button variant="outline" size="sm">
            <Upload className="w-3.5 h-3.5 mr-1.5" /> Subir multimedia
          </Button>
        </CardHeader>
        <CardContent>
          {photos.length === 0 && videos.length === 0 ? (
            <div className="py-8 text-center">
              <Image className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin fotos ni vídeos</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {photos.map((m) => (
                <div key={m.id} className="relative group rounded-lg overflow-hidden border border-border bg-muted aspect-video">
                  <img
                    src={m.url}
                    alt={m.caption || "Foto del servicio"}
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
