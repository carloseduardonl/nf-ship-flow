import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  MessageSquare,
  Package,
} from "lucide-react";

interface TimelineEntry {
  id: string;
  action: string;
  description: string;
  created_at: string;
  user_id: string | null;
  user?: {
    full_name: string;
    company?: {
      type: string;
    };
  };
}

const getActionIcon = (action: string) => {
  switch (action) {
    case "CREATED":
      return <FileText className="h-4 w-4" />;
    case "PROPOSED_DATE":
      return <Clock className="h-4 w-4" />;
    case "CONFIRMED":
      return <CheckCircle className="h-4 w-4" />;
    case "CANCELLED":
      return <XCircle className="h-4 w-4" />;
    case "IN_TRANSIT":
      return <Truck className="h-4 w-4" />;
    case "DELIVERED":
      return <Package className="h-4 w-4" />;
    case "MESSAGE":
      return <MessageSquare className="h-4 w-4" />;
    default:
      return <Clock className="h-4 w-4" />;
  }
};

const getUserBorderColor = (userType?: string) => {
  if (!userType) return "border-muted";
  if (userType === "VENDEDOR") return "border-blue-500";
  if (userType === "COMPRADOR") return "border-red-500";
  return "border-muted";
};

export const DeliveryTimeline = ({ deliveryId }: { deliveryId: string }) => {
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);

  useEffect(() => {
    const fetchTimeline = async () => {
      const { data, error } = await supabase
        .from("delivery_timeline")
        .select(
          `
          *,
          user:users(full_name, company:companies(type))
        `
        )
        .eq("delivery_id", deliveryId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching timeline:", error);
        return;
      }

      setTimeline(data as any);
    };

    fetchTimeline();

    // Real-time subscription
    const channel = supabase
      .channel(`timeline-${deliveryId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "delivery_timeline",
          filter: `delivery_id=eq.${deliveryId}`,
        },
        () => {
          fetchTimeline();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [deliveryId]);

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Timeline</h3>
      <div className="space-y-4">
        {timeline.map((entry, index) => (
          <div key={entry.id} className="flex gap-3 relative">
            {index < timeline.length - 1 && (
              <div className="absolute left-5 top-10 bottom-0 w-0.5 bg-border" />
            )}
            <Avatar
              className={`h-10 w-10 border-2 ${getUserBorderColor(
                entry.user?.company?.type
              )}`}
            >
              <AvatarFallback>
                {entry.user?.full_name?.charAt(0) || "S"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                {getActionIcon(entry.action)}
                <span className="font-medium text-sm">
                  {entry.user?.full_name || "Sistema"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(entry.created_at), {
                    locale: ptBR,
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {entry.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
