import * as React from "react";
import { cn } from "@/lib/utils";
import { Mic, MicOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VoiceTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  /** Called when the value changes (from typing or voice) */
  onValueChange?: (value: string) => void;
}

const SpeechRecognitionAPI =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

const VoiceTextarea = React.forwardRef<HTMLTextAreaElement, VoiceTextareaProps>(
  ({ className, value, onChange, onValueChange, disabled, ...props }, ref) => {
    const [isListening, setIsListening] = React.useState(false);
    const recognitionRef = React.useRef<any>(null);
    const silenceTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const hasSpeechSupport = !!SpeechRecognitionAPI;

    const stopListening = React.useCallback(() => {
      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setIsListening(false);
    }, []);

    const startListening = React.useCallback(() => {
      if (!SpeechRecognitionAPI || disabled) return;

      const recognition = new SpeechRecognitionAPI();
      recognition.lang = "es-ES";
      recognition.continuous = true;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        // Reset silence timer on each result
        if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = setTimeout(() => stopListening(), 2000);

        const transcript = Array.from(event.results)
          .slice(event.resultIndex)
          .filter((r: any) => r.isFinal)
          .map((r: any) => r[0].transcript)
          .join(" ");

        if (transcript) {
          const currentVal = (typeof value === "string" ? value : "") || "";
          const separator = currentVal && !currentVal.endsWith(" ") && !currentVal.endsWith("\n") ? " " : "";
          const newValue = currentVal + separator + transcript;

          // Trigger synthetic onChange for compatibility
          if (onValueChange) {
            onValueChange(newValue);
          } else if (onChange) {
            const syntheticEvent = {
              target: { value: newValue },
            } as React.ChangeEvent<HTMLTextAreaElement>;
            onChange(syntheticEvent);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          stopListening();
        }
      };

      recognition.onend = () => {
        // If still supposed to be listening (continuous mode ended unexpectedly), restart
        if (recognitionRef.current === recognition && isListening) {
          try {
            recognition.start();
          } catch {
            stopListening();
          }
        }
      };

      recognitionRef.current = recognition;
      setIsListening(true);
      silenceTimerRef.current = setTimeout(() => stopListening(), 5000);

      try {
        recognition.start();
      } catch {
        stopListening();
      }
    }, [disabled, value, onChange, onValueChange, stopListening, isListening]);

    const toggleListening = React.useCallback(() => {
      if (isListening) {
        stopListening();
      } else {
        startListening();
      }
    }, [isListening, startListening, stopListening]);

    // Cleanup on unmount
    React.useEffect(() => {
      return () => {
        if (recognitionRef.current) {
          recognitionRef.current.stop();
        }
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }
      };
    }, []);

    return (
      <div className="relative">
        <textarea
          className={cn(
            "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            hasSpeechSupport && "pr-10",
            className
          )}
          ref={ref}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
        {hasSpeechSupport && !disabled && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn(
              "absolute right-1 top-1 h-7 w-7",
              isListening
                ? "text-destructive hover:text-destructive/80 animate-pulse"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={toggleListening}
            tabIndex={-1}
            title={isListening ? "Detener dictado" : "Dictar por voz"}
          >
            {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </Button>
        )}
      </div>
    );
  }
);
VoiceTextarea.displayName = "VoiceTextarea";

export { VoiceTextarea };
