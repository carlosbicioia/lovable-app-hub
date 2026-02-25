import { useState, useRef, useEffect } from "react";
import { mockOperators, mockCollaborators } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  X,
  Send,
  Search,
  MessageSquare,
  Wrench,
  Handshake,
  ChevronLeft,
  Paperclip,
  Check,
  CheckCheck,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// ─── Types ─────────────────────────────────────────────────
interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  timestamp: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  type: "operator" | "collaborator";
  photo: string | null;
  color: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: ChatMessage[];
  online: boolean;
}

// ─── Mock conversations ────────────────────────────────────
const mockConversations: Conversation[] = [
  {
    id: "chat-op-01", name: "Juan Morales", type: "operator",
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    color: "210 80% 52%", lastMessage: "Ya estoy en camino al SRV-001", lastMessageTime: "2026-02-25T09:30:00",
    unread: 2, online: true,
    messages: [
      { id: "m1", text: "Buenos días Juan, ¿puedes confirmar la visita al SRV-001 de hoy?", sender: "me", timestamp: "2026-02-25T08:00:00", read: true },
      { id: "m2", text: "Buenos días! Sí, confirmo. Tengo el material preparado.", sender: "them", timestamp: "2026-02-25T08:15:00", read: true },
      { id: "m3", text: "Perfecto. El cliente espera entre las 10 y las 11.", sender: "me", timestamp: "2026-02-25T08:20:00", read: true },
      { id: "m4", text: "Entendido, estaré allí a las 10:00", sender: "them", timestamp: "2026-02-25T08:25:00", read: true },
      { id: "m5", text: "Ya estoy en camino al SRV-001", sender: "them", timestamp: "2026-02-25T09:30:00", read: false },
      { id: "m6", text: "He llegado al domicilio, empiezo el diagnóstico", sender: "them", timestamp: "2026-02-25T10:05:00", read: false },
    ],
  },
  {
    id: "chat-op-02", name: "Pablo Serrano", type: "operator",
    photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop&crop=face",
    color: "152 60% 42%", lastMessage: "Necesito una llave de paso de 3/4", lastMessageTime: "2026-02-25T08:45:00",
    unread: 1, online: true,
    messages: [
      { id: "m7", text: "Pablo, tienes dos servicios agendados hoy: SRV-004 y SRV-007", sender: "me", timestamp: "2026-02-25T07:30:00", read: true },
      { id: "m8", text: "Sí, empiezo con el SRV-004 que es urgente", sender: "them", timestamp: "2026-02-25T07:45:00", read: true },
      { id: "m9", text: "Necesito una llave de paso de 3/4", sender: "them", timestamp: "2026-02-25T08:45:00", read: false },
    ],
  },
  {
    id: "chat-op-03", name: "Miguel Ángel Rivas", type: "operator",
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop&crop=face",
    color: "25 95% 53%", lastMessage: "SRV-003 finalizado, subo las fotos ahora", lastMessageTime: "2026-02-22T13:00:00",
    unread: 0, online: false,
    messages: [
      { id: "m10", text: "Miguel Ángel, ¿cómo va el cuadro eléctrico de SRV-003?", sender: "me", timestamp: "2026-02-22T11:00:00", read: true },
      { id: "m11", text: "Todo bien, casi terminado. Falta la prueba de diferenciales.", sender: "them", timestamp: "2026-02-22T11:30:00", read: true },
      { id: "m12", text: "SRV-003 finalizado, subo las fotos ahora", sender: "them", timestamp: "2026-02-22T13:00:00", read: true },
    ],
  },
  {
    id: "chat-col-01", name: "Fincas Reunidas SL", type: "collaborator",
    photo: null, color: null, lastMessage: "¿Cuándo se puede agendar la visita del SRV-007?", lastMessageTime: "2026-02-24T16:00:00",
    unread: 1, online: true,
    messages: [
      { id: "m13", text: "Buenas tardes, tenemos un nuevo servicio para la Sra. Jiménez (SRV-007)", sender: "them", timestamp: "2026-02-22T16:30:00", read: true },
      { id: "m14", text: "Recibido. Contactaremos con la clienta para agendar.", sender: "me", timestamp: "2026-02-22T17:00:00", read: true },
      { id: "m15", text: "¿Cuándo se puede agendar la visita del SRV-007?", sender: "them", timestamp: "2026-02-24T16:00:00", read: false },
    ],
  },
  {
    id: "chat-col-02", name: "InmoGest BCN", type: "collaborator",
    photo: null, color: null, lastMessage: "Perfecto, gracias por la confirmación", lastMessageTime: "2026-02-23T10:00:00",
    unread: 0, online: false,
    messages: [
      { id: "m16", text: "SRV-005 ha sido liquidado correctamente.", sender: "me", timestamp: "2026-02-23T09:30:00", read: true },
      { id: "m17", text: "Perfecto, gracias por la confirmación", sender: "them", timestamp: "2026-02-23T10:00:00", read: true },
    ],
  },
  {
    id: "chat-col-03", name: "Correduría Andaluza", type: "collaborator",
    photo: null, color: null, lastMessage: "El cliente está muy contento con el trabajo", lastMessageTime: "2026-02-22T15:00:00",
    unread: 0, online: false,
    messages: [
      { id: "m18", text: "El SRV-003 se ha completado con NPS 9.", sender: "me", timestamp: "2026-02-22T14:30:00", read: true },
      { id: "m19", text: "El cliente está muy contento con el trabajo", sender: "them", timestamp: "2026-02-22T15:00:00", read: true },
    ],
  },
];

