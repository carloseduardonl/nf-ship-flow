import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Search, Loader2 } from "lucide-react";
import { DeliverySection } from "@/components/deliveries/DeliverySection";
import { useDeliveries } from "@/hooks/useDeliveries";

const MyDeliveries = () => {
  const navigate = useNavigate();
  const {
    loading,
    filters,
    setFilters,
    yourTurnDeliveries,
    confirmedDeliveries,
    inTransitDeliveries,
    completedDeliveries,
    allCompletedDeliveries,
    cancelledDeliveries,
    allCancelledDeliveries,
  } = useDeliveries();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Minhas Entregas</h1>
        <Button onClick={() => navigate("/entregas/nova")}>
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrega
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por NF..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9"
          />
        </div>

        <Select
          value={filters.period}
          onValueChange={(value) => setFilters({ ...filters, period: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os períodos</SelectItem>
            <SelectItem value="week">Última semana</SelectItem>
            <SelectItem value="month">Último mês</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-4">
        <DeliverySection
          title="SUA VEZ"
          emoji="🔴"
          count={yourTurnDeliveries.length}
          deliveries={yourTurnDeliveries}
          defaultOpen={true}
          showYourTurn={true}
        />

        <DeliverySection
          title="CONFIRMADAS"
          emoji="✅"
          count={confirmedDeliveries.length}
          deliveries={confirmedDeliveries}
          defaultOpen={true}
        />

        <DeliverySection
          title="EM TRÂNSITO"
          emoji="📦"
          count={inTransitDeliveries.length}
          deliveries={inTransitDeliveries}
          defaultOpen={true}
        />

        <DeliverySection
          title="CONCLUÍDAS"
          emoji="✔️"
          count={allCompletedDeliveries.length}
          deliveries={completedDeliveries}
          allDeliveries={allCompletedDeliveries}
          defaultOpen={false}
          showViewAll={true}
        />

        <DeliverySection
          title="CANCELADAS"
          emoji="❌"
          count={allCancelledDeliveries.length}
          deliveries={cancelledDeliveries}
          allDeliveries={allCancelledDeliveries}
          defaultOpen={false}
          showViewAll={true}
        />
      </div>
    </div>
  );
};

export default MyDeliveries;
