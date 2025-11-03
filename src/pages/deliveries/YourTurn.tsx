import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Loader2 } from "lucide-react";
import { DeliveryCard } from "@/components/deliveries/DeliveryCard";
import { useDeliveries } from "@/hooks/useDeliveries";

const YourTurn = () => {
  const { yourTurnDeliveries, loading } = useDeliveries();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Sua Vez</h1>
        <p className="text-muted-foreground mt-2">
          Entregas aguardando sua resposta
        </p>
      </div>

      {yourTurnDeliveries.length > 0 && (
        <Alert className="bg-red-500/10 border-red-500 animate-pulse">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <AlertDescription className="text-red-700 dark:text-red-400 font-semibold">
            🔴 Você tem {yourTurnDeliveries.length}{" "}
            {yourTurnDeliveries.length === 1 ? "entrega" : "entregas"} aguardando
            resposta
          </AlertDescription>
        </Alert>
      )}

      {yourTurnDeliveries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhuma entrega aguardando</h2>
          <p className="text-muted-foreground">
            Você não tem entregas que precisam de sua ação no momento.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {yourTurnDeliveries.map((delivery) => (
            <div
              key={delivery.id}
              className="border-2 border-red-500 rounded-lg animate-pulse"
            >
              <DeliveryCard delivery={delivery} showYourTurn={true} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default YourTurn;