// ─── Chat Panel Component ──────────────────────────────────
export default function ChatPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [conversations, setConversations] = useState(mockConversations);
  const [activeChat, setActiveChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "operator" | "collaborator">("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeChat);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

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

  const handleSend = () => {
    if (!newMessage.trim() || !activeChat) return;
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      text: newMessage.trim(),
      sender: "me",
      timestamp: new Date().toISOString(),
      read: true,
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeChat
          ? { ...c, messages: [...c.messages, msg], lastMessage: msg.text, lastMessageTime: msg.timestamp }
          : c
      )
    );
    setNewMessage("");
  };

  const handleOpenChat = (id: string) => {
    setActiveChat(id);
    // Mark as read
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );
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
            {totalUnread > 0 && (
              <Badge className="text-[10px] h-5 px-1.5">{totalUnread}</Badge>
            )}
          </div>
        )}
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      {activeChat && activeConversation ? (
        /* ─── Chat View ─── */
        <>
          <ScrollArea className="flex-1 p-3">
            <div className="space-y-3">
              {activeConversation.messages.map((msg, i) => {
                const showDate =
                  i === 0 ||
                  format(new Date(msg.timestamp), "yyyy-MM-dd") !==
                    format(new Date(activeConversation.messages[i - 1].timestamp), "yyyy-MM-dd");
                return (
                  <div key={msg.id}>
                    {showDate && (
                      <div className="text-center my-3">
                        <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                          {format(new Date(msg.timestamp), "d MMM yyyy", { locale: es })}
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
                        <div className={cn(
                          "flex items-center gap-1 mt-0.5",
                          msg.sender === "me" ? "justify-end" : "justify-start"
                        )}>
                          <span className={cn(
                            "text-[10px]",
                            msg.sender === "me" ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}>
                            {format(new Date(msg.timestamp), "HH:mm")}
                          </span>
                          {msg.sender === "me" && (
                            msg.read
                              ? <CheckCheck className="w-3 h-3 text-primary-foreground/70" />
                              : <Check className="w-3 h-3 text-primary-foreground/70" />
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

          {/* Input */}
          <div className="p-3 border-t border-border shrink-0">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex items-center gap-2"
            >
              <Button type="button" variant="ghost" size="icon" className="h-9 w-9 shrink-0">
                <Paperclip className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1"
              />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMessage.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </>
      ) : (
        /* ─── Conversation List ─── */
        <>
          {/* Search & filter */}
          <div className="p-3 space-y-2 border-b border-border shrink-0">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar conversación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9"
              />
            </div>
            <div className="flex gap-1">
              {([
                { key: "all", label: "Todos", icon: MessageSquare },
                { key: "operator", label: "Operarios", icon: Wrench },
                { key: "collaborator", label: "Colaboradores", icon: Handshake },
              ] as const).map((f) => (
                <Button
                  key={f.key}
                  variant={filter === f.key ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f.key)}
                  className="text-xs gap-1 flex-1"
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                </Button>
              ))}
            </div>
          </div>

          <ScrollArea className="flex-1">
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
                        {format(new Date(conv.lastMessageTime), "HH:mm")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <p className="text-xs text-muted-foreground truncate pr-2">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <Badge className="text-[10px] h-4 w-4 p-0 flex items-center justify-center rounded-full shrink-0">
                          {conv.unread}
                        </Badge>
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
                <div className="p-8 text-center text-sm text-muted-foreground">
                  No hay conversaciones
                </div>
              )}
            </div>
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
        <div
          className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card"
          style={{ backgroundColor: `hsl(${conversation.color})` }}
        />
      )}
    </div>
  );
}
