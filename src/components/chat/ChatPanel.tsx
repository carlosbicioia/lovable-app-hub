import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X, Send, Search, MessageSquare, Wrench, Handshake,
  ChevronLeft, Paperclip, Check, CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useChat, type Conversation } from "@/hooks/useChat";

export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { conversations, loading, totalUnread, sendMessage, markAsRead } = useChat();
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "operator" | "collaborator">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeChat);

  const filteredConversations = conversations
    .filter((c) => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || c.type === filter;
      return matchSearch && matchFilter;
    })
    .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

  useEffect(() => {
    if (activeChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeChat, conversations]);

  const handleSend = async () => {
    if (!newMessage.trim() || !activeChat) return;
    const text = newMessage.trim();
    setNewMessage("");
    await sendMessage(activeChat, text);
  };

  const handleOpenChat = (id: string) => {
    setActiveChat(id);
    markAsRead(id);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[420px] z-50 bg-card border-l border-border shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-border shrink-0">
        {activeChat ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveChat(null)}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            {activeConversation && (
              <div className="flex items-center gap-2">
                <ChatAvatar conversation={activeConversation} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-foreground leading-none">{activeConversation.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {activeConversation.online ? "En línea" : "Desconectado"}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-primary" />
            <h2 className="font-display font-bold text-foreground">Comunicaciones</h2>
            {totalUnread > 0 && <Badge className="text-[10px] h-5 px-1.5">{totalUnread}</Badge>}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {activeChat && activeConversation ? (
        <>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {activeConversation.messages.map((msg, i) => {
                const showDate =
                  i === 0 ||
                  format(new Date(msg.created_at), "yyyy-MM-dd") !==
                    format(new Date(activeConversation.messages[i - 1].created_at), "yyyy-MM-dd");
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(msg.created_at), "d MMM yyyy", { locale: es })}
                        </span>
                      </div>
                    )}
                    <div className={cn("flex", msg.sender === "me" ? "justify-end" : "justify-start")}>
                      <div
                        className={cn(
                          "max-w-[80%] rounded-2xl px-3 py-2 text-sm",
                          msg.sender === "me"
                            ? "bg-primary text-primary-foreground rounded-br-md"
                            : "bg-muted text-foreground rounded-bl-md"
                        )}
                      >
                        <p>{msg.text}</p>
                        <div className={cn("flex items-center gap-1 mt-0.5", msg.sender === "me" ? "justify-end" : "justify-start")}>
                          <span className={cn("text-[10px]", msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground")}>
                            {format(new Date(msg.created_at), "HH:mm")}
                          </span>
                          {msg.sender === "me" && (
                            msg.read ? <CheckCheck className="w-3 h-3 text-primary-foreground/70" /> : <Check className="w-3 h-3 text-primary-foreground/70" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="p-3 border-t border-border shrink-0">
            <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Escribe un mensaje..." className="flex-1" />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        <>
          <div className="p-3 space-y-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar conversación..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <div className="flex gap-1">
              {([
                { key: "all", label: "Todos", icon: MessageSquare },
                { key: "operator", label: "Operarios", icon: Wrench },
                { key: "collaborator", label: "Colaboradores", icon: Handshake },
              ] as const).map((f) => (
                <Button key={f.key} variant={filter === f.key ? "default" : "outline"} size="sm" onClick={() => setFilter(f.key)} className="text-xs gap-1 flex-1">
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Cargando...</div>
            ) : (
              <div className="divide-y divide-border">
                {filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleOpenChat(conv.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                  >
                    <ChatAvatar conversation={conv} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground truncate">{conv.name}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">
                          {conv.lastMessageTime ? format(new Date(conv.lastMessageTime), "HH:mm") : ""}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                        {conv.unread > 0 && (
                          <Badge className="text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full shrink-0">{conv.unread}</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className={cn(
                          "text-[10px] px-1.5 py-0 rounded-full border",
                          conv.type === "operator"
                            ? "bg-info/10 text-info border-info/20"
                            : "bg-accent text-accent-foreground border-accent-foreground/20"
                        )}>
                          {conv.type === "operator" ? "Operario" : "Colaborador"}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
                {filteredConversations.length === 0 && (
                  <div className="p-8 text-center text-sm text-muted-foreground">No hay conversaciones</div>
                )}
              </div>
            )}
          </ScrollArea>
        </>
      )}
    </div>
  );
}

function ChatAvatar({ conversation, size = "md" }: { conversation: Conversation; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "w-8 h-8" : "w-10 h-10";
  const dotDim = size === "sm" ? "w-2.5 h-2.5" : "w-3 h-3";

  return (
    <div className="relative shrink-0">
      {conversation.photo ? (
        <img src={conversation.photo} alt={conversation.name} className={cn(dim, "rounded-full object-cover")} />
      ) : (
        <div className={cn(dim, "rounded-full bg-primary/15 flex items-center justify-center")}>
          <Handshake className="w-4 h-4 text-primary" />
        </div>
      )}
      {conversation.online && (
        <div className={cn("absolute -bottom-0.5 -right-0.5 rounded-full bg-success border-2 border-card", dotDim)} />
      )}
      {conversation.color && (
        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card" style={{ backgroundColor: `hsl(${conversation.color})` }} />
      )}
    </div>
  );
}
