import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, DollarSign } from "lucide-react";
import { Delivery } from "@/hooks/useDeliveries";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface DeliveryCardProps {
  delivery: Delivery;
  showYourTurn?: boolean;
}

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-500",
  AGUARDANDO_COMPRADOR: "bg-yellow-500",
  AGUARDANDO_VENDEDOR: "bg-yellow-500",
  CONFIRMADA: "bg-green-500",
  EM_TRANSITO: "bg-blue-500",
  ENTREGUE: "bg-green-600",
  CANCELADA: "bg-red-500",
};

const statusLabels: Record<string, string> = {
  DRAFT: "Rascunho",
  AGUARDANDO_COMPRADOR: "Aguardando Comprador",
  AGUARDANDO_VENDEDOR: "Aguardando Vendedor",
  CONFIRMADA: "Confirmada",
  EM_TRANSITO: "Em Trânsito",
  ENTREGUE: "Entregue",
  CANCELADA: "Cancelada",
};

export function DeliveryCard({ delivery, showYourTurn }: DeliveryCardProps) {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const isYourTurn =
    showYourTurn &&
    ((profile?.company?.type === "VENDEDOR" && delivery.ball_with === "VENDEDOR") ||
      (profile?.company?.type === "COMPRADOR" && delivery.ball_with === "COMPRADOR"));

  const otherCompany =
    profile?.company_id === delivery.seller_company_id
      ? delivery.buyer_company
      : delivery.seller_company;

  const displayDate = delivery.confirmed_date || delivery.proposed_date;
  const displayTimeStart =
    delivery.confirmed_time_start || delivery.proposed_time_start;
  const displayTimeEnd = delivery.confirmed_time_end || delivery.proposed_time_end;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex gap-2 flex-wrap">
            <Badge className={cn("text-white", statusColors[delivery.status])}>
              {statusLabels[delivery.status]}
            </Badge>
            {isYourTurn && (
              <Badge
                variant="destructive"
                className="animate-pulse font-semibold"
              >
                É SUA VEZ
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/entregas/${delivery.id}`)}
          >
            Ver Detalhes
          </Button>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-lg">
                NF {delivery.nf_number}
                {delivery.nf_series && ` - Série ${delivery.nf_series}`}
              </p>
              <p className="text-sm text-muted-foreground">{otherCompany?.name}</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-lg">{formatCurrency(delivery.nf_value)}</p>
            </div>
          </div>

          {displayDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>
                {formatDate(displayDate)}
                {displayTimeStart && displayTimeEnd && (
                  <span className="ml-2 text-muted-foreground">
                    {displayTimeStart.slice(0, 5)} - {displayTimeEnd.slice(0, 5)}
                  </span>
                )}
              </span>
            </div>
          )}

          <div className="flex items-start gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
            <span className="text-muted-foreground">
              {delivery.delivery_city} - {delivery.delivery_state}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
