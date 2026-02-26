import { useState } from "react";
import { Search, MessageSquare, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import ChatPanel from "@/components/chat/ChatPanel";
import NotificationsPopover from "@/components/layout/NotificationsPopover";
import { useChat } from "@/hooks/useChat";
import { useAuth } from "@/hooks/useAuth";

export default function TopBar() {
  const [chatOpen, setChatOpen] = useState(false);
  const { totalUnread } = useChat();
  const { user, signOut } = useAuth();

  const displayName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Usuario";
  const initials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <>
      <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
        <div className="relative w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar clientes, servicios..."
            className="pl-9 bg-muted/50 border-none focus-visible:ring-1 focus-visible:ring-primary"
          />
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setChatOpen(true)}
            className="relative p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <MessageSquare className="w-5 h-5 text-muted-foreground" />
            {totalUnread > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                {totalUnread}
              </span>
            )}
          </button>
          <NotificationsPopover />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-semibold">{initials}</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">{displayName}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-destructive"
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
