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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { ptBR } from "date-fns/locale";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";

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
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestedDate, setSuggestedDate] = useState<Date>();
  const [suggestedTimeStart, setSuggestedTimeStart] = useState("");
  const [suggestedTimeEnd, setSuggestedTimeEnd] = useState("");
  const [suggestionReason, setSuggestionReason] = useState("");
  const [cancellationReason, setCancellationReason] = useState("");
  const [receiptNotes, setReceiptNotes] = useState("");
  const [allOk, setAllOk] = useState(false);
  const [validationError, setValidationError] = useState("");

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

      // Criar notificações para ambas as partes
      const otherCompanyId =
        isBuyer ? delivery.seller_company_id : delivery.buyer_company_id;

      const { data: allUsers } = await supabase
        .from("users")
        .select("id")
        .in("company_id", [delivery.seller_company_id, delivery.buyer_company_id]);

      if (allUsers && allUsers.length > 0) {
        const confirmDate = format(
          new Date(delivery.proposed_date),
          "dd/MM/yyyy",
          { locale: ptBR }
        );
        const notifications = allUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "DELIVERY_CONFIRMED",
          title: "Entrega confirmada!",
          message: `Entrega confirmada para ${confirmDate} ${delivery.proposed_time_start.slice(0, 5)}-${delivery.proposed_time_end.slice(0, 5)}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

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
    // Validações
    if (!suggestedDate || !suggestedTimeStart || !suggestedTimeEnd) {
      setValidationError("Preencha todos os campos obrigatórios");
      return;
    }

    // Validar se data não é passada
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (suggestedDate < today) {
      setValidationError("A data não pode ser no passado");
      return;
    }

    // Validar horário
    const [startHour, startMin] = suggestedTimeStart.split(":").map(Number);
    const [endHour, endMin] = suggestedTimeEnd.split(":").map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      setValidationError("Horário de fim deve ser depois do início");
      return;
    }

    if (endMinutes - startMinutes < 60) {
      setValidationError("Diferença mínima de 1 hora entre os horários");
      return;
    }

    setValidationError("");
    setLoading(true);
    try {
      const newBallWith = isBuyer ? "VENDEDOR" : "COMPRADOR";
      const newStatus = isBuyer ? "AGUARDANDO_VENDEDOR" : "AGUARDANDO_COMPRADOR";

      // Dados antigos para o timeline
      const oldData = {
        proposed_date: delivery.proposed_date,
        proposed_time_start: delivery.proposed_time_start,
        proposed_time_end: delivery.proposed_time_end,
      };

      const newData = {
        proposed_date: suggestedDate.toISOString().split("T")[0],
        proposed_time_start: suggestedTimeStart,
        proposed_time_end: suggestedTimeEnd,
      };

      const { error } = await supabase
        .from("deliveries")
        .update({
          status: newStatus,
          ball_with: newBallWith,
          ...newData,
        })
        .eq("id", delivery.id);

      if (error) throw error;

      // Criar entrada no timeline
      const formattedDate = format(suggestedDate, "dd/MM/yyyy", { locale: ptBR });
      const description = suggestionReason
        ? `${profile?.full_name} sugeriu nova data: ${formattedDate} ${suggestedTimeStart.slice(0, 5)}-${suggestedTimeEnd.slice(0, 5)} (${suggestionReason})`
        : `${profile?.full_name} sugeriu nova data: ${formattedDate} ${suggestedTimeStart.slice(0, 5)}-${suggestedTimeEnd.slice(0, 5)}`;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "PROPOSED_NEW_DATE",
        description,
        user_id: profile?.id,
        old_data: oldData,
        new_data: newData,
      });

      // Criar notificações para outra empresa
      const otherCompanyId =
        isBuyer ? delivery.seller_company_id : delivery.buyer_company_id;

      const { data: otherUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", otherCompanyId);

      if (otherUsers && otherUsers.length > 0) {
        const notifications = otherUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "BALL_WITH_YOU",
          title: "Nova data proposta",
          message: `${profile?.full_name} sugeriu ${formattedDate} ${suggestedTimeStart.slice(0, 5)}-${suggestedTimeEnd.slice(0, 5)}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({ title: "Nova data sugerida com sucesso!" });
      setShowSuggestModal(false);
      setSuggestedDate(undefined);
      setSuggestedTimeStart("");
      setSuggestedTimeEnd("");
      setSuggestionReason("");
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
      setValidationError("O motivo do cancelamento é obrigatório");
      return;
    }

    if (cancellationReason.trim().length < 10) {
      setValidationError("Por favor, descreva melhor o motivo (mínimo 10 caracteres)");
      return;
    }

    setValidationError("");
    setLoading(true);
    try {
      const { error } = await supabase
        .from("deliveries")
        .update({
          status: "CANCELADA",
          ball_with: null,
          cancellation_reason: cancellationReason.trim(),
          cancelled_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);

      if (error) throw error;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "CANCELLED",
        description: `${profile?.full_name} cancelou a entrega: ${cancellationReason.trim()}`,
        user_id: profile?.id,
      });

      // Criar notificações para outra empresa
      const otherCompanyId =
        isBuyer ? delivery.seller_company_id : delivery.buyer_company_id;

      const { data: otherUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", otherCompanyId);

      if (otherUsers && otherUsers.length > 0) {
        const notifications = otherUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "DELIVERY_CANCELLED",
          title: "Entrega cancelada",
          message: `${profile?.full_name} cancelou a entrega NF ${delivery.nf_number}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({ 
        title: "Entrega cancelada",
        description: "A outra parte foi notificada sobre o cancelamento"
      });
      setShowCancelModal(false);
      setCancellationReason("");
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

      // Notificar comprador
      const { data: buyerUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", delivery.buyer_company_id);

      if (buyerUsers && buyerUsers.length > 0) {
        const notifications = buyerUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "IN_TRANSIT",
          title: "Entrega a caminho!",
          message: `A entrega NF ${delivery.nf_number} está em trânsito`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

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
          ball_with: null,
          completed_at: new Date().toISOString(),
        })
        .eq("id", delivery.id);

      if (error) throw error;

      const description = receiptNotes
        ? `${profile?.full_name} confirmou o recebimento. Obs: ${receiptNotes}`
        : `${profile?.full_name} confirmou o recebimento`;

      await supabase.from("delivery_timeline").insert({
        delivery_id: delivery.id,
        action: "DELIVERED",
        description,
        user_id: profile?.id,
      });

      // Notificar vendedor
      const { data: sellerUsers } = await supabase
        .from("users")
        .select("id")
        .eq("company_id", delivery.seller_company_id);

      if (sellerUsers && sellerUsers.length > 0) {
        const notifications = sellerUsers.map((user) => ({
          user_id: user.id,
          delivery_id: delivery.id,
          type: "DELIVERED",
          title: "Entrega concluída!",
          message: `${profile?.full_name} confirmou o recebimento da NF ${delivery.nf_number}`,
        }));

        await supabase.from("notifications").insert(notifications);
      }

      toast({
        title: "Entrega concluída! 🎉",
        description: "O vendedor foi notificado sobre o recebimento",
      });
      setShowReceiveModal(false);
      setReceiptNotes("");
      setAllOk(false);
      onUpdate();
    } catch (error) {
      console.error("Error confirming delivery:", error);
      toast({
        title: "Erro ao confirmar recebimento",
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
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Sugerir Nova Data/Horário</DialogTitle>
              <DialogDescription>
                Sugira uma nova data e horário para a entrega
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label className="required">Data *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !suggestedDate && "text-muted-foreground"
                      )}
                    >
                      {suggestedDate ? (
                        format(suggestedDate, "PPP", { locale: ptBR })
                      ) : (
                        <span>Selecione uma data</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={suggestedDate}
                      onSelect={setSuggestedDate}
                      locale={ptBR}
                      disabled={(date) => {
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        return date < today;
                      }}
                      className={cn("pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="required">Horário Início *</Label>
                  <Input
                    type="time"
                    value={suggestedTimeStart}
                    onChange={(e) => setSuggestedTimeStart(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="required">Horário Fim *</Label>
                  <Input
                    type="time"
                    value={suggestedTimeEnd}
                    onChange={(e) => setSuggestedTimeEnd(e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label>Motivo/Observação</Label>
                <Textarea
                  value={suggestionReason}
                  onChange={(e) => setSuggestionReason(e.target.value)}
                  placeholder="Explique o motivo da mudança (recomendado)..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {suggestionReason.length}/500 caracteres
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowSuggestModal(false);
                  setValidationError("");
                }}
              >
                Cancelar
              </Button>
              <Button onClick={suggestNewDate} disabled={loading}>
                {loading ? "Enviando..." : "Enviar Proposta"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancelar Entrega</DialogTitle>
              <DialogDescription>
                Esta ação não pode ser desfeita
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Tem certeza?</strong> Esta ação não pode ser desfeita. A
                  outra parte será notificada sobre o cancelamento.
                </AlertDescription>
              </Alert>
              {validationError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <div>
                <Label className="required">Motivo do cancelamento *</Label>
                <Textarea
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Descreva o motivo do cancelamento..."
                  rows={4}
                  maxLength={1000}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {cancellationReason.length}/1000 caracteres (mínimo 10)
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCancelModal(false);
                  setValidationError("");
                }}
              >
                Não, voltar
              </Button>
              <Button
                variant="destructive"
                onClick={cancelDelivery}
                disabled={loading}
              >
                {loading ? "Cancelando..." : "Sim, cancelar"}
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
    isSeller
  ) {
    // Permitir marcar como em trânsito se a data confirmada é hoje ou passou
    const confirmedDate = new Date(delivery.confirmed_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    confirmedDate.setHours(0, 0, 0, 0);

    if (confirmedDate <= today) {
      return (
        <Button onClick={markInTransit} disabled={loading}>
          📦 Marcar como Em Trânsito
        </Button>
      );
    }
  }

  if (delivery.status === "EM_TRANSITO" && isBuyer) {
    return (
      <>
        <Button onClick={() => setShowReceiveModal(true)} disabled={loading}>
          ✔️ Confirmar Recebimento
        </Button>

        <Dialog open={showReceiveModal} onOpenChange={setShowReceiveModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirmar Recebimento</DialogTitle>
              <DialogDescription>
                A entrega foi recebida conforme esperado?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="allOk"
                  checked={allOk}
                  onCheckedChange={(checked) => setAllOk(checked as boolean)}
                />
                <Label
                  htmlFor="allOk"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Tudo OK, sem problemas
                </Label>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Adicione alguma observação sobre o recebimento (opcional)..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {receiptNotes.length}/500 caracteres
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setShowReceiveModal(false);
                  setReceiptNotes("");
                  setAllOk(false);
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={confirmReceived}
                disabled={loading || !allOk}
              >
                {loading ? "Confirmando..." : "Confirmar Recebimento"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return null;
};
