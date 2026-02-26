import { useEffect, useRef } from "react";
import { X, Mic, MicOff, Loader2, Headset, AudioLines } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isProcessing: boolean;
  transcript: string;
  alexText: string;
  onClose: () => void;
}

function AudioWave({ active, color }: { active: boolean; color: string }) {
  return (
    <div className="flex items-center justify-center gap-1 h-16">
      {[...Array(5)].map((_, i) => (
        <div
          key={i}
          className={cn(
            "w-1.5 rounded-full transition-all duration-300",
            color
          )}
          style={{
            height: active ? `${20 + Math.sin((i + Date.now() / 200) * 0.8) * 20}px` : "6px",
            animation: active ? `wave ${0.6 + i * 0.1}s ease-in-out infinite alternate` : "none",
          }}
        />
      ))}
    </div>
  );
}

export default function VoiceAssistantModal({
  open,
  isListening,
  isSpeaking,
  isProcessing,
  transcript,
  alexText,
  onClose,
}: Props) {
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (textRef.current) {
      textRef.current.scrollTop = textRef.current.scrollHeight;
    }
  }, [alexText, transcript]);

  if (!open) return null;

  const getStatusText = () => {
    if (isProcessing) return "Pensando...";
    if (isSpeaking) return "Alex está hablando";
    if (isListening) return "Escuchando...";
    return "En espera";
  };

  const getStatusColor = () => {
    if (isProcessing) return "text-warning";
    if (isSpeaking) return "text-primary";
    if (isListening) return "text-success";
    return "text-muted-foreground";
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm animate-in fade-in-0"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-2xl animate-in zoom-in-95 fade-in-0 duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted transition-colors z-10"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>

          <div className="p-6 flex flex-col items-center gap-4">
            {/* Avatar */}
            <div className={cn(
              "w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold transition-all duration-500",
              isSpeaking
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105"
                : isListening
                ? "bg-success/20 text-success ring-2 ring-success/40 scale-105"
                : "bg-muted text-muted-foreground"
            )}>
              {isProcessing ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : isSpeaking ? (
                <AudioLines className="w-8 h-8 animate-pulse" />
              ) : isListening ? (
                <Mic className="w-8 h-8 animate-pulse" />
              ) : (
                <Headset className="w-8 h-8" />
              )}
            </div>

            {/* Name & status */}
            <div className="text-center">
              <h3 className="font-display font-bold text-lg text-foreground">Alex</h3>
              <p className={cn("text-xs font-medium", getStatusColor())}>
                {getStatusText()}
              </p>
            </div>

            {/* Audio wave */}
            <div className="w-full flex justify-center">
              <style>{`
                @keyframes wave {
                  0% { transform: scaleY(0.4); }
                  100% { transform: scaleY(1); }
                }
              `}</style>
              <div className="flex items-center justify-center gap-1.5 h-12">
                {[...Array(7)].map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "w-1 rounded-full transition-colors duration-300",
                      isSpeaking
                        ? "bg-primary"
                        : isListening
                        ? "bg-success"
                        : "bg-muted-foreground/30"
                    )}
                    style={{
                      height: isSpeaking || isListening ? undefined : "4px",
                      animation:
                        isSpeaking || isListening
                          ? `wave ${0.4 + i * 0.08}s ease-in-out infinite alternate`
                          : "none",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Alex text bubble */}
            {alexText && (
              <div
                ref={textRef}
                className="w-full max-h-32 overflow-y-auto bg-muted/50 rounded-xl p-3 text-sm text-foreground leading-relaxed"
              >
                {alexText}
              </div>
            )}

            {/* User transcript */}
            {(transcript || isListening) && (
              <div className="w-full bg-success/10 rounded-xl p-3 text-sm text-foreground border border-success/20">
                <span className="text-[10px] uppercase tracking-wider text-success font-semibold block mb-1">
                  Tú
                </span>
                {transcript || (
                  <span className="text-muted-foreground italic">Habla ahora...</span>
                )}
              </div>
            )}

            {/* Mic indicator */}
            <div className="flex items-center gap-2">
              {isListening ? (
                <div className="flex items-center gap-2 text-success">
                  <Mic className="w-4 h-4" />
                  <span className="text-xs font-medium">Micrófono activo</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MicOff className="w-4 h-4" />
                  <span className="text-xs">Micrófono inactivo</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
