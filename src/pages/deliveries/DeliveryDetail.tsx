import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, FileText, ExternalLink } from "lucide-react";
import { Delivery } from "@/hooks/useDeliveries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DeliveryTimeline } from "@/components/deliveries/DeliveryTimeline";
import { DeliveryChat } from "@/components/deliveries/DeliveryChat";
import { DeliveryActions } from "@/components/deliveries/DeliveryActions";

const DeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDelivery = async () => {
    if (!id || !profile?.company_id) return;

    try {
      const { data, error } = await supabase
        .from("deliveries")
        .select(
          `
          *,
          seller_company:companies!seller_company_id(id, name, address),
          buyer_company:companies!buyer_company_id(id, name, address)
        `
        )
        .eq("id", id)
        .or(
          `seller_company_id.eq.${profile.company_id},buyer_company_id.eq.${profile.company_id}`
        )
        .single();

      if (error) throw error;
      setDelivery(data as any);
    } catch (error) {
      console.error("Error fetching delivery:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDelivery();
  }, [id, profile?.company_id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!delivery) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Entrega não encontrada</p>
        <Button onClick={() => navigate(-1)} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: any; description: string }> = {
      DRAFT: { label: "Rascunho", variant: "outline", description: "Entrega em rascunho" },
      AGUARDANDO_COMPRADOR: { 
        label: "Aguardando Comprador", 
        variant: "default", 
        description: "Aguardando confirmação do comprador" 
      },
      AGUARDANDO_VENDEDOR: { 
        label: "Aguardando Vendedor", 
        variant: "default", 
        description: "Aguardando resposta do vendedor" 
      },
      CONFIRMADA: { 
        label: "Confirmada", 
        variant: "secondary", 
        description: "Entrega confirmada e agendada" 
      },
      EM_TRANSITO: { 
        label: "Em Trânsito", 
        variant: "default", 
        description: "Mercadoria em transporte" 
      },
      ENTREGUE: { 
        label: "Entregue", 
        variant: "secondary", 
        description: "Entrega concluída" 
      },
      CANCELADA: { 
        label: "Cancelada", 
        variant: "destructive", 
        description: "Entrega cancelada" 
      },
    };

    return statusMap[status] || statusMap.DRAFT;
  };

  const statusInfo = getStatusBadge(delivery.status);
  const isMyTurn =
    (delivery.ball_with === "COMPRADOR" &&
      profile?.company_id === delivery.buyer_company_id) ||
    (delivery.ball_with === "VENDEDOR" &&
      profile?.company_id === delivery.seller_company_id);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate(-1)}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* COLUNA 1 - INFORMAÇÕES */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nota Fiscal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm text-muted-foreground">Número</p>
                <p className="font-medium">{delivery.nf_number}</p>
              </div>
              {delivery.nf_series && (
                <div>
                  <p className="text-sm text-muted-foreground">Série</p>
                  <p className="font-medium">{delivery.nf_series}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Data de Emissão</p>
                <p className="font-medium">
                  {format(new Date(delivery.nf_date), "PPP", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor</p>
                <p className="font-medium text-lg">
                  {new Intl.NumberFormat("pt-BR", {
                    style: "currency",
                    currency: "BRL",
                  }).format(delivery.nf_value)}
                </p>
              </div>
              {delivery.nf_file_url && (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => window.open(delivery.nf_file_url!, "_blank")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Ver PDF
                  <ExternalLink className="ml-2 h-3 w-3" />
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Vendedor</p>
                <p className="font-medium">{delivery.seller_company?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Comprador</p>
                <p className="font-medium">{delivery.buyer_company?.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                <p className="text-sm">{delivery.delivery_address}</p>
                <p className="text-sm">
                  {delivery.delivery_city} - {delivery.delivery_state}
                </p>
              </div>
              {delivery.proposed_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Data/Horário Proposto
                  </p>
                  <p className="font-medium">
                    {format(new Date(delivery.proposed_date), "PPP", {
                      locale: ptBR,
                    })}
                  </p>
                  {delivery.proposed_time_start && delivery.proposed_time_end && (
                    <p className="text-sm">
                      {delivery.proposed_time_start.slice(0, 5)} às{" "}
                      {delivery.proposed_time_end.slice(0, 5)}
                    </p>
                  )}
                </div>
              )}
              {delivery.confirmed_date && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Data/Horário Confirmado
                  </p>
                  <p className="font-medium">
                    {format(new Date(delivery.confirmed_date), "PPP", {
                      locale: ptBR,
                    })}
                  </p>
                  {delivery.confirmed_time_start &&
                    delivery.confirmed_time_end && (
                      <p className="text-sm">
                        {delivery.confirmed_time_start.slice(0, 5)} às{" "}
                        {delivery.confirmed_time_end.slice(0, 5)}
                      </p>
                    )}
                </div>
              )}
              {delivery.notes && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Observações
                  </p>
                  <p className="text-sm">{delivery.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Status Atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Badge variant={statusInfo.variant} className="text-base px-4 py-2">
                {statusInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {statusInfo.description}
              </p>
              {isMyTurn && (
                <Badge
                  variant="destructive"
                  className="animate-pulse text-base px-4 py-2"
                >
                  🔴 É SUA VEZ
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>

        {/* COLUNA 2 - TIMELINE */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6">
            <DeliveryTimeline deliveryId={delivery.id} />
          </CardContent>
        </Card>

        {/* COLUNA 3 - CHAT */}
        <Card className="lg:col-span-1">
          <CardContent className="pt-6 h-full">
            <DeliveryChat
              deliveryId={delivery.id}
              sellerCompanyId={delivery.seller_company_id}
              buyerCompanyId={delivery.buyer_company_id}
            />
          </CardContent>
        </Card>
      </div>

      {/* AÇÕES DINÂMICAS */}
      <DeliveryActions delivery={delivery} onUpdate={fetchDelivery} />
    </div>
  );
};

export default DeliveryDetail;
