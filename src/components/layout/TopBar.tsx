import { useState } from "react";
import { Bell, Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import ChatPanel from "@/components/chat/ChatPanel";

export default function TopBar() {
  const [chatOpen, setChatOpen] = useState(false);

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
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
              4
            </span>
          </button>
          <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-semibold">AG</span>
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium leading-none">Admin Gestor</p>
              <p className="text-xs text-muted-foreground">gestor@urbango.es</p>
            </div>
          </div>
        </div>
      </header>
      <ChatPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
