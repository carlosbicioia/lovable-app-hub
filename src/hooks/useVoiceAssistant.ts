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
  const isListeningRef = useRef(false);
  const messagesRef = useRef<Message[]>([]);
  const shouldListenRef = useRef(false);
  const { refetch } = useServices();
  const navigate = useNavigate();

  // Keep messagesRef in sync
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Find a Spanish male voice
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

  // Preload voices
  useEffect(() => {
    window.speechSynthesis.getVoices();
    const handler = () => window.speechSynthesis.getVoices();
    window.speechSynthesis.addEventListener("voiceschanged", handler);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", handler);
  }, []);

  // Speak text
  const speak = useCallback(
    (text: string): Promise<void> => {
      return new Promise((resolve) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getSpanishVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = "es-ES";
        utterance.rate = 1.0;
        utterance.pitch = 0.95;
        setIsSpeaking(true);
        utterance.onend = () => {
          setIsSpeaking(false);
          resolve();
        };
        utterance.onerror = () => {
          setIsSpeaking(false);
          resolve();
        };
        window.speechSynthesis.speak(utterance);
      });
    },
    [getSpanishVoice]
  );

  // Generate service ID
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

  // Create service in DB
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

  // Stop recognition
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    shouldListenRef.current = false;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    setIsListening(false);
  }, []);

  // Start recognition - uses refs to avoid stale closures
  const startListening = useCallback(() => {
    // Stop any existing recognition first
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

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      console.log("[Alex] Micrófono activo");
    };

    recognition.onend = () => {
      console.log("[Alex] Recognition ended, shouldListen:", shouldListenRef.current);
      setIsListening(false);
      isListeningRef.current = false;
      // Auto-restart if we should still be listening
      if (shouldListenRef.current) {
        setTimeout(() => {
          if (shouldListenRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.log("[Alex] Could not restart recognition:", e);
            }
          }
        }, 300);
      }
    };

    recognition.onresult = (event: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        } else {
          interimText += event.results[i][0].transcript;
        }
      }
      setTranscript(finalText || interimText);
      if (finalText) {
        console.log("[Alex] Final transcript:", finalText);
        // Stop listening while processing
        shouldListenRef.current = false;
        recognition.stop();
        recognitionRef.current = null;
        handleUserInput(finalText);
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
      // For "no-speech" or "aborted", onend will auto-restart if shouldListenRef is true
    };

    recognitionRef.current = recognition;
    shouldListenRef.current = true;

    // Request mic permission explicitly first
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then(() => {
        try {
          recognition.start();
        } catch (e) {
          console.error("[Alex] Failed to start recognition:", e);
        }
      })
      .catch((err) => {
        console.error("[Alex] Mic permission denied:", err);
        shouldListenRef.current = false;
        toast({
          title: "Permiso de micrófono necesario",
          description: "Haz clic en el icono del candado en la barra de direcciones y permite el micrófono.",
          variant: "destructive",
        });
      });
  }, []);

  // Handle user input - uses refs for messages
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

        // Speak the response
        await speak(displayText);

        // If service data found, create it
        if (serviceData) {
          const serviceId = await createService(serviceData);
          if (serviceId) {
            setTimeout(() => {
              setOpen(false);
              navigate(`/servicios/${serviceId}`);
            }, 2000);
          }
        } else {
          // Resume listening
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

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Start conversation
  const startConversation = useCallback(async () => {
    setMessages([]);
    setAlexText("");
    setTranscript("");
    setOpen(true);

    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { messages: [] },
      });
      if (error) throw error;
      const content = data?.content || "¡Hola! Soy Alex. ¿Para qué cliente necesitas crear el servicio?";
      const displayText = cleanDisplayText(content);
      setMessages([{ role: "assistant", content: displayText }]);
      setAlexText(displayText);
      setIsProcessing(false);
      await speak(displayText);
      startListening();
    } catch (err) {
      console.error("[Alex] Error starting conversation:", err);
      setIsProcessing(false);
      const fallback = "¡Hola! Soy Alex, tu asistente de UrbanGO. ¿Para qué cliente necesitas crear el servicio?";
      setAlexText(fallback);
      setMessages([{ role: "assistant", content: fallback }]);
      await speak(fallback);
      startListening();
    }
  }, [speak, startListening, cleanDisplayText]);

  const close = useCallback(() => {
    stopListening();
    stopSpeaking();
    setOpen(false);
    setMessages([]);
    setAlexText("");
    setTranscript("");
  }, [stopListening, stopSpeaking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      isListeningRef.current = false;
      recognitionRef.current?.stop();
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
