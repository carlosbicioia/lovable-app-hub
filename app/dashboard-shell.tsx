"use client";

import { usePathname } from "next/navigation";
import AppSidebar from "@/components/layout/AppSidebar";
import TopBar from "@/components/layout/TopBar";
import VoiceAssistantFAB from "@/components/voice/VoiceAssistantFAB";
import VoiceAssistantModal from "@/components/voice/VoiceAssistantModal";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";
import { useEffect } from "react";

// Auth routes: full-screen centered, no sidebar
const AUTH_PREFIXES = ["/login", "/reset-password"];

// Other routes that skip sidebar entirely (TV, collaborator portal)
const NO_SHELL_PREFIXES = ["/colaborador", "/tv"];

function getRouteType(pathname: string): "auth" | "bare" | "dashboard" {
  if (AUTH_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "auth";
  if (NO_SHELL_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"))) return "bare";
  return "dashboard";
}

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const voice = useVoiceAssistant();
  const routeType = getRouteType(pathname);

  useEffect(() => {
    const handler = () => voice.startConversation();
    window.addEventListener("open-voice-assistant", handler);
    return () => window.removeEventListener("open-voice-assistant", handler);
  }, [voice.startConversation]);

  // Auth pages: centered full-screen, no sidebar, no topbar
  if (routeType === "auth") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        {children}
      </div>
    );
  }

  // TV / collaborator: bare, no chrome
  if (routeType === "bare") {
    return <>{children}</>;
  }

  // Dashboard pages: sidebar + topbar
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
