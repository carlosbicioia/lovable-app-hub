import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Image, Video } from "lucide-react";
import type { Service } from "@/types/urbango";

interface Props {
  service: Service;
}

export default function ServiceMedia({ service }: Props) {
  const photos = service.media?.filter((m) => m.type === "photo") ?? [];
  const videos = service.media?.filter((m) => m.type === "video") ?? [];

  if (photos.length === 0 && videos.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Image className="w-4 h-4 text-muted-foreground" /> Fotos y Vídeos
          <span className="text-xs text-muted-foreground font-normal ml-auto">
            {photos.length} fotos · {videos.length} vídeos
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  );
}
