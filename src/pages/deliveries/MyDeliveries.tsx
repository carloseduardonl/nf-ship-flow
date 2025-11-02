import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, ChevronsDown } from "lucide-react";
import { DeliverySection } from "@/components/deliveries/DeliverySection";
import { useDeliveries } from "@/hooks/useDeliveries";
import { AdvancedFilters, DeliveryFilters } from "@/components/deliveries/AdvancedFilters";
import { exportDeliveriesToCsv } from "@/lib/exportCsv";
import { toast } from "sonner";

const MyDeliveries = () => {
  const navigate = useNavigate();
  const {
    loading,
    filters,
    setFilters,
    allDeliveries,
    hasMore,
    loadMore,
    yourTurnDeliveries,
    confirmedDeliveries,
    inTransitDeliveries,
    completedDeliveries,
    allCompletedDeliveries,
    cancelledDeliveries,
    allCancelledDeliveries,
  } = useDeliveries();

  const handleFiltersChange = (newFilters: DeliveryFilters) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    try {
      exportDeliveriesToCsv(allDeliveries);
      toast.success("CSV exportado com sucesso!");
    } catch (error) {
      console.error("Error exporting CSV:", error);
      toast.error("Erro ao exportar CSV");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl md:text-3xl font-bold">Minhas Entregas</h1>
        <Button onClick={() => navigate("/entregas/nova")} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Nova Entrega
        </Button>
      </div>

      <AdvancedFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onExport={handleExport}
        totalResults={allDeliveries.length}
      />

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

      {hasMore && !loading && (
        <div className="flex justify-center pt-4">
          <Button variant="outline" onClick={loadMore} className="w-full sm:w-auto">
            <ChevronsDown className="mr-2 h-4 w-4" />
            Carregar Mais
          </Button>
        </div>
      )}
    </div>
  );
};

export default MyDeliveries;
