import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, X, Calendar as CalendarIcon, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { usePartners } from "@/hooks/usePartners";

export interface DeliveryFilters {
  search: string;
  status: string;
  companyId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

interface AdvancedFiltersProps {
  filters: DeliveryFilters;
  onFiltersChange: (filters: DeliveryFilters) => void;
  onExport: () => void;
  totalResults: number;
}

export function AdvancedFilters({
  filters,
  onFiltersChange,
  onExport,
  totalResults,
}: AdvancedFiltersProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const { partners } = usePartners();
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        handleFilterChange("search", localSearch);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [localSearch]);

  // Sync filters with URL params
  useEffect(() => {
    const newFilters: DeliveryFilters = {
      search: searchParams.get("search") || "",
      status: searchParams.get("status") || "all",
      companyId: searchParams.get("company") || "",
      dateFrom: searchParams.get("from")
        ? new Date(searchParams.get("from")!)
        : undefined,
      dateTo: searchParams.get("to")
        ? new Date(searchParams.get("to")!)
        : undefined,
    };

    if (JSON.stringify(newFilters) !== JSON.stringify(filters)) {
      onFiltersChange(newFilters);
    }
  }, [searchParams]);

  const handleFilterChange = (key: keyof DeliveryFilters, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);

    // Update URL params
    const params = new URLSearchParams(searchParams);
    if (value && value !== "all" && value !== "") {
      if (value instanceof Date) {
        params.set(key, value.toISOString().split("T")[0]);
      } else {
        params.set(key, value);
      }
    } else {
      params.delete(key);
    }
    setSearchParams(params);
  };

  const clearFilters = () => {
    setLocalSearch("");
    onFiltersChange({
      search: "",
      status: "all",
      companyId: "",
      dateFrom: undefined,
      dateTo: undefined,
    });
    setSearchParams({});
  };

  const hasActiveFilters =
    filters.search ||
    filters.status !== "all" ||
    filters.companyId ||
    filters.dateFrom ||
    filters.dateTo;

  const quickDateFilters = [
    {
      label: "Última semana",
      getValue: () => {
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        return { from: weekAgo, to: now };
      },
    },
    {
      label: "Último mês",
      getValue: () => {
        const now = new Date();
        const monthAgo = new Date(now);
        monthAgo.setMonth(now.getMonth() - 1);
        return { from: monthAgo, to: now };
      },
    },
    {
      label: "Últimos 3 meses",
      getValue: () => {
        const now = new Date();
        const threeMonthsAgo = new Date(now);
        threeMonthsAgo.setMonth(now.getMonth() - 3);
        return { from: threeMonthsAgo, to: now };
      },
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{totalResults} resultado(s) encontrado(s)</span>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download className="mr-2 h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {/* Search Input */}
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por NF, empresa, endereço..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status}
          onValueChange={(value) => handleFilterChange("status", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os status</SelectItem>
            <SelectItem value="your-turn">Aguardando resposta</SelectItem>
            <SelectItem value="CONFIRMADA">Confirmadas</SelectItem>
            <SelectItem value="EM_TRANSITO">Em Trânsito</SelectItem>
            <SelectItem value="ENTREGUE">Entregues</SelectItem>
            <SelectItem value="CANCELADA">Canceladas</SelectItem>
          </SelectContent>
        </Select>

        {/* Company Filter */}
        <Select
          value={filters.companyId}
          onValueChange={(value) => handleFilterChange("companyId", value)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Empresa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Todas as empresas</SelectItem>
            {partners.map((partner) => (
              <SelectItem key={partner.id} value={partner.id}>
                {partner.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "justify-start text-left font-normal",
                !filters.dateFrom && !filters.dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {filters.dateFrom && filters.dateTo
                ? `${format(filters.dateFrom, "dd/MM")} - ${format(
                    filters.dateTo,
                    "dd/MM"
                  )}`
                : "Período"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <div className="space-y-4 p-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Atalhos</p>
                <div className="flex flex-col gap-1">
                  {quickDateFilters.map((filter) => (
                    <Button
                      key={filter.label}
                      variant="ghost"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const dates = filter.getValue();
                        handleFilterChange("dateFrom", dates.from);
                        handleFilterChange("dateTo", dates.to);
                      }}
                    >
                      {filter.label}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Período customizado</p>
                <div className="grid gap-2">
                  <Calendar
                    mode="single"
                    selected={filters.dateFrom}
                    onSelect={(date) => handleFilterChange("dateFrom", date)}
                    locale={ptBR}
                    className={cn("pointer-events-auto")}
                  />
                  <div className="text-sm text-center">até</div>
                  <Calendar
                    mode="single"
                    selected={filters.dateTo}
                    onSelect={(date) => handleFilterChange("dateTo", date)}
                    locale={ptBR}
                    disabled={(date) =>
                      filters.dateFrom ? date < filters.dateFrom : false
                    }
                    className={cn("pointer-events-auto")}
                  />
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-8 px-2 lg:px-3"
        >
          <X className="mr-2 h-4 w-4" />
          Limpar Filtros
        </Button>
      )}
    </div>
  );
}
