import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";

interface Message {
  id: string;
  message: string;
  created_at: string;
  user_id: string;
  user?: {
    full_name: string;
    company_id: string;
  };
}

interface DeliveryChatProps {
  deliveryId: string;
  sellerCompanyId: string;
  buyerCompanyId: string;
}

export const DeliveryChat = ({
  deliveryId,
  sellerCompanyId,
  buyerCompanyId,
}: DeliveryChatProps) => {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("delivery_messages")
        .select(
          `
          *,
          user:users(full_name, company_id)
        `
        )
        .eq("delivery_id", deliveryId)
        .order("created_at", { ascending: true });

      if (error) {
        console.error("Error fetching messages:", error);
        return;
      }

      setMessages(data as any);
      setTimeout(scrollToBottom, 100);
    };

    fetchMessages();

    // Real-time subscription
    const channel = supabase
      .channel(`messages-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "delivery_messages",
          filter: `delivery_id=eq.${deliveryId}`,
        },
        () => {
          fetchMessages();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !profile) return;

    setSending(true);
    try {
      // Insert message
      const { error: messageError } = await supabase
        .from("delivery_messages")
        .insert({
          delivery_id: deliveryId,
          user_id: profile.id,
          message: newMessage.trim(),
        });

      if (messageError) throw messageError;

      // Create notifications for other company users
      const otherCompanyId =
        profile.company_id === sellerCompanyId
          ? buyerCompanyId
          : sellerCompanyId;

      const { data: otherUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", otherCompanyId);

      if (otherUsers && otherUsers.length > 0) {
        const notifications = otherUsers.map((user) => ({
          user_id: user.id,
          delivery_id: deliveryId,
          type: "MESSAGE_RECEIVED",
          title: "Nova mensagem",
          message: `${profile.full_name} enviou uma mensagem`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      setNewMessage("");
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h3 className="font-semibold text-lg mb-4">Mensagens</h3>
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 min-h-[300px] max-h-[500px]">
        {messages.map((msg) => {
          const isMyMessage = msg.user_id === profile?.id;
          return (
            <div
              key={msg.id}
              className={`flex gap-2 ${isMyMessage ? "flex-row-reverse" : ""}`}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>
                  {msg.user?.full_name?.charAt(0) || "?"}
                </AvatarFallback>
              </Avatar>
              <div
                className={`flex flex-col ${isMyMessage ? "items-end" : ""}`}
              >
                <div
                  className={`rounded-lg px-3 py-2 max-w-[300px] ${
                    isMyMessage
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}
                >
                  <p className="text-sm break-words">{msg.message}</p>
                </div>
                <span className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(msg.created_at), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </span>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="flex gap-2">
        <Textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          className="resize-none"
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <Button
          onClick={sendMessage}
          disabled={!newMessage.trim() || sending}
          size="icon"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
