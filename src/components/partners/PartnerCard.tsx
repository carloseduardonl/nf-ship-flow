import { Building2, Mail, Phone, MoreVertical, Eye } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { PartnerCompany } from "@/hooks/usePartners";
import { maskCNPJ, maskPhone } from "@/lib/masks";

interface PartnerCardProps {
  partner: PartnerCompany;
}

export function PartnerCard({ partner }: PartnerCardProps) {
  const navigate = useNavigate();

  const getTypeBadgeVariant = (type: string) => {
    return type === "VENDEDOR" ? "default" : "secondary";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-lg line-clamp-1">{partner.name}</h3>
            <p className="text-sm text-muted-foreground">{maskCNPJ(partner.cnpj)}</p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">
              Desativar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge variant={getTypeBadgeVariant(partner.type)} className="text-xs">
          {partner.type}
        </Badge>

        <div className="space-y-2 text-sm">
          {partner.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{partner.email}</span>
            </div>
          )}
          {partner.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{maskPhone(partner.phone)}</span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <div className="text-sm text-muted-foreground mb-2">
            {partner.deliveryCount || 0} entrega
            {partner.deliveryCount !== 1 ? "s" : ""} realizadas
          </div>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => navigate("/dashboard")}
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver Entregas
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
