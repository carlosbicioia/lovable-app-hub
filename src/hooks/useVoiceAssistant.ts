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
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { refetch } = useServices();
  const navigate = useNavigate();

  // Find a Spanish male voice
  const getSpanishVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    // Prefer Spanish (Spain) male voice
    const esEsMale = voices.find(
      (v) => v.lang.startsWith("es-ES") && v.name.toLowerCase().includes("male")
    );
    if (esEsMale) return esEsMale;
    // Fallback: any es-ES voice
    const esEs = voices.find((v) => v.lang.startsWith("es-ES"));
    if (esEs) return esEs;
    // Fallback: any Spanish voice
    const es = voices.find((v) => v.lang.startsWith("es"));
    return es || null;
  }, []);

  // Speak text
  const speak = useCallback(
    (text: string) => {
      return new Promise<void>((resolve) => {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        const voice = getSpanishVoice();
        if (voice) utterance.voice = voice;
        utterance.lang = "es-ES";
        utterance.rate = 1.05;
        utterance.pitch = 0.95;
        synthRef.current = utterance;
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

  // Parse service data from AI response
  const parseServiceData = useCallback((text: string): ServiceData | null => {
    const match = text.match(/###SERVICE_DATA###\s*([\s\S]*?)\s*###END_SERVICE_DATA###/);
    if (!match) return null;
    try {
      return JSON.parse(match[1]);
    } catch {
      return null;
    }
  }, []);

  // Strip service data block from display text
  const cleanDisplayText = useCallback((text: string): string => {
    return text.replace(/###SERVICE_DATA###[\s\S]*?###END_SERVICE_DATA###/, "").trim();
  }, []);

  // Send message to AI
  const sendToAI = useCallback(
    async (userText: string) => {
      const userMsg: Message = { role: "user", content: userText };
      const newMessages = [...messages, userMsg];
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
          // Start listening again
          startListening();
        }
      } catch (err: any) {
        console.error("AI error:", err);
        setIsProcessing(false);
        const errorMsg = "Perdona, he tenido un problema. ¿Puedes repetirlo?";
        setAlexText(errorMsg);
        await speak(errorMsg);
        startListening();
      }
    },
    [messages, speak, createService, parseServiceData, cleanDisplayText, navigate]
  );

  // Speech recognition
  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({
        title: "No soportado",
        description: "Tu navegador no soporta reconocimiento de voz",
        variant: "destructive",
      });
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);

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
        sendToAI(finalText);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== "no-speech" && event.error !== "aborted") {
        toast({
          title: "Error de micrófono",
          description: "No se pudo acceder al micrófono",
          variant: "destructive",
        });
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [sendToAI]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  // Start conversation when modal opens
  const startConversation = useCallback(async () => {
    setMessages([]);
    setAlexText("");
    setTranscript("");
    setOpen(true);

    // Load voices (needed for some browsers)
    window.speechSynthesis.getVoices();

    // Send initial empty message to get greeting
    setIsProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("voice-assistant", {
        body: { messages: [] },
      });
      if (error) throw error;
      const content = data?.content || "¡Hola! Soy Alex. ¿En qué puedo ayudarte?";
      const displayText = cleanDisplayText(content);
      setMessages([{ role: "assistant", content: displayText }]);
      setAlexText(displayText);
      setIsProcessing(false);
      await speak(displayText);
      startListening();
    } catch (err) {
      console.error("Error starting conversation:", err);
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
