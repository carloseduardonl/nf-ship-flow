import { Delivery } from "@/hooks/useDeliveries";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

export const exportDeliveriesToCsv = (deliveries: Delivery[]) => {
  // Definir colunas do CSV
  const headers = [
    "NF",
    "Série",
    "Data NF",
    "Valor",
    "Status",
    "Empresa Vendedora",
    "Empresa Compradora",
    "Endereço de Entrega",
    "Cidade",
    "Estado",
    "Data Proposta",
    "Horário Proposto",
    "Data Confirmada",
    "Horário Confirmado",
    "Criado em",
  ];

  // Converter entregas para linhas CSV
  const rows = deliveries.map((delivery) => {
    const proposedTime =
      delivery.proposed_time_start && delivery.proposed_time_end
        ? `${delivery.proposed_time_start.slice(0, 5)} - ${delivery.proposed_time_end.slice(0, 5)}`
        : "";

    const confirmedTime =
      delivery.confirmed_time_start && delivery.confirmed_time_end
        ? `${delivery.confirmed_time_start.slice(0, 5)} - ${delivery.confirmed_time_end.slice(0, 5)}`
        : "";

    return [
      delivery.nf_number,
      delivery.nf_series || "",
      delivery.nf_date
        ? format(new Date(delivery.nf_date), "dd/MM/yyyy", { locale: ptBR })
        : "",
      `R$ ${delivery.nf_value.toLocaleString("pt-BR", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`,
      delivery.status,
      delivery.seller_company?.name || "",
      delivery.buyer_company?.name || "",
      delivery.delivery_address,
      delivery.delivery_city,
      delivery.delivery_state,
      delivery.proposed_date
        ? format(new Date(delivery.proposed_date), "dd/MM/yyyy", {
            locale: ptBR,
          })
        : "",
      proposedTime,
      delivery.confirmed_date
        ? format(new Date(delivery.confirmed_date), "dd/MM/yyyy", {
            locale: ptBR,
          })
        : "",
      confirmedTime,
      format(new Date(delivery.created_at), "dd/MM/yyyy HH:mm", {
        locale: ptBR,
      }),
    ];
  });

  // Criar conteúdo CSV
  const csvContent = [
    headers.join(";"),
    ...rows.map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(";")
    ),
  ].join("\n");

  // Adicionar BOM para UTF-8
  const bom = "\uFEFF";
  const blob = new Blob([bom + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  // Criar link de download
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute(
    "download",
    `entregas_${format(new Date(), "yyyy-MM-dd_HHmm")}.csv`
  );
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
