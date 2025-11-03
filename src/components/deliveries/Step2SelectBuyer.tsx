import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, ArrowRight, Search, Plus, Loader2, Building2 } from "lucide-react";
import { usePartners, PartnerCompany } from "@/hooks/usePartners";
import { AddPartnerModal } from "./AddPartnerModal";
import { maskCNPJ } from "@/lib/masks";

interface Step2SelectBuyerProps {
  selectedBuyerId?: string;
  onSelectBuyer: (buyerId: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function Step2SelectBuyer({
  selectedBuyerId,
  onSelectBuyer,
  onNext,
  onBack,
}: Step2SelectBuyerProps) {
  const { partners, loading, addPartner } = usePartners();
  const [search, setSearch] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredPartners = partners.filter((partner) =>
    partner.name.toLowerCase().includes(search.toLowerCase()) ||
    partner.cnpj.includes(search.replace(/\D/g, ""))
  );

  const handleAddPartner = async (data: Omit<PartnerCompany, "id" | "deliveryCount">) => {
    const companyId = await addPartner(data);
    if (companyId) {
      onSelectBuyer(companyId);
    }
    return companyId;
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Nova Entrega - Passo 2 de 3</CardTitle>
          <CardDescription>Para quem você vai entregar?</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar empresa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground" />
              <div>
                <p className="font-medium">Nenhuma empresa encontrada</p>
                <p className="text-sm text-muted-foreground">
                  {search
                    ? "Tente buscar por outro termo"
                    : "Adicione uma empresa parceira para começar"}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Selecione a empresa compradora *</Label>
              <RadioGroup value={selectedBuyerId} onValueChange={onSelectBuyer}>
                <div className="space-y-3">
                  {filteredPartners.map((partner) => (
                    <div
                      key={partner.id}
                      className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent cursor-pointer"
                    >
                      <RadioGroupItem value={partner.id} id={partner.id} />
                      <Label htmlFor={partner.id} className="flex-1 cursor-pointer">
                        <div className="font-semibold">{partner.name}</div>
                        <div className="text-sm text-muted-foreground">
                          CNPJ: {maskCNPJ(partner.cnpj)}
                        </div>
                        {partner.address && (
                          <div className="text-sm text-muted-foreground">
                            {partner.address}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground mt-1">
                          {partner.deliveryCount || 0} entregas realizadas
                        </div>
                      </Label>
                    </div>
                  ))}
                </div>
              </RadioGroup>
            </div>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Adicionar nova empresa parceira
          </Button>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={!selectedBuyerId}
            >
              Próximo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      <AddPartnerModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={handleAddPartner}
      />
    </>
  );
}
