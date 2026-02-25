import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  id: string;
  text: string;
  sender: "me" | "them";
  created_at: string;
  read: boolean;
  conversation_id: string;
}

export interface Conversation {
  id: string;
  name: string;
  type: "operator" | "collaborator";
  photo: string | null;
  color: string | null;
  online: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unread: number;
  messages: ChatMessage[];
}

export function useChat() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
    const { data: convRows } = await supabase
      .from("conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (!convRows) return;

    const { data: msgRows } = await supabase
      .from("chat_messages")
      .select("*")
      .order("created_at", { ascending: true });

    const messages = (msgRows || []) as ChatMessage[];

    const mapped: Conversation[] = convRows.map((c: any) => {
      const msgs = messages.filter((m) => m.conversation_id === c.id);
      const last = msgs[msgs.length - 1];
      const unread = msgs.filter((m) => m.sender === "them" && !m.read).length;
      return {
        id: c.id,
        name: c.name,
        type: c.type as "operator" | "collaborator",
        photo: c.photo,
        color: c.color,
        online: c.online,
        lastMessage: last?.text || "",
        lastMessageTime: last?.created_at || c.created_at,
        unread,
        messages: msgs,
      };
    });

    setConversations(mapped);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Realtime subscription for new messages
  useEffect(() => {
    const channel = supabase
      .channel("chat-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages" },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchConversations]);

  const sendMessage = useCallback(async (conversationId: string, text: string) => {
    await supabase.from("chat_messages").insert({
      conversation_id: conversationId,
      text,
      sender: "me",
      read: true,
    });
  }, []);

  const markAsRead = useCallback(async (conversationId: string) => {
    // Optimistic update: immediately clear unread count locally
    setConversations((prev) =>
      prev.map((c) =>
        c.id === conversationId
          ? { ...c, unread: 0, messages: c.messages.map((m) => ({ ...m, read: true })) }
          : c
      )
    );

    await supabase
      .from("chat_messages")
      .update({ read: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "them")
      .eq("read", false);
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  return { conversations, loading, totalUnread, sendMessage, markAsRead };
}
