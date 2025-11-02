import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Delivery } from "@/hooks/useDeliveries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const DeliveryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDelivery = async () => {
      try {
        const { data, error } = await supabase
          .from("deliveries")
          .select(
            `
            *,
            seller_company:companies!seller_company_id(id, name),
            buyer_company:companies!buyer_company_id(id, name)
          `
          )
          .eq("id", id)
          .single();

        if (error) throw error;
        setDelivery(data as any);
      } catch (error) {
        console.error("Error fetching delivery:", error);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchDelivery();
  }, [id]);

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
        <Button onClick={() => navigate("/dashboard")} className="mt-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrega - NF {delivery.nf_number}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">Informações da NF</h3>
            <p>Número: {delivery.nf_number}</p>
            {delivery.nf_series && <p>Série: {delivery.nf_series}</p>}
            <p>Data: {format(new Date(delivery.nf_date), "PPP", { locale: ptBR })}</p>
            <p>
              Valor:{" "}
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(delivery.nf_value)}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Empresas</h3>
            <p>Vendedor: {delivery.seller_company?.name}</p>
            <p>Comprador: {delivery.buyer_company?.name}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Endereço de Entrega</h3>
            <p>{delivery.delivery_address}</p>
          </div>

          {delivery.proposed_date && (
            <div>
              <h3 className="font-semibold mb-2">Data/Horário Proposto</h3>
              <p>
                {format(new Date(delivery.proposed_date), "PPP", { locale: ptBR })}
                {delivery.proposed_time_start && delivery.proposed_time_end && (
                  <span>
                    {" "}
                    - {delivery.proposed_time_start.slice(0, 5)} às{" "}
                    {delivery.proposed_time_end.slice(0, 5)}
                  </span>
                )}
              </p>
            </div>
          )}

          {delivery.notes && (
            <div>
              <h3 className="font-semibold mb-2">Observações</h3>
              <p className="text-muted-foreground">{delivery.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DeliveryDetail;
