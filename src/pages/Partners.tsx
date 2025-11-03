import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, Loader2, Building2 } from "lucide-react";
import { usePartners } from "@/hooks/usePartners";
import { PartnerCard } from "@/components/partners/PartnerCard";
import { AddPartnerModal } from "@/components/deliveries/AddPartnerModal";

const Partners = () => {
  const { partners, loading, searchTerm, setSearchTerm, addPartner, refetch } = usePartners();
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddPartner = async (data: {
    name: string;
    cnpj: string;
    email: string;
    phone: string | null;
    address: string | null;
  }) => {
    try {
      const companyId = await addPartner({
        ...data,
        type: "COMPRADOR", // Default type
      });
      return companyId;
    } catch (error: any) {
      console.error("Error adding partner:", error);
      throw error;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Empresas Parceiras</h1>
          <p className="text-muted-foreground mt-2">
            Gerencie suas empresas parceiras
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar Empresa
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou CNPJ..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {partners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            {searchTerm
              ? "Nenhuma empresa encontrada"
              : "Nenhuma empresa parceira"}
          </h2>
          <p className="text-muted-foreground mb-4">
            {searchTerm
              ? "Tente buscar com outros termos"
              : "Adicione empresas parceiras para começar a gerenciar entregas"}
          </p>
          {!searchTerm && (
            <Button onClick={() => setShowAddModal(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Empresa
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {partners.map((partner) => (
            <PartnerCard key={partner.id} partner={partner} />
          ))}
        </div>
      )}

      <AddPartnerModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onAdd={handleAddPartner}
      />
    </div>
  );
};

export default Partners;
