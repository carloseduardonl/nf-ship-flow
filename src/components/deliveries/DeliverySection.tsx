import { useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeliveryCard } from "./DeliveryCard";
import { Delivery } from "@/hooks/useDeliveries";

interface DeliverySectionProps {
  title: string;
  emoji: string;
  count: number;
  deliveries: Delivery[];
  defaultOpen?: boolean;
  showYourTurn?: boolean;
  showViewAll?: boolean;
  allDeliveries?: Delivery[];
  onViewAll?: () => void;
}

export function DeliverySection({
  title,
  emoji,
  count,
  deliveries,
  defaultOpen = true,
  showYourTurn = false,
  showViewAll = false,
  allDeliveries,
  onViewAll,
}: DeliverySectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showAll, setShowAll] = useState(false);

  const displayDeliveries = showAll && allDeliveries ? allDeliveries : deliveries;

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg bg-card">
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-3 md:p-4 h-auto hover:bg-accent"
          >
            <div className="flex items-center gap-2 md:gap-3">
              <span className="text-xl md:text-2xl">{emoji}</span>
              <span className="font-semibold text-base md:text-lg">{title}</span>
              <Badge variant="secondary" className="text-xs md:text-sm">{count}</Badge>
            </div>
            {isOpen ? (
              <ChevronDown className="h-4 w-4 md:h-5 md:w-5" />
            ) : (
              <ChevronRight className="h-4 w-4 md:h-5 md:w-5" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="p-3 md:p-4 pt-0 space-y-2 md:space-y-3">
            {displayDeliveries.length === 0 ? (
              <p className="text-center text-sm md:text-base text-muted-foreground py-6 md:py-8">
                Nenhuma entrega nesta categoria
              </p>
            ) : (
              <>
                {displayDeliveries.map((delivery) => (
                  <DeliveryCard
                    key={delivery.id}
                    delivery={delivery}
                    showYourTurn={showYourTurn}
                  />
                ))}
                {showViewAll && !showAll && allDeliveries && allDeliveries.length > deliveries.length && (
                  <Button
                    variant="outline"
                    className="w-full text-sm md:text-base"
                    onClick={() => setShowAll(true)}
                  >
                    Ver todas ({allDeliveries.length})
                  </Button>
                )}
                {showAll && (
                  <Button
                    variant="outline"
                    className="w-full text-sm md:text-base"
                    onClick={() => setShowAll(false)}
                  >
                    Mostrar menos
                  </Button>
                )}
              </>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
