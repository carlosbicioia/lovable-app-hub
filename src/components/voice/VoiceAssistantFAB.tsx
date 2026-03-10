import { Headset } from "lucide-react";
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
        "fixed bottom-6 right-6 z-30 w-16 h-16 rounded-2xl rotate-3",
        "bg-gradient-to-br from-primary via-primary to-accent text-primary-foreground",
        "shadow-lg shadow-primary/30",
        "hover:scale-110 hover:rotate-0 hover:shadow-xl hover:shadow-primary/40 active:scale-95",
        "transition-all duration-300 flex flex-col items-center justify-center gap-0.5",
        "group",
        className
      )}
      title="Asistente Alex - Crear servicio por voz"
    >
      <Headset className="w-6 h-6 group-hover:animate-bounce transition-transform" />
      <span className="text-[9px] font-bold tracking-wide opacity-90">ALEX</span>
      {/* Pulse ring */}
      <span className="absolute inset-0 rounded-2xl bg-primary/20 animate-ping" />
    </button>
  );
}
