import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Delivery {
  id: string;
  nf_number: string;
  nf_series: string;
  nf_date: string;
  nf_value: number;
  nf_file_url: string | null;
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
  cancellation_reason: string | null;
  seller_company?: {
    id: string;
    name: string;
    address?: string;
  };
  buyer_company?: {
    id: string;
    name: string;
    address?: string;
  };
  created_at: string;
}

export interface DeliveryFilters {
  search: string;
  status: string;
  companyId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
}

export const useDeliveries = (customFilters?: DeliveryFilters) => {
  const { profile } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [allDeliveries, setAllDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const ITEMS_PER_PAGE = 50;

  const [filters, setFilters] = useState<DeliveryFilters>(
    customFilters || {
      search: "",
      status: "all",
      companyId: "",
      dateFrom: undefined,
      dateTo: undefined,
    }
  );

  const fetchDeliveries = async (loadMore = false) => {
    if (!profile?.company_id) return;

    if (!loadMore) {
      setLoading(true);
      setPage(0);
    }

    try {
      let query = supabase
        .from("deliveries")
        .select(
          `
          *,
          seller_company:companies!seller_company_id(id, name),
          buyer_company:companies!buyer_company_id(id, name)
        `,
          { count: "exact" }
        )
        .or(
          `seller_company_id.eq.${profile.company_id},buyer_company_id.eq.${profile.company_id}`
        );

      // Apply search filter
      if (filters.search) {
        query = query.or(
          `nf_number.ilike.%${filters.search}%,delivery_address.ilike.%${filters.search}%`
        );
      }

      // Apply status filter
      if (filters.status && filters.status !== "all") {
        if (filters.status === "your-turn") {
          const ballWith =
            profile?.company?.type === "VENDEDOR" ? "VENDEDOR" : "COMPRADOR";
          query = query.eq("ball_with", ballWith);
        } else {
          query = query.eq("status", filters.status);
        }
      }

      // Apply company filter
      if (filters.companyId) {
        query = query.or(
          `seller_company_id.eq.${filters.companyId},buyer_company_id.eq.${filters.companyId}`
        );
      }

      // Apply date range filter
      if (filters.dateFrom) {
        query = query.gte("created_at", filters.dateFrom.toISOString());
      }
      if (filters.dateTo) {
        const endOfDay = new Date(filters.dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte("created_at", endOfDay.toISOString());
      }

      // Pagination
      const from = loadMore ? (page + 1) * ITEMS_PER_PAGE : 0;
      const to = from + ITEMS_PER_PAGE - 1;

      const { data, error, count } = await query
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const newDeliveries = data as Delivery[];

      if (loadMore) {
        setDeliveries((prev) => [...prev, ...newDeliveries]);
        setPage((p) => p + 1);
      } else {
        setDeliveries(newDeliveries);
        setAllDeliveries(newDeliveries);
      }

      setHasMore(
        count ? (loadMore ? page + 1 : 0) * ITEMS_PER_PAGE + newDeliveries.length < count : false
      );
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
    allDeliveries,
    loading,
    filters,
    setFilters,
    hasMore,
    loadMore: () => fetchDeliveries(true),
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
