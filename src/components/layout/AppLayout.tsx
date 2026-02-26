import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import TopBar from "./TopBar";
import VoiceAssistantFAB from "@/components/voice/VoiceAssistantFAB";
import VoiceAssistantModal from "@/components/voice/VoiceAssistantModal";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";

export default function AppLayout() {
  const voice = useVoiceAssistant();

  useEffect(() => {
    const handler = () => voice.startConversation();
    window.addEventListener("open-voice-assistant", handler);
    return () => window.removeEventListener("open-voice-assistant", handler);
  }, [voice.startConversation]);
  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
      {!voice.open && <VoiceAssistantFAB onClick={voice.startConversation} />}
      <VoiceAssistantModal
        open={voice.open}
        isListening={voice.isListening}
        isSpeaking={voice.isSpeaking}
        isProcessing={voice.isProcessing}
        transcript={voice.transcript}
        alexText={voice.alexText}
        onClose={voice.close}
      />
    </div>
  );
}
