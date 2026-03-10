import { useState, useCallback, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useServices } from "@/hooks/useServices";
import { toast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface ServiceData {
  client_name: string;
  address: string;
  description: string;
  specialty: string;
  urgency: string;
  service_type: string;
  service_category: string;
  origin: string;
}

export function useVoiceAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [alexText, setAlexText] = useState("");

  const recognitionRef = useRef<any>(null);
  const messagesRef = useRef<Message[]>([]);
  const shouldListenRef = useRef(false);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const accumulatedTextRef = useRef("");
  const handleUserInputRef = useRef<(text: string) => void>(() => {});
  const { refetch } = useServices();
  const navigate = useNavigate();

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const getSpanishVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const esEsMale = voices.find(
      (v) => v.lang.startsWith("es-ES") && v.name.toLowerCase().includes("male")
    );
    if (esEsMale) return esEsMale;
    const esEs = voices.find((v) => v.lang.startsWith("es-ES"));
    if (esEs) return esEs;
    const es = voices.find((v) => v.lang.startsWith("es"));
    return es || null;
  }, []);

  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        window.speechSynthesis.cancel();
        const chunks = text.match(/[^.!?]+[.!?]*/g) || [text];
        if (chunks.length === 0) { resolve(); return; }
        setIsSpeaking(true);

        const speakChunk = (i: number) => {
          if (i >= chunks.length) {
            setIsSpeaking(false);
            resolve();
            return;
          }
          const utterance = new SpeechSynthesisUtterance(chunks[i].trim());
          const voice = getSpanishVoice();
          if (voice) utterance.voice = voice;
          utterance.lang = "es-ES";
          utterance.rate = 1.0;
          utterance.pitch = 0.95;
          utterance.onend = () => speakChunk(i + 1);
          utterance.onerror = () => {
            setIsSpeaking(false);
            resolve();
          };
          window.speechSynthesis.speak(utterance);
        };
        speakChunk(0);
      });
    },
    [getSpanishVoice]
  );

  const generateServiceId = useCallback(async () => {
    const { data: settings } = await supabase
      .from("company_settings")
      .select("service_prefix")
      .limit(1)
      .maybeSingle();
    const prefix = settings?.service_prefix ?? "SRV-";
    const { data: lastServices } = await supabase
      .from("services")
      .select("id")
      .ilike("id", `${prefix}%`)
      .order("id", { ascending: false })
      .limit(1);
    let nextNum = 1;
    if (lastServices && lastServices.length > 0) {
      const numPart = parseInt(lastServices[0].id.replace(prefix, ""), 10);
      if (!isNaN(numPart)) nextNum = numPart + 1;
    }
    return `${prefix}${String(nextNum).padStart(3, "0")}`;
  }, []);

  const createService = useCallback(
    async (data: ServiceData) => {
      try {
        const serviceId = await generateServiceId();
        const { error } = await supabase.from("services").insert({
          id: serviceId,
          client_id: "",
          client_name: data.client_name,
          address: data.address,
          description: data.description,
          specialty: data.specialty || "Fontanería/Agua",
          urgency: data.urgency || "Estándar",
          service_type: data.service_type || "Reparación_Directa",
          service_category: data.service_category || "Correctivo",
          origin: data.origin || "Directo",
          status: "Pendiente_Contacto",
          cluster_id: "",
          claim_status: "Abierto",
        });
        if (error) throw error;
        await refetch();
        toast({
          title: "¡Servicio creado!",
          description: `El servicio ${serviceId} ha sido registrado por Alex.`,
        });
        return serviceId;
      } catch (err: any) {
        console.error("Error creating service via voice:", err);
        toast({
          title: "Error",
          description: "No se pudo crear el servicio: " + err.message,
          variant: "destructive",
        });
        return null;
      }
    },
    [generateServiceId, refetch]
  );

  const parseServiceData = useCallback((text: string): ServiceData | null => {
    const match = text.match(/###SERVICE_DATA###\s*([\s\S]*?)\s*###END_SERVICE_DATA###/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }, []);

  const cleanDisplayText = useCallback((text: string): string => {
    return text.replace(/###SERVICE_DATA###[\s\S]*?###END_SERVICE_DATA###/, "").trim();
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    accumulatedTextRef.current = "";
    try { recognitionRef.current?.stop(); } catch {}
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta reconocimiento de voz. Usa Chrome o Edge.",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    accumulatedTextRef.current = "";

    recognition.onstart = () => {
      setIsListening(true);
      console.log("[Alex] Micrófono activo");
    };

    recognition.onend = () => {
      console.log("[Alex] Recognition ended, shouldListen:", shouldListenRef.current);
      setIsListening(false);
      // Auto-restart if we should still be listening
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            console.log("[Alex] Reiniciando reconocimiento...");
            try {
              recognition.start();
            } catch (e) {
              console.log("[Alex] No se pudo reiniciar:", e);
            }
          }
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        } else {
          interimText += result[0].transcript;
        }
      }

      // Show what the user is saying (interim or final)
      const displayTranscript = finalText || interimText;
      if (displayTranscript) {
        setTranscript(displayTranscript);
      }

      // When we get final text, accumulate and set a silence timer
      if (finalText) {
        accumulatedTextRef.current = finalText;
        console.log("[Alex] Texto acumulado:", accumulatedTextRef.current);

        // Clear existing silence timer
        if (silenceTimerRef.current) {
          clearTimeout(silenceTimerRef.current);
        }

        // Wait 1.5s of silence before sending
        silenceTimerRef.current = setTimeout(() => {
          const textToSend = accumulatedTextRef.current.trim();
          if (textToSend) {
            console.log("[Alex] Enviando texto:", textToSend);
            shouldListenRef.current = false;
            accumulatedTextRef.current = "";
            try { recognition.stop(); } catch {}
            recognitionRef.current = null;
            handleUserInputRef.current(textToSend);
          }
        }, 1500);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("[Alex] Speech error:", event.error);
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        shouldListenRef.current = false;
        setIsListening(false);
        toast({
          title: "Permiso de micrófono denegado",
          description: "Por favor, permite el acceso al micrófono en la configuración del navegador y recarga la página.",
          variant: "destructive",
        });
      }
      // For 'no-speech', 'aborted', 'network' etc., onend will fire and auto-restart
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    try {
      recognition.start();
    } catch (e) {
      console.error("[Alex] Failed to start recognition:", e);
    }
  }, []);

  // handleUserInput uses refs to avoid stale closures
  const handleUserInput = useCallback(
    async (userText: string) => {
      const userMsg: Message = { role: "user", content: userText };
      const newMessages = [...messagesRef.current, userMsg];
      setMessages(newMessages);
      setTranscript("");
      setIsProcessing(true);

      try {
        const { data, error } = await supabase.functions.invoke("voice-assistant", {
          body: { messages: newMessages },
        });

        if (error) throw error;

        const aiContent = data?.content || "Lo siento, no he podido procesar tu mensaje.";
        const displayText = cleanDisplayText(aiContent);
        const serviceData = parseServiceData(aiContent);

        const assistantMsg: Message = { role: "assistant", content: displayText };
        setMessages((prev) => [...prev, assistantMsg]);
        setAlexText(displayText);
        setIsProcessing(false);

        await speak(displayText);

        if (serviceData) {
          const serviceId = await createService(serviceData);
          if (serviceId) {
            setTimeout(() => {
              setOpen(false);
              navigate(`/servicios/${serviceId}`);
            }, 2000);
          }
        } else {
          startListening();
        }
      } catch (err: any) {
        console.error("[Alex] AI error:", err);
        setIsProcessing(false);
        const errorMsg = "Perdona, he tenido un problema. ¿Puedes repetirlo?";
        setAlexText(errorMsg);
        await speak(errorMsg);
        startListening();
      }
    },
    [speak, createService, parseServiceData, cleanDisplayText, navigate, startListening]
  );

  // Keep the ref in sync so startListening's closure always calls the latest version
  useEffect(() => {
    handleUserInputRef.current = handleUserInput;
  }, [handleUserInput]);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const startConversation = useCallback(async () => {
    setMessages([]);
    setAlexText("");
    setTranscript("");
    setOpen(true);

    // Warm-up TTS
    const warmUp = new SpeechSynthesisUtterance("");
    warmUp.volume = 0;
    warmUp.lang = "es-ES";
    const voice = getSpanishVoice();
    if (voice) warmUp.voice = voice;
    window.speechSynthesis.speak(warmUp);

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { messages: [] },
      });
      if (error) throw error;
      const content = data?.content || "Hola, soy Álex, el asistente de UrbanGO. Dime en qué trabajamos.";
      const displayText = cleanDisplayText(content);
      setMessages([{ role: "assistant", content: displayText }]);
      setAlexText(displayText);
      setIsProcessing(false);
      await speak(displayText);
      startListening();
    } catch (err) {
      console.error("[Alex] Error starting conversation:", err);
      setIsProcessing(false);
      const fallback = "Hola, soy Álex, el asistente de UrbanGO. Dime en qué trabajamos.";
      setAlexText(fallback);
      setMessages([{ role: "assistant", content: fallback }]);
      await speak(fallback);
      startListening();
    }
  }, [speak, startListening, cleanDisplayText, getSpanishVoice]);

  const close = useCallback(() => {
    stopListening();
    stopSpeaking();
    setOpen(false);
    setMessages([]);
    setAlexText("");
    setTranscript("");
  }, [stopListening, stopSpeaking]);

  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      try { recognitionRef.current?.stop(); } catch {}
      window.speechSynthesis.cancel();
    };
  }, []);

  return {
    open,
    isListening,
    isSpeaking,
    isProcessing,
    transcript,
    alexText,
    messages,
    startConversation,
    close,
    startListening,
    stopListening,
    stopSpeaking,
  };
}
