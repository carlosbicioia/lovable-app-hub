"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import TopBar from "@/components/layout/TopBar";
import VoiceAssistantFAB from "@/components/voice/VoiceAssistantFAB";
import VoiceAssistantModal from "@/components/voice/VoiceAssistantModal";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useEffect } from "react";

// Routes that should NOT use the dashboard shell (no sidebar/topbar)
const NO_SHELL_PREFIXES = ["/login", "/reset-password", "/colaborador", "/tv"];

function isDashboardRoute(pathname: string) {
  return !NO_SHELL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const voice = useVoiceAssistant();

  useEffect(() => {
    const handler = () => voice.startConversation();
    window.addEventListener("open-voice-assistant", handler);
    return () => window.removeEventListener("open-voice-assistant", handler);
  }, [voice.startConversation]);

  if (!isDashboardRoute(pathname)) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar />
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
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
