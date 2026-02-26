import { Mic } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onClick: () => void;
  className?: string;
}

export default function VoiceAssistantFAB({ onClick, className }: Props) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full",
        "bg-primary text-primary-foreground shadow-lg shadow-primary/30",
        "hover:scale-110 hover:shadow-xl hover:shadow-primary/40 active:scale-95",
        "transition-all duration-200 flex items-center justify-center",
        "group",
        className
      )}
      title="Asistente Alex - Crear servicio por voz"
    >
      <Mic className="w-6 h-6 group-hover:scale-110 transition-transform" />
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
    </button>
  );
}
