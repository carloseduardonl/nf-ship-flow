import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Delivery {
  id: string;
  nf_number: string;
  nf_series: string;
  nf_date: string;
  nf_value: number;
  delivery_address: string;
  delivery_city: string;
  delivery_state: string;
  proposed_date: string | null;
  proposed_time_start: string | null;
  proposed_time_end: string | null;
  confirmed_date: string | null;
  confirmed_time_start: string | null;
  confirmed_time_end: string | null;
  status: string;
  ball_with: string | null;
  seller_company_id: string;
  buyer_company_id: string;
  notes: string | null;
  seller_company?: {
    id: string;
    name: string;
  };
  buyer_company?: {
    id: string;
    name: string;
  };
  created_at: string;
}

export const useDeliveries = () => {
  const { profile } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    companyId: "",
    period: "all",
  });

  const fetchDeliveries = async () => {
    if (!profile?.company_id) return;

    setLoading(true);
    try {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          seller_company:companies!seller_company_id(id, name),
          buyer_company:companies!buyer_company_id(id, name)
        `
        )
        .or(
          `seller_company_id.eq.${profile.company_id},buyer_company_id.eq.${profile.company_id}`
        );

      // Apply filters
      if (filters.search) {
        query = query.ilike("nf_number", `%${filters.search}%`);
      }

      if (filters.companyId) {
        query = query.or(
          `seller_company_id.eq.${filters.companyId},buyer_company_id.eq.${filters.companyId}`
        );
      }

      if (filters.period !== "all") {
        const now = new Date();
        let startDate = new Date();

        if (filters.period === "week") {
          startDate.setDate(now.getDate() - 7);
        } else if (filters.period === "month") {
          startDate.setMonth(now.getMonth() - 1);
        }

        query = query.gte("created_at", startDate.toISOString());
      }

      const { data, error } = await query.order("created_at", {
        ascending: false,
      });

      if (error) throw error;

      setDeliveries(data as Delivery[]);
    } catch (error) {
      console.error("Error fetching deliveries:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeliveries();
  }, [profile?.company_id, filters]);

  // Real-time subscription
  useEffect(() => {
    if (!profile?.company_id) return;

    const channel = supabase
      .channel("deliveries-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
        },
        (payload) => {
          console.log("Delivery change received:", payload);
          fetchDeliveries();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.company_id]);

  const yourTurnDeliveries = deliveries.filter((d) => {
    const companyType = profile?.company?.type;
    if (companyType === "VENDEDOR") return d.ball_with === "VENDEDOR";
    if (companyType === "COMPRADOR") return d.ball_with === "COMPRADOR";
    return d.ball_with === companyType;
  });

  const confirmedDeliveries = deliveries
    .filter((d) => d.status === "CONFIRMADA")
    .sort((a, b) => {
      const dateA = new Date(a.confirmed_date || a.proposed_date || "");
      const dateB = new Date(b.confirmed_date || b.proposed_date || "");
      return dateA.getTime() - dateB.getTime();
    });

  const inTransitDeliveries = deliveries
    .filter((d) => d.status === "EM_TRANSITO")
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

  const completedDeliveries = deliveries.filter((d) => d.status === "ENTREGUE");

  const cancelledDeliveries = deliveries.filter((d) => d.status === "CANCELADA");

  return {
    deliveries,
    loading,
    filters,
    setFilters,
    yourTurnDeliveries,
    confirmedDeliveries,
    inTransitDeliveries,
    completedDeliveries: completedDeliveries.slice(0, 10),
    allCompletedDeliveries: completedDeliveries,
    cancelledDeliveries: cancelledDeliveries.slice(0, 5),
    allCancelledDeliveries: cancelledDeliveries,
    refetch: fetchDeliveries,
  };
};
