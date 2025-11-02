import { useState } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { ptBR } from "date-fns/locale";

interface DeliveryActionsProps {
  delivery: any;
  onUpdate: () => void;
}

export const DeliveryActions = ({
  delivery,
  onUpdate,
}: DeliveryActionsProps) => {
  const { profile } = useAuth();
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState<Date>();
  const [suggestedTimeStart, setSuggestedTimeStart] = useState("");
  const [suggestedTimeEnd, setSuggestedTimeEnd] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");

  const isBuyer = profile?.company_id === delivery.buyer_company_id;
  const isSeller = profile?.company_id === delivery.seller_company_id;
  const isMyTurn =
    (delivery.ball_with === "COMPRADOR" && isBuyer) ||
    (delivery.ball_with === "VENDEDOR" && isSeller);

  const confirmDate = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "CONFIRMADA",
          ball_with: null,
          confirmed_date: delivery.proposed_date,
          confirmed_time_start: delivery.proposed_time_start,
          confirmed_time_end: delivery.proposed_time_end,
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "CONFIRMED",
        description: `${profile?.full_name} confirmou a data de entrega`,
        user_id: profile?.id,
      });

      toast({ title: "Data confirmada com sucesso!" });
      onUpdate();
    } catch (error) {
      console.error("Error confirming date:", error);
      toast({
        title: "Erro ao confirmar data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const suggestNewDate = async () => {
    if (!suggestedDate || !suggestedTimeStart || !suggestedTimeEnd) {
      toast({
        title: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const newBallWith = isBuyer ? "VENDEDOR" : "COMPRADOR";

      const { error } = await supabase
        .from("deliveries")
        .update({
          status: isBuyer ? "AGUARDANDO_VENDEDOR" : "AGUARDANDO_COMPRADOR",
          ball_with: newBallWith,
          proposed_date: suggestedDate.toISOString().split("T")[0],
          proposed_time_start: suggestedTimeStart,
          proposed_time_end: suggestedTimeEnd,
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "PROPOSED_DATE",
        description: `${profile?.full_name} sugeriu uma nova data`,
        user_id: profile?.id,
      });

      toast({ title: "Nova data sugerida!" });
      setShowSuggestModal(false);
      onUpdate();
    } catch (error) {
      console.error("Error suggesting date:", error);
      toast({
        title: "Erro ao sugerir data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const cancelDelivery = async () => {
    if (!cancellationReason.trim()) {
      toast({
        title: "Digite o motivo do cancelamento",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "CANCELADA",
          ball_with: null,
          cancellation_reason: cancellationReason,
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "CANCELLED",
        description: `${profile?.full_name} cancelou a entrega`,
        user_id: profile?.id,
      });

      toast({ title: "Entrega cancelada" });
      setShowCancelModal(false);
      onUpdate();
    } catch (error) {
      console.error("Error cancelling delivery:", error);
      toast({
        title: "Erro ao cancelar entrega",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markInTransit = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "EM_TRANSITO",
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "IN_TRANSIT",
        description: `${profile?.full_name} marcou a entrega como em trânsito`,
        user_id: profile?.id,
      });

      toast({ title: "Entrega marcada como em trânsito" });
      onUpdate();
    } catch (error) {
      console.error("Error marking in transit:", error);
      toast({
        title: "Erro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmReceived = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "ENTREGUE",
          completed_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "DELIVERED",
        description: `${profile?.full_name} confirmou o recebimento`,
        user_id: profile?.id,
      });

      toast({ title: "Recebimento confirmado!" });
      onUpdate();
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast({
        title: "Erro",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (
    delivery.status === "AGUARDANDO_COMPRADOR" &&
    isBuyer &&
    isMyTurn
  ) {
    return (
      <>
        <div className="bg-red-500/10 border border-red-500 rounded-lg p-4">
          <p className="font-semibold text-red-700 dark:text-red-400 mb-4">
            🔴 É SUA VEZ - Você precisa confirmar ou sugerir outra data
          </p>
          <div className="flex gap-2 flex-wrap">
            <Button onClick={confirmDate} disabled={loading}>
              ✅ Confirmar Data
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowSuggestModal(true)}
            >
              📝 Sugerir Outra
            </Button>
            <Button
              variant="destructive"
              onClick={() => setShowCancelModal(true)}
            >
              ❌ Cancelar
            </Button>
          </div>
        </div>

        <Dialog open={showSuggestModal} onOpenChange={setShowSuggestModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sugerir Nova Data</DialogTitle>
              <DialogDescription>
                Sugira uma nova data e horário para a entrega
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Data</Label>
                <Calendar
                  mode="single"
                  selected={suggestedDate}
                  onSelect={setSuggestedDate}
                  locale={ptBR}
                  disabled={(date) =>
                    date < new Date(new Date().setHours(0, 0, 0, 0))
                  }
                  className="rounded-md border"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Horário Início</Label>
                  <Input
                    type="time"
                    value={suggestedTimeStart}
                    onChange={(e) => setSuggestedTimeStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label>Horário Fim</Label>
                  <Input
                    type="time"
                    value={suggestedTimeEnd}
                    onChange={(e) => setSuggestedTimeEnd(e.target.value)}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowSuggestModal(false)}
              >
                Cancelar
              </Button>
              <Button onClick={suggestNewDate} disabled={loading}>
                Sugerir
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Entrega</DialogTitle>
              <DialogDescription>
                Digite o motivo do cancelamento
              </DialogDescription>
            </DialogHeader>
            <Textarea
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              placeholder="Motivo do cancelamento..."
              rows={4}
            />
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(false)}
              >
                Voltar
              </Button>
              <Button
                variant="destructive"
                onClick={cancelDelivery}
                disabled={loading}
              >
                Confirmar Cancelamento
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  if (
    delivery.status === "AGUARDANDO_VENDEDOR" &&
    isSeller &&
    isMyTurn
  ) {
    return (
      <div className="bg-blue-500/10 border border-blue-500 rounded-lg p-4">
        <p className="font-semibold text-blue-700 dark:text-blue-400 mb-4">
          🔵 É SUA VEZ - Analise a contraproposta
        </p>
        <div className="flex gap-2 flex-wrap">
          <Button onClick={confirmDate} disabled={loading}>
            ✅ Aceitar Proposta
          </Button>
          <Button
            variant="outline"
            onClick={() => setShowSuggestModal(true)}
          >
            📝 Sugerir Outra
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowCancelModal(true)}
          >
            ❌ Cancelar
          </Button>
        </div>
      </div>
    );
  }

  if (
    delivery.status === "CONFIRMADA" &&
    isSeller &&
    delivery.confirmed_date === new Date().toISOString().split("T")[0]
  ) {
    return (
      <Button onClick={markInTransit} disabled={loading}>
        📦 Marcar como Em Trânsito
      </Button>
    );
  }

  if (delivery.status === "EM_TRANSITO" && isBuyer) {
    return (
      <Button onClick={confirmReceived} disabled={loading}>
        ✔️ Confirmar Recebimento
      </Button>
    );
  }

  return null;
};
